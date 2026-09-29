"""app_api.py — API FUNCIONAL de la app EA Spacework (secciones 1..7).

Solo opera sobre el schema propio (`efectoancash`). Registra auditoría en `core_evento`.
Montado por `api.py` bajo el prefijo `/api/app`.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from .db import execute, execute_tx, query
from .settings import settings

S = settings.SCHEMA
router = APIRouter(prefix="/api/app", tags=["app"])

# ---------- helpers ----------

def _now_sql():
    return "now()"


def _log(entidad, entidad_id, accion, usuario_id=None, payload=None):
    try:
        execute(
            f"insert into {S}.core_evento (entidad, entidad_id, accion, usuario_id, payload)"
            " values (%s, %s, %s, %s, %s)",
            (entidad, entidad_id, accion, usuario_id, payload),
        )
    except Exception:
        pass


def _catalogo(codigo):
    return query(
        f"select ci.id, ci.codigo, ci.etiqueta, ci.color_hex, ci.orden"
        f" from {S}.core_catalogo_item ci join {S}.core_catalogo c on c.id = ci.catalogo_id"
        f" where c.dominio = %s order by ci.orden nulls last, ci.id",
        (codigo,),
    )


def _estado_id(codigo, default=None):
    r = query(
        f"select ci.id from {S}.core_catalogo_item ci join {S}.core_catalogo c on c.id = ci.catalogo_id"
        f" where c.dominio = 'ESTADO_ACTIVIDAD' and lower(ci.codigo) = lower(%s) limit 1",
        (codigo,),
    )
    return r[0]["id"] if r else default


def _usuario_actual(email: Optional[str] = None):
    sql = (
        f"select u.id, u.email, u.rol_id, u.ugt_id,"
        f" coalesce(p.nombres || ' ' || p.apellidos, u.email) as nombre"
        f" from {S}.core_usuario u left join {S}.core_persona p on p.id = u.persona_id"
    )
    params = []
    if email:
        sql += " where u.email = %s"
        params.append(email)
    sql += " order by u.id limit 1"
    r = query(sql, params)
    if not r:
        raise HTTPException(status_code=500, detail="no hay usuarios en core_usuario")
    return r[0]


# ---------- modelos ----------

class ActividadIn(BaseModel):
    act_grande_id: int
    fecha_programada: Optional[str] = None      # YYYY-MM-DD
    hora_inicio: Optional[str] = None           # HH:MM
    distrito: Optional[str] = None
    centro_poblado: Optional[str] = None
    nivel: Optional[str] = None
    especifico: Optional[str] = None
    ie_id: Optional[int] = None
    responsable_id: Optional[int] = None
    estado: Optional[str] = "programado"


class ReporteIn(BaseModel):
    descripcion: Optional[str] = None
    logro: Optional[str] = None
    n_docentes: int = 0
    n_familias: int = 0
    n_estudiantes: int = 0
    n_otros: int = 0
    marcar_ejecutado: bool = True
    evidencia_nombre: Optional[str] = None
    evidencia_url: Optional[str] = None


class IncidenciaIn(BaseModel):
    tipo: str = "incidencia"                    # incidencia | alerta
    reporte_id: Optional[int] = None
    descripcion: Optional[str] = None
    diagnostico_previo: Optional[str] = None
    nivel_semaforo: Optional[str] = None        # verde | ambar | rojo
    categoria_id: Optional[int] = None
    subcategoria_id: Optional[int] = None


class PoaIn(BaseModel):
    anio: int
    componente_id: Optional[int] = None
    ugt_id: Optional[int] = None
    nombre: str
    meta: Optional[str] = None
    responsable_id: Optional[int] = None
    alcance_macro: Optional[str] = None
    visibilidad: Optional[str] = "todos"


class ComentarioIn(BaseModel):
    texto: str
    usuario_id: Optional[int] = None


# ---------- configuración ----------

@router.get("/config")
def config(email: Optional[str] = None):
    u = _usuario_actual(email)
    return {
        "usuario": u,
        "ugts": query(f"select id, codigo, nombre, color_hex from {S}.core_ugt order by nombre"),
        "componentes": query(f"select id, codigo, nombre, color_hex from {S}.core_componente where activo order by nombre"),
        "proyectos": query(f"select id, codigo, nombre, tipo from {S}.core_proyecto where activo order by nombre"),
        "estados": _catalogo("ESTADO_ACTIVIDAD"),
        "semaforos": _catalogo("NIVEL_SEMAFORO"),
        "tipos_incidencia": _catalogo("TIPO_INCIDENCIA"),
        "periodos": query(f"select id, anio, mes from {S}.core_periodo where anio >= 2026 order by anio, mes"),
    }


# ---------- POA (actividad grande — admin) ----------

@router.get("/poa")
def poa(anio: int = 2026, ugt_id: Optional[int] = None):
    sql = (
        f"select ag.id, ag.anio, ag.nombre, ag.meta, ag.alcance_macro, ag.visibilidad,"
        f" c.nombre as componente, c.color_hex as componente_color, u.nombre as ugt,"
        f" (select count(*) from {S}.prog_actividad_pequena ap where ap.act_grande_id = ag.id) as n_actividades"
        f" from {S}.prog_poa_actividad_grande ag"
        f" left join {S}.core_componente c on c.id = ag.componente_id"
        f" left join {S}.core_ugt u on u.id = ag.ugt_id"
        f" where ag.anio = %s"
    )
    params = [anio]
    if ugt_id:
        sql += " and ag.ugt_id = %s"
        params.append(ugt_id)
    sql += " order by c.nombre nulls last, ag.nombre"
    return {"filas": query(sql, params)}


@router.post("/poa")
def crear_poa(d: PoaIn):
    existe = query(
        f"select id from {S}.prog_poa_actividad_grande where anio = %s and lower(nombre) = lower(%s)",
        (d.anio, d.nombre),
    )
    if existe:
        return {"ok": True, "id": existe[0]["id"], "duplicado": True}
    r = execute(
        f"insert into {S}.prog_poa_actividad_grande"
        " (anio, componente_id, ugt_id, nombre, meta, responsable_id, alcance_macro, visibilidad)"
        " values (%s,%s,%s,%s,%s,%s,%s,%s) returning id",
        (d.anio, d.componente_id, d.ugt_id, d.nombre, d.meta, d.responsable_id,
         d.alcance_macro, d.visibilidad),
        returning=True,
    )
    _log("prog_poa_actividad_grande", r[0]["id"], "crear", d.responsable_id, d.nombre)
    return {"ok": True, "id": r[0]["id"]}


# ---------- actividades pequeñas ----------

_ACT_SELECT = (
    "select a.id, ag.nombre as actividad, ag.anio, c.nombre as componente, c.color_hex as componente_color,"
    " u.nombre as ugt, a.fecha_programada, a.hora_inicio, a.distrito, a.centro_poblado, a.nivel, a.especifico,"
    " ie.nombre as ie_nombre, a.estado_id, ei.etiqueta as estado, ei.color_hex as estado_color,"
    " coalesce(p.nombres || ' ' || p.apellidos, '') as responsable,"
    " (select count(*) from {S}.prog_reporte r where r.act_pequena_id = a.id) as n_reportes"
    " from {S}.prog_actividad_pequena a"
    " left join {S}.prog_poa_actividad_grande ag on ag.id = a.act_grande_id"
    " left join {S}.core_componente c on c.id = ag.componente_id"
    " left join {S}.core_ugt u on u.id = ag.ugt_id"
    " left join {S}.core_ie ie on ie.id = a.ie_id"
    " left join {S}.core_usuario ru on ru.id = a.responsable_id"
    " left join {S}.core_persona p on p.id = ru.persona_id"
    " left join {S}.core_catalogo_item ei on ei.id = a.estado_id"
).format(S=S)


@router.get("/actividades")
def listar_actividades(estado: Optional[str] = None, ugt: Optional[str] = None,
                       anio: Optional[int] = None, mes: Optional[int] = None,
                       q: Optional[str] = None, limit: int = 300):
    where, params = [], []
    if estado:
        where.append("lower(ei.codigo) = lower(%s)"); params.append(estado)
    if ugt:
        where.append("u.nombre = %s"); params.append(ugt)
    if anio:
        where.append("ag.anio = %s"); params.append(anio)
    if mes:
        where.append("extract(month from a.fecha_programada) = %s"); params.append(mes)
    if q:
        where.append("(a.distrito ilike %s or a.centro_poblado ilike %s or ag.nombre ilike %s)")
        params += [f"%{q}%", f"%{q}%", f"%{q}%"]
    sql = _ACT_SELECT + (" where " + " and ".join(where) if where else "")
    sql += " order by a.fecha_programada desc nulls last, a.id desc limit %s"
    params.append(min(max(limit, 1), 1000))
    return {"filas": query(sql, params)}


@router.post("/actividades")
def crear_actividad(d: ActividadIn):
    grande = query(f"select id, componente_id from {S}.prog_poa_actividad_grande where id = %s", (d.act_grande_id,))
    if not grande:
        raise HTTPException(status_code=400, detail="la actividad grande (POA) no existe")
    est = _estado_id(d.estado or "programado")
    r = execute(
        f"insert into {S}.prog_actividad_pequena"
        " (act_grande_id, ie_id, distrito, centro_poblado, nivel, especifico, responsable_id,"
        "  fecha_programada, hora_inicio, estado_id)"
        " values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) returning id",
        (d.act_grande_id, d.ie_id, d.distrito, d.centro_poblado, d.nivel, d.especifico,
         d.responsable_id, d.fecha_programada or None, d.hora_inicio or None, est),
        returning=True,
    )
    _log("prog_actividad_pequena", r[0]["id"], "crear", d.responsable_id,
         f"{d.distrito or ''} / {d.centro_poblado or ''}")
    return {"ok": True, "id": r[0]["id"]}


@router.get("/actividades/{aid}")
def detalle_actividad(aid: int):
    r = query(_ACT_SELECT + " where a.id = %s", (aid,))
    if not r:
        raise HTTPException(status_code=404, detail="actividad no encontrada")
    reportes = query(
        f"select r.id, r.descripcion, r.logro, r.n_docentes, r.n_familias, r.n_estudiantes, r.n_otros,"
        f" r.estado, r.enviado_en from {S}.prog_reporte r where r.act_pequena_id = %s order by r.id desc",
        (aid,),
    )
    incidencias = query(
        f"select i.id, i.tipo, i.descripcion, i.diagnostico_previo, i.nivel_semaforo_id"
        f" from {S}.prog_incidencia i join {S}.prog_reporte r on r.id = i.reporte_id"
        f" where r.act_pequena_id = %s order by i.id desc",
        (aid,),
    )
    eventos = query(
        f"select e.id, e.accion, e.fecha, coalesce(p.nombres || ' ' || p.apellidos, '') as usuario"
        f" from {S}.core_evento e left join {S}.core_usuario u on u.id = e.usuario_id"
        f" left join {S}.core_persona p on p.id = u.persona_id"
        f" where e.entidad = 'prog_actividad_pequena' and e.entidad_id = %s order by e.id desc limit 50",
        (aid,),
    )
    return {"actividad": r[0], "reportes": reportes, "incidencias": incidencias, "historial": eventos}


@router.patch("/actividades/{aid}/estado")
def cambiar_estado(aid: int, estado: str = Query(...), usuario_id: Optional[int] = None):
    eid = _estado_id(estado)
    if not eid:
        raise HTTPException(status_code=400, detail=f"estado inválido: {estado}")
    extra = ""
    execute(f"update {S}.prog_actividad_pequena set estado_id = %s{extra} where id = %s", (eid, aid))
    _log("prog_actividad_pequena", aid, f"estado:{estado}", usuario_id)
    return {"ok": True, "estado": estado}


@router.delete("/actividades/{aid}")
def borrar_actividad(aid: int, usuario_id: Optional[int] = None):
    execute(f"update {S}.prog_actividad_pequena set estado_id = %s where id = %s", (_estado_id("cancelado"), aid))
    _log("prog_actividad_pequena", aid, "cancelar", usuario_id)
    return {"ok": True}


# ---------- reportes / incidencias ----------

@router.post("/actividades/{aid}/reporte")
def crear_reporte(aid: int, d: ReporteIn):
    act = query(f"select id, responsable_id from {S}.prog_actividad_pequena where id = %s", (aid,))
    if not act:
        raise HTTPException(status_code=404, detail="actividad no encontrada")
    eid = _estado_id("ejecutado")
    if d.marcar_ejecutado:
        # reporte + cambio de estado en UNA transacción (CTE)
        res = execute_tx([(
            f"with r as (insert into {S}.prog_reporte"
            " (act_pequena_id, descripcion, logro, n_docentes, n_familias, n_estudiantes, n_otros, estado, enviado_en)"
            " values (%s,%s,%s,%s,%s,%s,%s,%s,now()) returning id)"
            f" update {S}.prog_actividad_pequena set estado_id = %s where id = %s"
            " returning (select id from r) as rid",
            (aid, d.descripcion, d.logro, d.n_docentes, d.n_familias, d.n_estudiantes, d.n_otros,
             "enviado", eid, aid),
        )])
        rid = res[0][0]["rid"]
    else:
        r = execute(
            f"insert into {S}.prog_reporte"
            " (act_pequena_id, descripcion, logro, n_docentes, n_familias, n_estudiantes, n_otros, estado, enviado_en)"
            " values (%s,%s,%s,%s,%s,%s,%s,%s,now()) returning id",
            (aid, d.descripcion, d.logro, d.n_docentes, d.n_familias, d.n_estudiantes, d.n_otros, "enviado"),
            returning=True,
        )
        rid = r[0]["id"]
    if d.evidencia_nombre and d.evidencia_url:
        execute(
            f"insert into {S}.core_evidencia (nombre_archivo, url, subido_por, fecha, tipo_mime)"
            " values (%s,%s,%s,now(),%s)",
            (d.evidencia_nombre, d.evidencia_url, act[0]["responsable_id"], "image/jpeg"),
        )
    _log("prog_reporte", rid, "crear", act[0]["responsable_id"], f"actividad {aid}")
    return {"ok": True, "id": rid}


@router.get("/reportes")
def listar_reportes(ugt: Optional[str] = None, limit: int = 200):
    sql = (
        f"select r.id, r.descripcion, r.logro, r.n_docentes, r.n_familias, r.n_estudiantes, r.n_otros,"
        f" r.estado, r.enviado_en, a.id as actividad_id, ag.nombre as actividad, u.nombre as ugt,"
        f" a.distrito, a.centro_poblado"
        f" from {S}.prog_reporte r"
        f" join {S}.prog_actividad_pequena a on a.id = r.act_pequena_id"
        f" left join {S}.prog_poa_actividad_grande ag on ag.id = a.act_grande_id"
        f" left join {S}.core_ugt u on u.id = ag.ugt_id"
    )
    params = []
    if ugt:
        sql += " where u.nombre = %s"; params.append(ugt)
    sql += " order by r.enviado_en desc nulls last, r.id desc limit %s"
    params.append(min(max(limit, 1), 1000))
    return {"filas": query(sql, params)}


@router.post("/incidencias")
def crear_incidencia(d: IncidenciaIn):
    sem = None
    if d.nivel_semaforo:
        r = query(f"select ci.id from {S}.core_catalogo_item ci join {S}.core_catalogo c on c.id = ci.catalogo_id"
                  f" where c.dominio = 'NIVEL_SEMAFORO' and lower(ci.codigo) = lower(%s) limit 1", (d.nivel_semaforo,))
        sem = r[0]["id"] if r else None
    r = execute(
        f"insert into {S}.prog_incidencia"
        " (reporte_id, tipo, categoria_id, subcategoria_id, nivel_semaforo_id, diagnostico_previo, descripcion)"
        " values (%s,%s,%s,%s,%s,%s,%s) returning id",
        (d.reporte_id, d.tipo, d.categoria_id, d.subcategoria_id, sem, d.diagnostico_previo, d.descripcion),
        returning=True,
    )
    _log("prog_incidencia", r[0]["id"], f"crear:{d.tipo}")
    return {"ok": True, "id": r[0]["id"]}


@router.get("/incidencias")
def listar_incidencias(limit: int = 200):
    return {"filas": query(
        f"select i.id, i.tipo, i.descripcion, i.diagnostico_previo, r.id as reporte_id,"
        f" ag.nombre as actividad, a.distrito, a.centro_poblado"
        f" from {S}.prog_incidencia i"
        f" left join {S}.prog_reporte r on r.id = i.reporte_id"
        f" left join {S}.prog_actividad_pequena a on a.id = r.act_pequena_id"
        f" left join {S}.prog_poa_actividad_grande ag on ag.id = a.act_grande_id"
        f" order by i.id desc limit %s", (min(max(limit, 1), 1000),))}


# ---------- calendario / indicadores / historial ----------

@router.get("/calendario")
def calendario(anio: int = 2026, mes: int = 1, ugt: Optional[str] = None):
    where, params = ["extract(year from a.fecha_programada) = %s", "extract(month from a.fecha_programada) = %s"], [anio, mes]
    if ugt:
        where.append("u.nombre = %s"); params.append(ugt)
    sql = (
        f"select a.id, ag.nombre as actividad, a.distrito, a.centro_poblado, a.hora_inicio,"
        f" a.fecha_programada, ei.etiqueta as estado, ei.color_hex as estado_color, u.nombre as ugt"
        f" from {S}.prog_actividad_pequena a"
        f" left join {S}.prog_poa_actividad_grande ag on ag.id = a.act_grande_id"
        f" left join {S}.core_ugt u on u.id = ag.ugt_id"
        f" left join {S}.core_catalogo_item ei on ei.id = a.estado_id"
        f" where " + " and ".join(where) + " order by a.fecha_programada"
    )
    return {"anio": anio, "mes": mes, "filas": query(sql, params)}


@router.get("/indicadores")
def indicadores(anio: int = 2026, mes: Optional[int] = None):
    """Programadas vs reportadas (en vivo) por UGT."""
    w, p = ["ag.anio = %s"], [anio]
    if mes:
        w.append("extract(month from a.fecha_programada) = %s"); p.append(mes)
    sql = (
        f"select coalesce(u.nombre,'(sin UGT)') as ugt,"
        f" count(*) as programadas,"
        f" count(*) filter (where a.estado_id = (select ci.id from {S}.core_catalogo_item ci"
        f"   join {S}.core_catalogo c on c.id=ci.catalogo_id where c.dominio='ESTADO_ACTIVIDAD'"
        f"   and lower(ci.codigo)='ejecutado' limit 1)) as ejecutadas,"
        f" count(*) filter (where exists (select 1 from {S}.prog_reporte r where r.act_pequena_id=a.id)) as reportadas"
        f" from {S}.prog_actividad_pequena a"
        f" left join {S}.prog_poa_actividad_grande ag on ag.id=a.act_grande_id"
        f" left join {S}.core_ugt u on u.id=ag.ugt_id"
        f" where " + " and ".join(w) +
        " group by 1 order by 1"
    )
    filas = query(sql, p)
    tot = {"ugt": "TOTAL", "programadas": sum(f["programadas"] for f in filas),
           "ejecutadas": sum(f["ejecutadas"] for f in filas),
           "reportadas": sum(f["reportadas"] for f in filas)}
    return {"filas": filas, "total": tot}


@router.get("/historial")
def historial(limit: int = 100):
    ev = query(
        f"select e.id, e.entidad, e.entidad_id, e.accion, e.fecha, e.payload,"
        f" coalesce(p.nombres || ' ' || p.apellidos, 'sistema') as usuario"
        f" from {S}.core_evento e left join {S}.core_usuario u on u.id = e.usuario_id"
        f" left join {S}.core_persona p on p.id = u.persona_id"
        f" order by e.id desc limit %s", (min(max(limit, 1), 500),),
    )
    rep = query(
        f"select 'reporte' as tipo, r.id, r.enviado_en as fecha, r.descripcion as detalle, ag.nombre as actividad"
        f" from {S}.prog_reporte r left join {S}.prog_actividad_pequena a on a.id=r.act_pequena_id"
        f" left join {S}.prog_poa_actividad_grande ag on ag.id=a.act_grande_id"
        f" order by r.id desc limit 50"
    )
    return {"eventos": ev, "reportes": rep}


# ---------- extras ----------

@router.get("/buscar_ie")
def buscar_ie(q: str = "", limit: int = 20):
    if len(q.strip()) < 2:
        return {"filas": []}
    return {"filas": query(
        f"select id, cod_mod, nombre, distrito, cen_poblado, nivel from {S}.core_ie"
        f" where nombre ilike %s or cod_mod ilike %s order by nombre limit %s",
        (f"%{q}%", f"{q}%", min(limit, 50)))}


@router.post("/comentarios")
def crear_comentario(d: ComentarioIn):
    r = execute(f"insert into {S}.core_comentario (usuario_id, texto) values (%s,%s) returning id",
                (d.usuario_id, d.texto), returning=True)
    return {"ok": True, "id": r[0]["id"]}


@router.get("/comentarios")
def listar_comentarios(limit: int = 30):
    return {"filas": query(
        f"select c.id, c.texto, c.fecha, coalesce(p.nombres || ' ' || p.apellidos,'') as usuario"
        f" from {S}.core_comentario c left join {S}.core_usuario u on u.id=c.usuario_id"
        f" left join {S}.core_persona p on p.id=u.persona_id order by c.id desc limit %s",
        (min(max(limit, 1), 200),))}
