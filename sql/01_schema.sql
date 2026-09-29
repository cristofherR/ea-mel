-- ============================================================================
--  EA MEL — esquema de EJEMPLO (sintético) para reproducir la app localmente.
--  PostgreSQL 14+.  No contiene datos reales de personas ni instituciones.
--  Uso:  createdb ea_mel_demo && psql ea_mel_demo -f sql/01_schema.sql
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS efectoancash;
SET search_path TO efectoancash, public;

-- ── Capa de configuración de interfaz (la UI es DATO) ───────────────────────
CREATE TABLE IF NOT EXISTS ui_idioma (
  id        serial PRIMARY KEY,
  codigo    text NOT NULL,
  activo    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ui_texto (
  id        serial PRIMARY KEY,
  idioma_id integer NOT NULL REFERENCES ui_idioma(id),
  clave     text NOT NULL,
  valor     text NOT NULL DEFAULT '',
  UNIQUE (idioma_id, clave)
);

CREATE TABLE IF NOT EXISTS ui_tema_token (
  id      serial PRIMARY KEY,
  token   text NOT NULL UNIQUE,
  valor   text NOT NULL,
  activo  boolean NOT NULL DEFAULT true
);

CREATE VIEW vw_ui_tema_activo AS
  SELECT token, valor FROM ui_tema_token WHERE activo;

CREATE TABLE IF NOT EXISTS ui_vista (
  id            serial PRIMARY KEY,
  codigo        text NOT NULL UNIQUE,
  ruta          text NOT NULL,
  titulo_clave  text NOT NULL,
  icono         text,
  orden         integer NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ui_bloque (
  id      serial PRIMARY KEY,
  codigo  text NOT NULL UNIQUE,
  tipo    text NOT NULL,
  orden   integer NOT NULL DEFAULT 0,
  fijo    boolean NOT NULL DEFAULT false,
  ancho   text NOT NULL DEFAULT 'full'
);

CREATE TABLE IF NOT EXISTS ui_elemento (
  id          serial PRIMARY KEY,
  bloque_id   integer NOT NULL REFERENCES ui_bloque(id),
  clave       text NOT NULL,
  tipo        text NOT NULL,
  orden       integer NOT NULL DEFAULT 0,
  fuente_dato text
);

CREATE TABLE IF NOT EXISTS ui_pantalla (
  vista_id   integer NOT NULL REFERENCES ui_vista(id),
  bloque_id  integer NOT NULL REFERENCES ui_bloque(id),
  orden      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (vista_id, bloque_id)
);

CREATE VIEW vw_ui_pantalla AS
  SELECT v.codigo AS vista, b.codigo AS bloque, b.tipo AS bloque_tipo, p.orden AS bloque_orden,
         b.fijo, b.ancho,
         e.clave AS elemento, e.tipo AS elemento_tipo, e.orden AS elemento_orden, e.fuente_dato
  FROM ui_pantalla p
  JOIN ui_vista  v ON v.id = p.vista_id
  JOIN ui_bloque b ON b.id = p.bloque_id
  LEFT JOIN ui_elemento e ON e.bloque_id = b.id;

-- ── Núcleo (core_*) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core_ugt (
  id        serial PRIMARY KEY,
  codigo    text NOT NULL UNIQUE,
  nombre    text NOT NULL,
  color     text NOT NULL DEFAULT '#1f3460',
  color_hex text NOT NULL DEFAULT '#1f3460'
);

CREATE TABLE IF NOT EXISTS core_componente (
  id        serial PRIMARY KEY,
  codigo    text NOT NULL UNIQUE,
  nombre    text NOT NULL,
  color_hex text NOT NULL DEFAULT '#1f3460',
  activo    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS core_proyecto (
  id     serial PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  tipo   text NOT NULL DEFAULT 'programa',
  activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS core_periodo (
  id   serial PRIMARY KEY,
  anio integer NOT NULL,
  mes  integer NOT NULL,
  UNIQUE (anio, mes)
);

CREATE TABLE IF NOT EXISTS core_persona (
  id        serial PRIMARY KEY,
  nombres   text NOT NULL,
  apellidos text NOT NULL
);

CREATE TABLE IF NOT EXISTS core_usuario (
  id         serial PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  rol_id     integer,
  ugt_id     integer REFERENCES core_ugt(id),
  persona_id integer REFERENCES core_persona(id)
);

CREATE TABLE IF NOT EXISTS core_ie (
  id          serial PRIMARY KEY,
  cod_mod     text NOT NULL UNIQUE,
  nombre      text NOT NULL,
  distrito    text,
  cen_poblado text,
  nivel       text
);

CREATE TABLE IF NOT EXISTS core_catalogo (
  id      serial PRIMARY KEY,
  dominio text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS core_catalogo_item (
  id          serial PRIMARY KEY,
  catalogo_id integer NOT NULL REFERENCES core_catalogo(id),
  codigo      text NOT NULL,
  etiqueta    text NOT NULL,
  color_hex   text NOT NULL DEFAULT '#888888',
  orden       integer,
  UNIQUE (catalogo_id, codigo)
);

CREATE TABLE IF NOT EXISTS core_evento (
  id         serial PRIMARY KEY,
  entidad    text NOT NULL,
  entidad_id integer,
  accion     text NOT NULL,
  usuario_id integer REFERENCES core_usuario(id),
  payload    text,
  fecha      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core_comentario (
  id         serial PRIMARY KEY,
  usuario_id integer REFERENCES core_usuario(id),
  texto      text NOT NULL,
  fecha      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core_evidencia (
  id             serial PRIMARY KEY,
  nombre_archivo text NOT NULL,
  url            text,
  subido_por     integer REFERENCES core_usuario(id),
  fecha          timestamptz NOT NULL DEFAULT now(),
  tipo_mime      text
);

-- ── Programación (prog_*) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prog_poa_actividad_grande (
  id             serial PRIMARY KEY,
  anio           integer NOT NULL,
  componente_id  integer REFERENCES core_componente(id),
  ugt_id         integer REFERENCES core_ugt(id),
  nombre         text NOT NULL,
  meta           text,
  responsable_id integer REFERENCES core_usuario(id),
  alcance_macro  text,
  visibilidad    text NOT NULL DEFAULT 'todos'
);

CREATE TABLE IF NOT EXISTS prog_actividad_pequena (
  id               serial PRIMARY KEY,
  act_grande_id    integer NOT NULL REFERENCES prog_poa_actividad_grande(id),
  ie_id            integer REFERENCES core_ie(id),
  distrito         text,
  centro_poblado   text,
  nivel            text,
  especifico       text,
  responsable_id   integer REFERENCES core_usuario(id),
  fecha_programada date,
  hora_inicio      time,
  estado_id        integer REFERENCES core_catalogo_item(id)
);

CREATE TABLE IF NOT EXISTS prog_reporte (
  id              serial PRIMARY KEY,
  act_pequena_id  integer NOT NULL REFERENCES prog_actividad_pequena(id),
  descripcion     text,
  logro           text,
  n_docentes      integer NOT NULL DEFAULT 0,
  n_familias      integer NOT NULL DEFAULT 0,
  n_estudiantes   integer NOT NULL DEFAULT 0,
  n_otros         integer NOT NULL DEFAULT 0,
  estado          text NOT NULL DEFAULT 'borrador',
  enviado_en      timestamptz
);

CREATE TABLE IF NOT EXISTS prog_incidencia (
  id                 serial PRIMARY KEY,
  reporte_id         integer REFERENCES prog_reporte(id),
  tipo               text NOT NULL DEFAULT 'incidencia',
  categoria_id       integer REFERENCES core_catalogo_item(id),
  subcategoria_id    integer REFERENCES core_catalogo_item(id),
  nivel_semaforo_id  integer REFERENCES core_catalogo_item(id),
  diagnostico_previo text,
  descripcion        text
);

-- ── Vistas analíticas de ejemplo (SOLO LECTURA para el backend) ────────────
-- Espejo de participantes SIN datos personales (ni DNI, ni correo, ni celular).
CREATE OR REPLACE VIEW vw_espejo_participante AS
  SELECT a.id              AS id_participante,
         pr.nombre         AS programa,
         COALESCE(a.especifico, 'Activo') AS estatus,
         ie.cod_mod        AS cod_mod,
         ie.nombre         AS nom_ie,
         a.distrito        AS dist,
         a.centro_poblado  AS cent_pob,
         u.nombre          AS ugt,
         comp.nombre       AS ct
  FROM prog_actividad_pequena a
  JOIN prog_poa_actividad_grande ag ON ag.id = a.act_grande_id
  LEFT JOIN core_ugt u        ON u.id = ag.ugt_id
  LEFT JOIN core_componente comp ON comp.id = ag.componente_id
  LEFT JOIN core_ie ie        ON ie.id = a.ie_id
  LEFT JOIN core_proyecto pr  ON pr.nombre = ag.alcance_macro;

CREATE OR REPLACE VIEW vw_acompanamientos_2026 AS
  SELECT r.id              AS id_acompanamiento,
         a.distrito        AS distrito,
         a.centro_poblado  AS centro_poblado,
         u.nombre          AS ugt,
         comp.nombre       AS programa,
         a.fecha_programada AS fecha,
         r.descripcion     AS descripcion,
         r.n_docentes, r.n_familias, r.n_estudiantes, r.n_otros
  FROM prog_reporte r
  JOIN prog_actividad_pequena a  ON a.id = r.act_pequena_id
  JOIN prog_poa_actividad_grande ag ON ag.id = a.act_grande_id
  LEFT JOIN core_ugt u        ON u.id = ag.ugt_id
  LEFT JOIN core_componente comp ON comp.id = ag.componente_id
  WHERE a.fecha_programada >= DATE '2026-01-01';

CREATE OR REPLACE VIEW vw_renuncias_2026 AS
  SELECT i.id           AS id_renuncia,
         a.distrito     AS distrito,
         ie.nombre      AS nom_ie,
         u.nombre       AS ugel,
         comp.nombre    AS programa,
         i.descripcion  AS motivo,
         COALESCE(a.fecha_programada, DATE '2026-01-01') AS fecha_renuncia
  FROM prog_incidencia i
  JOIN prog_reporte r              ON r.id = i.reporte_id
  JOIN prog_actividad_pequena a    ON a.id = r.act_pequena_id
  JOIN prog_poa_actividad_grande ag ON ag.id = a.act_grande_id
  LEFT JOIN core_ie ie             ON ie.id = a.ie_id
  LEFT JOIN core_ugt u             ON u.id = ag.ugt_id
  LEFT JOIN core_componente comp   ON comp.id = ag.componente_id
  WHERE i.tipo = 'renuncia' AND a.fecha_programada >= DATE '2026-01-01';

CREATE OR REPLACE VIEW vw_resumen_jefe_territorial AS
  SELECT u.nombre AS ugt, comp.nombre AS ct,
         count(DISTINCT a.id) AS n_actividades,
         count(DISTINCT ie.cod_mod) AS n_participantes
  FROM prog_actividad_pequena a
  JOIN prog_poa_actividad_grande ag ON ag.id = a.act_grande_id
  LEFT JOIN core_ugt u          ON u.id = ag.ugt_id
  LEFT JOIN core_componente comp ON comp.id = ag.componente_id
  LEFT JOIN core_ie ie          ON ie.id = a.ie_id
  GROUP BY u.nombre, comp.nombre;

CREATE OR REPLACE VIEW vw_resumen_programa AS
  SELECT comp.nombre AS programa, count(DISTINCT a.id) AS n_actividades,
         count(DISTINCT ie.cod_mod) AS n_participantes,
         COALESCE(sum(r.n_docentes), 0) AS n_docentes,
         COALESCE(sum(r.n_familias), 0) AS n_familias
  FROM prog_actividad_pequena a
  JOIN prog_poa_actividad_grande ag ON ag.id = a.act_grande_id
  LEFT JOIN core_componente comp ON comp.id = ag.componente_id
  LEFT JOIN core_ie ie ON ie.id = a.ie_id
  LEFT JOIN prog_reporte r ON r.act_pequena_id = a.id
  GROUP BY comp.nombre;

CREATE OR REPLACE VIEW vw_resumen_ct AS
  SELECT COALESCE(comp.nombre, '(sin CT)') AS ct, count(DISTINCT a.id) AS n_actividades,
         count(DISTINCT ie.cod_mod) AS n_participantes
  FROM prog_actividad_pequena a
  JOIN prog_poa_actividad_grande ag ON ag.id = a.act_grande_id
  LEFT JOIN core_componente comp ON comp.id = ag.componente_id
  LEFT JOIN core_ie ie ON ie.id = a.ie_id
  GROUP BY 1;

CREATE OR REPLACE VIEW vw_resumen_formacion AS
  SELECT COALESCE(a.nivel, '(sin nivel)') AS formacion, count(DISTINCT a.id) AS n_actividades,
         count(DISTINCT ie.cod_mod) AS n_participantes
  FROM prog_actividad_pequena a
  LEFT JOIN core_ie ie ON ie.id = a.ie_id
  GROUP BY 1;
