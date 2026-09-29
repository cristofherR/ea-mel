"""settings.py — configuración por variables de entorno (.env)."""
import os
from dotenv import load_dotenv

load_dotenv()


def _int(key, default):
    try:
        return int(os.getenv(key, default))
    except (TypeError, ValueError):
        return default


def _bool(key, default=False):
    v = os.getenv(key)
    if v is None or v == "":
        return default
    return str(v).strip().lower() in ("1", "true", "yes", "si", "sí")


class Settings:
    # Base de datos (solo lectura) — sin valores por defecto: van en .env
    HOST = os.getenv("EP_HOST", "")
    PORT = _int("EP_PORT", 5432)
    DB = os.getenv("EP_DB", "")
    USER = os.getenv("EP_USER", "")
    PASSWORD = os.getenv("EP_PASSWORD", "")
    SSLMODE = os.getenv("EP_SSLMODE", "prefer")
    SCHEMA = os.getenv("EP_SCHEMA", "efectoancash")

    # Servidor
    APP_PORT = _int("APP_PORT", 8080)
    APP_PASSWORD = os.getenv("APP_PASSWORD", "")
    REQUIRE_AUTH = _bool("REQUIRE_AUTH", False)

    # Caché
    CACHE_TTL = _int("CACHE_TTL", 60)


settings = Settings()
