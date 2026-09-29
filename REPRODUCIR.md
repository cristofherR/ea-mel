# Cómo reproducir EA MEL (demo local, sin datos reales)

Todo lo de este repo se ejecuta **sin acceso a ninguna base institucional y sin datos
reales**: el esquema y los datos de ejemplo son **sintéticos** (`sql/01_schema.sql`,
`sql/02_seed_demo.sql`). El objetivo es clonar, correr los comandos y ver los mismos
resultados.

## Requisitos

- Python 3.9+ (probado en 3.12)
- PostgreSQL 14+ (para la demo local)
- `pip`/`venv` (o Docker + docker compose)

## 1. Crear la base de datos de ejemplo

```bash
createdb ea_mel_demo
psql ea_mel_demo -f sql/01_schema.sql     # tablas + vistas
psql ea_mel_demo -f sql/02_seed_demo.sql  # datos sintéticos
```

**Salida esperada** (última consulta del seed):

```
     entidad     | n
-----------------+----
 participantes   | 64
 acompanamientos | 32
 renuncias       | 4
 actividades     | 64
 IIEE            | 12
(5 rows)
```

## 2. Instalar y configurar

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e .

cp .env.example .env
# .env por defecto apunta a localhost/ea_mel_demo (ajústalo si usas otro usuario/clave)
```

## 3. Arrancar

```bash
eamel serve                 # → http://localhost:8080
```

## 4. Verificar la API (salidas esperadas)

```bash
curl -s localhost:8080/api/health
# {"ok":true,"schema":"efectoancash","app":"EA MEL"}

curl -s localhost:8080/api/panorama
# {"kpis":{"n_participantes":64,"n_ie":12,"n_acompanamientos":32,"n_renuncias":4},...}

curl -s localhost:8080/api/ui
# {"textos":{...},"tema":{...},"vistas":[{"codigo":"dashboard",...},...],"bloques":{...}}

curl -s localhost:8080/api/resumen/programa
# {"tipo":"programa","filas":[{"programa":"Lectoescritura","n_actividades":16,...},...]}

curl -s localhost:8080/api/participantes?limit=2
# {"filas":[{"id_participante":..,"programa":"..","estatus":"Activo","cod_mod":"9000001",...}]}
```

Abrir `http://localhost:8080/` devuelve el front (HTML 200).

## 5. Verificación antes de publicar

```bash
```

Recorre el repo y avisa si aparece una credencial, un host interno, un ID de hoja de
cálculo o un identificador personal. Si dice **Limpio**, se puede publicar.

## Notas de diseño

- **La UI es dato:** textos, tema, vistas y bloques salen de las tablas `ui_*`
  (ver `sql/02_seed_demo.sql`); se cambian con un `UPDATE` sin recompilar.
- El backend lee con `set_session(readonly=True)`; el espejo de participantes
  (`vw_espejo_participante`) no expone DNI/correo/celular.
- Sin credenciales ni hosts en el código: todo se lee de variables de entorno
  (ver `.env.example`).

## Privacidad

- Los datos de ejemplo son **sintéticos** (nombres `usuarioN@example.com`, IIEE `IE Demo N`,
  UGT `UGT Zona ...`). No hay personas ni instituciones reales.
- Ninguna credencial se versiona: el `.env` está en `.gitignore`.
