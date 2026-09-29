"""api.py — API REST (SOLO LECTURA) + servidor del front.

Toda la data sale del schema `efectoancash` (vistas analíticas + capa ui_*).
Nunca escribe en la base de datos.
"""
import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import ui as ui_mod
from .app_api import router as app_router
from .cache import cached
from .db import ping, query
from .settings import settings

S = settings.SCHEMA
WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

app = FastAPI(title="EA MEL · API", version="0.1.0",
              description="Backend de solo lectura para la web de equipo de Efecto Áncash.")

RESUMEN = {
    "ct": "vw_resumen_ct",
    "programa": "vw_resumen_programa",
    "formacion": "vw_resumen_formacion",
    "jefe": "vw_resumen_jefe_territorial",
}


def _auth(x_app_key: Optional[str]):
    if settings.REQUIRE_AUTH and x_app_key != settings.APP_PASSWORD:
        raise HTTPException(status_code=401, detail="clave de equipo inválida")


@app.get("/api/health")
def health():
    return {"ok": ping(), "schema": S, "app": "EA MEL"}


@app.get("/api/ui")
def ui():
    return ui_mod.get_ui()


@app.post("/api/login")
def login(payload: dict):
    if str(payload.get("clave", "")) == settings.APP_PASSWORD:
        return {"ok": True}
    raise HTTPException(status_code=401, detail="clave inválida")


@cached(settings.CACHE_TTL)
def _panorama():
    kpis = query(
        "select count(distinct id_participante) as n_participantes, "
        "count(distinct cod_mod) as n_ie from %s.vw_espejo_participante" % S)[0]
    kpis["n_acompanamientos"] = query("select count(*) as n from %s.vw_acompanamientos_2026" % S)[0]["n"]
    kpis["n_renuncias"] = query("select count(*) as n from %s.vw_renuncias_2026" % S)[0]["n"]
    return {
        "kpis": kpis,
        "por_ugt": query("select * from %s.vw_resumen_jefe_territorial order by n_participantes desc" % S),
        "por_programa": query("select * from %s.vw_resumen_programa order by n_participantes desc" % S),
    }


@app.get("/api/panorama")
def panorama(x_app_key: Optional[str] = Header(None)):
    _auth(x_app_key)
    return _panorama()


@cached(settings.CACHE_TTL)
def _resumen(tipo):
    return query("select * from %s.%s" % (S, RESUMEN[tipo]))


@app.get("/api/resumen/{tipo}")
def resumen(tipo: str, x_app_key: Optional[str] = Header(None)):
    _auth(x_app_key)
    if tipo not in RESUMEN:
        raise HTTPException(status_code=404, detail="tipo inválido (ct|programa|formacion|jefe)")
    return {"tipo": tipo, "filas": _resumen(tipo)}


@app.get("/api/acompanamientos")
def acompanamientos(x_app_key: Optional[str] = Header(None),
                    ugt: Optional[str] = None, programa: Optional[str] = None,
                    limit: int = 200):
    _auth(x_app_key)
    where, params = [], []
    if ugt:
        where.append("ugt = %s"); params.append(ugt)
    if programa:
        where.append("programa = %s"); params.append(programa)
    sql = "select * from %s.vw_acompanamientos_2026" % S
    if where:
        sql += " where " + " and ".join(where)
    sql += " order by fecha desc nulls last limit %s"
    params.append(min(max(limit, 1), 1000))
    return {"filas": query(sql, params)}


@app.get("/api/renuncias")
def renuncias(x_app_key: Optional[str] = Header(None), ugt: Optional[str] = None):
    _auth(x_app_key)
    sql = "select * from %s.vw_renuncias_2026" % S
    params = []
    if ugt:
        sql += " where ugel is not null and ugel <> ''"
    # (filtro por UGT se hará al cruzar con dic_ie cuando se requiera)
    sql += " order by fecha_renuncia desc nulls last"
    return {"filas": query(sql, params)}


@app.get("/api/participantes")
def participantes(x_app_key: Optional[str] = Header(None), ugt: Optional[str] = None,
                  programa: Optional[str] = None, limit: int = 300):
    _auth(x_app_key)
    where, params = [], []
    if ugt:
        where.append("ugt = %s"); params.append(ugt)
    if programa:
        where.append("programa = %s"); params.append(programa)
    sql = ("select id_participante, programa, estatus, cod_mod, nom_ie, dist, cent_pob, ugt, ct "
           "from %s.vw_espejo_participante" % S)
    if where:
        sql += " where " + " and ".join(where)
    sql += " order by nom_ie limit %s"
    params.append(min(max(limit, 1), 1000))
    return {"filas": query(sql, params)}


@app.get("/api/ugts")
def ugts(x_app_key: Optional[str] = Header(None)):
    _auth(x_app_key)
    return {"filas": query("select nombre, color from %s.core_ugt order by nombre" % S)}


# --- app funcional (secciones 1..7) ---
app.include_router(app_router)


# --- front estático (se monta al final para no tapar /api) ---
if os.path.isdir(WEB):
    app.mount("/", StaticFiles(directory=WEB, html=True), name="web")
else:  # pragma: no cover
    @app.get("/")
    def _no_web():
        return FileResponse(__file__)
