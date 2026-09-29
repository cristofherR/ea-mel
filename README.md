# EA MEL

**Web de equipo del MEL · Efecto Áncash.** Programa actividades y muestra reportes
(KPIs y resúmenes por rol) leyendo **solo** la base de datos institucional.

- **Backend:** FastAPI (Python) — **solo lectura** sobre el schema `efectoancash`
  (vistas analíticas + capa de configuración `ui_*`).
- **Front:** HTML/CSS/JS sin bundler. Textos, tema, vistas y orden de bloques
  se leen de la BD → **se editan sin recompilar**.

> Portafolio de datos: el repo trae un **esquema y datos de ejemplo sintéticos**
> (`sql/01_schema.sql`, `sql/02_seed_demo.sql`) para que se pueda ejecutar de
> punta a punta **sin acceso a ninguna base institucional y sin datos reales**.
> Ver pasos exactos en **[REPRODUCIR.md](REPRODUCIR.md)**.

---

## Requisitos
- Python **3.9+** (probado en 3.12) · o Docker.
- Un PostgreSQL propio (para la demo local se crea uno con `sql/*.sql`).

---

## Instalación y arranque (demo local)

```bash
# 1) Base de datos de ejemplo (PostgreSQL 14+)
createdb ea_mel_demo
psql ea_mel_demo -f sql/01_schema.sql
psql ea_mel_demo -f sql/02_seed_demo.sql

# 2) Entorno Python
python3 -m venv .venv && source .venv/bin/activate
pip install -e .

# 3) Configuración
cp .env.example .env        # ajusta EP_DB/EP_USER/EP_PASSWORD si hace falta

# 4) Arrancar
eamel serve                 # http://localhost:8080
```

### Opción rápida (pipx)
```bash
pipx install .
eamel init            # crea .env y prueba la conexión
eamel serve           # http://localhost:8080
```

### Opción Docker
```bash
cp .env.example .env      # completa tus valores
docker compose up -d      # http://localhost:8080
```

### Desarrollo (un comando)
```bash
./run.sh                  # crea venv, instala -e ., levanta con --reload
```

---

## Configuración (`.env`)
| Variable | Descripción |
|---|---|
| `EP_HOST` `EP_PORT` `EP_DB` `EP_USER` `EP_PASSWORD` `EP_SSLMODE` | Conexión PostgreSQL (solo lectura) |
| `EP_SCHEMA` | Schema de trabajo (por defecto `efectoancash`) |
| `APP_PORT` | Puerto del servidor (8080) |
| `APP_PASSWORD` | Clave de equipo para entrar a la web |
| `REQUIRE_AUTH` | `true` exige la clave en cada llamada `/api` |
| `CACHE_TTL` | Segundos de caché de las consultas (60) |

> El `.env` **nunca** se sube al repo (está en `.gitignore`). No hay credenciales
> ni hosts en el código: todo sale de variables de entorno.

---

## API
| Ruta | Devuelve |
|---|---|
| `GET /api/health` | estado + schema |
| `GET /api/ui` | textos, tokens de tema, vistas y bloques (capa `ui_*`) |
| `GET /api/panorama` | KPIs + resumen por UGT y por programa |
| `GET /api/resumen/{ct\|programa\|formacion\|jefe}` | vistas de rol |
| `GET /api/acompanamientos?ugt=&programa=&limit=` | acompañamientos 2026 |
| `GET /api/renuncias` | renuncias 2026 |
| `GET /api/participantes?ugt=&programa=` | espejo de participantes (sin PII) |
| `GET /api/ugts` | catálogo de UGT (nombre + color) |
| `POST /api/login` | valida la clave de equipo |
| `GET /api/app/*` | app funcional (POA, actividades, reportes, incidencias, historial) |

---

## Estructura
```
ea-mel/
├─ ea_mel/          # paquete Python (backend)
│  ├─ api.py              # rutas FastAPI + estáticos
│  ├─ app_api.py          # app funcional (secciones 1..7)
│  ├─ ui.py               # config de UI desde la BD
│  ├─ db.py               # pool de ESCRITURA controlada + lectura
│  ├─ settings.py         # .env
│  ├─ cache.py            # caché TTL
│  ├─ cli.py              # comando `eamel`
│  └─ web/                # front (index.html, css, js)
├─ sql/                    # esquema + datos de ejemplo SINTÉTICOS
├─ pyproject.toml
├─ .env.example
├─ Dockerfile / docker-compose.yml
└─ run.sh
```

---

## Personalizar la interfaz (sin tocar código)
Los textos, tipografía, tamaños y el orden/fijado de los bloques salen de la BD:

```sql
-- cambiar un label
UPDATE efectoancash.ui_texto SET valor = 'Panel general'
 WHERE clave = 'comun.dashboard';
```

Recarga la página y listo (la caché dura `CACHE_TTL` segundos).

---

## Notas
- Las lecturas analíticas se hacen con conexión en modo `readonly`.
- El espejo de participantes (`vw_espejo_participante`) **no** expone DNI/correo/celular.
- Licencia **MIT** (ver `LICENSE`).
