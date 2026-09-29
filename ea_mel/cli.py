"""cli.py — línea de comandos de EA MEL.

Comandos:
  eamel serve [--host 0.0.0.0] [--port 8080] [--reload]
  eamel init                       crea el .env y prueba la conexión
  eamel version
"""
import argparse
import os
import sys

from . import __version__

ENV_TEMPLATE = """# === Base de datos PostgreSQL (solo lectura) ===
EP_HOST=localhost
EP_PORT=5432
EP_DB=ea_mel_demo
EP_USER=postgres
EP_PASSWORD=CAMBIA_ESTO
EP_SSLMODE=prefer
EP_SCHEMA=efectoancash

# === Servidor web ===
APP_PORT=8080
APP_PASSWORD=CAMBIA_ESTO
REQUIRE_AUTH=false
CACHE_TTL=60
"""


def cmd_version(_args):
    print("EA MEL %s" % __version__)


def cmd_init(_args):
    dst = os.path.join(os.getcwd(), ".env")
    if os.path.exists(dst):
        print("· Ya existe %s (no lo sobrescribo)." % dst)
    else:
        with open(dst, "w", encoding="utf-8") as fh:
            fh.write(ENV_TEMPLATE)
        print("· Creado %s" % dst)
        print("  Edita EP_PASSWORD (y APP_PASSWORD) antes de arrancar.")
    # prueba de conexión
    try:
        from dotenv import dotenv_values
        import psycopg2
        cfg = dotenv_values(dst)
        if cfg.get("EP_PASSWORD") in (None, "", "CAMBIA_ESTO"):
            print("· Aún no configuras EP_PASSWORD → salto la prueba de conexión.")
            return
        conn = psycopg2.connect(host=cfg["EP_HOST"], port=int(cfg.get("EP_PORT", 5432)),
                                dbname=cfg["EP_DB"], user=cfg["EP_USER"],
                                password=cfg["EP_PASSWORD"], sslmode=cfg.get("EP_SSLMODE", "require"),
                                connect_timeout=20)
        conn.set_session(readonly=True)
        cur = conn.cursor()
        cur.execute("select count(*) from information_schema.tables where table_schema=%s", (cfg["EP_SCHEMA"],))
        print("· Conexión OK · schema `%s` con %d objetos." % (cfg["EP_SCHEMA"], cur.fetchone()[0]))
        conn.close()
    except Exception as e:  # pragma: no cover
        print("· No se pudo conectar todavía: %s" % str(e).splitlines()[0])
        sys.exit(1)


def cmd_serve(args):
    import uvicorn
    print("EA MEL · http://%s:%d" % (args.host if args.host != "0.0.0.0" else "localhost", args.port))
    uvicorn.run("ea_mel.api:app", host=args.host, port=args.port, reload=args.reload)


def main(argv=None):
    p = argparse.ArgumentParser(prog="eamel", description="EA MEL — web de equipo Efecto Áncash")
    p.add_argument("--version", action="version", version="EA MEL %s" % __version__)
    sub = p.add_subparsers(dest="cmd")

    s = sub.add_parser("serve", help="arranca el servidor web")
    s.add_argument("--host", default=os.getenv("APP_HOST", "0.0.0.0"))
    s.add_argument("--port", type=int, default=int(os.getenv("APP_PORT", "8080")))
    s.add_argument("--reload", action="store_true", help="recarga en caliente (desarrollo)")
    s.set_defaults(func=cmd_serve)

    i = sub.add_parser("init", help="crea el .env y prueba la conexión")
    i.set_defaults(func=cmd_init)

    v = sub.add_parser("version", help="muestra la versión")
    v.set_defaults(func=cmd_version)

    args = p.parse_args(argv)
    if not getattr(args, "func", None):
        return cmd_serve(argparse.Namespace(host="0.0.0.0", port=int(os.getenv("APP_PORT", "8080")), reload=False))
    args.func(args)


if __name__ == "__main__":
    main()
