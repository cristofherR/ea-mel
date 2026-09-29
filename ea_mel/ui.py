"""ui.py — arma la configuración de interfaz desde las tablas `ui_*` / vistas `vw_ui_*`.

La UI es DATO: textos, tokens de tema, vistas, bloques y elementos vienen de la BD.
"""
from .cache import cached
from .db import query
from .settings import settings

S = settings.SCHEMA


@cached(settings.CACHE_TTL)
def get_ui():
    textos = {r["clave"]: r["valor"] for r in query(
        "select t.clave, t.valor from %s.ui_texto t "
        "join %s.ui_idioma i on i.id = t.idioma_id where i.activo" % (S, S))}
    tema = {r["token"]: r["valor"] for r in query(
        "select token, valor from %s.vw_ui_tema_activo" % S)}
    vistas = query(
        "select codigo, ruta, titulo_clave, icono, orden from %s.ui_vista "
        "where activo order by orden" % S)
    pantalla = query("select * from %s.vw_ui_pantalla" % S)

    bloques = {}
    for r in pantalla:
        por_vista = bloques.setdefault(r["vista"], {})
        bl = por_vista.setdefault(r["bloque"], {
            "codigo": r["bloque"], "tipo": r["bloque_tipo"], "orden": r["bloque_orden"],
            "fijo": r["fijo"], "ancho": r["ancho"], "elementos": []})
        if r.get("elemento"):
            bl["elementos"].append({
                "clave": r["elemento"], "tipo": r["elemento_tipo"],
                "orden": r["elemento_orden"], "fuente_dato": r["fuente_dato"]})

    return {
        "textos": textos,
        "tema": tema,
        "vistas": vistas,
        "bloques": {v: sorted(b.values(), key=lambda x: x["orden"]) for v, b in bloques.items()},
    }
