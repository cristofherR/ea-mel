"""db.py — pool de conexiones de SOLO LECTURA + helper de consulta.

Regla de oro: este backend nunca escribe. Cada conexión se abre en modo readonly.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

from .settings import settings

_pool = None
_wpool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = SimpleConnectionPool(
            1, 8,
            host=settings.HOST, port=settings.PORT, dbname=settings.DB,
            user=settings.USER, password=settings.PASSWORD,
            sslmode=settings.SSLMODE, connect_timeout=30,
        )
    return _pool


def query(sql, params=None):
    """Ejecuta un SELECT (readonly) y devuelve lista de dicts."""
    p = _get_pool()
    conn = p.getconn()
    try:
        conn.set_session(readonly=True, autocommit=True)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            return [dict(r) for r in cur.fetchall()] if cur.description else []
    finally:
        p.putconn(conn)


def _get_wpool():
    """Pool de ESCRITURA (solo tablas propias del schema efectoancash)."""
    global _wpool
    if _wpool is None:
        _wpool = SimpleConnectionPool(
            1, 4,
            host=settings.HOST, port=settings.PORT, dbname=settings.DB,
            user=settings.USER, password=settings.PASSWORD,
            sslmode=settings.SSLMODE, connect_timeout=30,
        )
    return _wpool


def execute(sql, params=None, returning=False):
    """Ejecuta un INSERT/UPDATE/DELETE en el schema propio y hace COMMIT.

    Devuelve las filas del RETURNING cuando `returning=True`.
    Uso exclusivo del módulo de app (nunca sobre las tablas de `reportes.*`).
    """
    p = _get_wpool()
    conn = p.getconn()
    try:
        conn.autocommit = False
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            rows = [dict(r) for r in cur.fetchall()] if (returning and cur.description) else []
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise
    finally:
        p.putconn(conn)


def execute_tx(stmts):
    """Ejecuta VARIAS sentencias en UNA sola transacción (todo o nada).

    `stmts` = lista de `(sql, params)`. Devuelve una lista con las filas
    devueltas por cada sentencia (lista vacía si no hay RETURNING).
    """
    p = _get_wpool()
    conn = p.getconn()
    try:
        conn.autocommit = False
        out = []
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            for sql, params in stmts:
                cur.execute(sql, params or ())
                out.append([dict(r) for r in cur.fetchall()] if cur.description else [])
        conn.commit()
        return out
    except Exception:
        conn.rollback()
        raise
    finally:
        p.putconn(conn)


def ping():
    return query("select 1 as ok")[0]["ok"] == 1
