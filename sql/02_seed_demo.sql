-- ============================================================================
--  EA MEL — datos de EJEMPLO (SINTÉTICOS). Ningún dato personal real.
--  Uso:  psql ea_mel_demo -f sql/02_seed_demo.sql
--  Salida esperada (al final el script imprime los conteos).
-- ============================================================================
SET search_path TO efectoancash, public;
SET client_min_messages TO warning;
SELECT setseed(0.42);

-- ── Catálogos ──────────────────────────────────────────────────────────────
INSERT INTO core_catalogo (dominio) VALUES
  ('ESTADO_ACTIVIDAD'), ('NIVEL_SEMAFORO'), ('TIPO_INCIDENCIA')
ON CONFLICT (dominio) DO NOTHING;

INSERT INTO core_catalogo_item (catalogo_id, codigo, etiqueta, color_hex, orden)
SELECT c.id, v.codigo, v.etiqueta, v.color, v.orden
FROM core_catalogo c
JOIN (VALUES
  ('ESTADO_ACTIVIDAD','programado','Programado','#1f3460',1),
  ('ESTADO_ACTIVIDAD','ejecutado','Ejecutado','#009684',2),
  ('ESTADO_ACTIVIDAD','cancelado','Cancelado','#888888',3),
  ('NIVEL_SEMAFORO','verde','Verde','#009684',1),
  ('NIVEL_SEMAFORO','ambar','Ámbar','#f0a500',2),
  ('NIVEL_SEMAFORO','rojo','Rojo','#e6332a',3),
  ('TIPO_INCIDENCIA','incidencia','Incidencia','#1f3460',1),
  ('TIPO_INCIDENCIA','alerta','Alerta','#e6332a',2)
) AS v(dominio, codigo, etiqueta, color, orden) ON v.dominio = c.dominio
ON CONFLICT (catalogo_id, codigo) DO NOTHING;

-- ── UGT / componentes / proyectos / periodos ───────────────────────────────
INSERT INTO core_ugt (codigo, nombre, color, color_hex) VALUES
  ('UGT-01','UGT Zona Norte','#1f3460','#1f3460'),
  ('UGT-02','UGT Zona Centro','#009684','#009684'),
  ('UGT-03','UGT Zona Sur','#e6332a','#e6332a'),
  ('UGT-04','UGT Zona Este','#7a5cff','#7a5cff')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO core_componente (codigo, nombre, color_hex) VALUES
  ('PDL','PDL','#1f3460'),
  ('QM','QM','#009684'),
  ('PDLD','PDLD','#e6332a'),
  ('LECTO','Lectoescritura','#f0a500')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO core_proyecto (codigo, nombre, tipo) VALUES
  ('PDL','PDL','programa'),('QM','QM','programa'),
  ('PDLD','PDLD','programa'),('LECTO','Lectoescritura','programa')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO core_periodo (anio, mes)
SELECT 2026, g FROM generate_series(1,12) g
ON CONFLICT (anio, mes) DO NOTHING;

-- ── Personas / usuarios (nombres FICTICIOS) ────────────────────────────────
INSERT INTO core_persona (nombres, apellidos) VALUES
  ('Ana','Demo'),('Beto','Demo'),('Carla','Demo'),('Diego','Demo')
ON CONFLICT DO NOTHING;

INSERT INTO core_usuario (email, rol_id, ugt_id, persona_id)
SELECT 'usuario' || p.id || '@example.com', 1, ((p.id - 1) % 4) + 1, p.id
FROM core_persona p
ON CONFLICT (email) DO NOTHING;

-- ── IIEE (códigos ficticios) ───────────────────────────────────────────────
INSERT INTO core_ie (cod_mod, nombre, distrito, cen_poblado, nivel)
SELECT '900' || lpad(g::text, 4, '0') AS cod_mod,
       'IE Demo ' || g,
       (ARRAY['Zona Norte','Zona Centro','Zona Sur','Zona Este'])[((g - 1) % 4) + 1],
       'CP Demo ' || g,
       (ARRAY['Primaria','Secundaria'])[((g - 1) % 2) + 1]
FROM generate_series(1, 12) g
ON CONFLICT (cod_mod) DO NOTHING;

-- ── POA (actividades grandes) ──────────────────────────────────────────────
INSERT INTO prog_poa_actividad_grande
  (anio, componente_id, ugt_id, nombre, meta, responsable_id, alcance_macro, visibilidad)
SELECT 2026, c.id, u.id,
       c.nombre || ' · plan ' || u.codigo,
       'meta ' || c.nombre, 1, c.nombre, 'todos'
FROM core_componente c CROSS JOIN core_ugt u
ON CONFLICT DO NOTHING;

-- ── Actividades pequeñas (una por IIEE) ────────────────────────────────────
INSERT INTO prog_actividad_pequena
  (act_grande_id, ie_id, distrito, centro_poblado, nivel, especifico, responsable_id,
   fecha_programada, hora_inicio, estado_id)
SELECT ag.id, ie.id, ie.distrito, ie.cen_poblado, ie.nivel, 'Activo',
       ((ie.id - 1) % 4) + 1,
       DATE '2026-01-01' + ((ie.id * ag.id) % 120),
       TIME '09:00',
       (SELECT ci.id FROM core_catalogo_item ci JOIN core_catalogo c ON c.id = ci.catalogo_id
         WHERE c.dominio = 'ESTADO_ACTIVIDAD' AND ci.codigo = 'programado')
FROM prog_poa_actividad_grande ag
JOIN core_ie ie ON ((ie.id + ag.id) % 3 = 0);

-- ── Reportes (la mitad de las actividades) ─────────────────────────────────
INSERT INTO prog_reporte
  (act_pequena_id, descripcion, logro, n_docentes, n_familias, n_estudiantes, n_otros, estado, enviado_en)
SELECT a.id, 'Sesión de ejemplo ' || a.id, 'Logro esperado alcanzado',
       (a.id * 3) % 20, (a.id * 5) % 40, (a.id * 11) % 120, 0, 'enviado', a.fecha_programada + TIME '15:00'
FROM prog_actividad_pequena a WHERE a.id % 2 = 0;

-- ── Incidencias y "renuncias" de ejemplo ───────────────────────────────────
INSERT INTO prog_incidencia (reporte_id, tipo, nivel_semaforo_id, diagnostico_previo, descripcion)
SELECT r.id, 'incidencia',
       (SELECT ci.id FROM core_catalogo_item ci JOIN core_catalogo c ON c.id = ci.catalogo_id
         WHERE c.dominio = 'NIVEL_SEMAFORO' AND ci.codigo = 'ambar'),
       'Demora logística', 'Incidencia de ejemplo ' || r.id
FROM prog_reporte r WHERE r.id % 5 = 0;

INSERT INTO prog_incidencia (reporte_id, tipo, descripcion)
SELECT r.id, 'renuncia', 'Renuncia voluntaria (ejemplo) ' || r.id
FROM prog_reporte r WHERE r.id % 7 = 0;

-- ── Capa de UI (textos, tema, vistas, bloques) ─────────────────────────────
INSERT INTO ui_idioma (codigo, activo) VALUES ('es', true)
ON CONFLICT DO NOTHING;

INSERT INTO ui_texto (idioma_id, clave, valor)
SELECT (SELECT id FROM ui_idioma WHERE codigo = 'es'), k.clave, k.valor
FROM (VALUES
  ('comun.dashboard','Panel general'),
  ('comun.agenda','Agenda'),
  ('comun.reportes','Reportes'),
  ('comun.participantes','Participantes'),
  ('comun.historial','Historial'),
  ('kpi.participantes','Participantes'),
  ('kpi.acompanamientos','Acompañamientos'),
  ('kpi.renuncias','Renuncias')
) AS k(clave, valor)
ON CONFLICT (idioma_id, clave) DO NOTHING;

INSERT INTO ui_tema_token (token, valor) VALUES
  ('--fs-md','16px'), ('--color-primario','#1f3460'), ('--color-acento','#009684')
ON CONFLICT (token) DO NOTHING;

INSERT INTO ui_vista (codigo, ruta, titulo_clave, icono, orden) VALUES
  ('dashboard','/','comun.dashboard','home',0),
  ('agenda','agenda','comun.agenda','calendar',1),
  ('reportes','reportes','comun.reportes','file',2),
  ('participantes','participantes','comun.participantes','users',3),
  ('historial','historial','comun.historial','clock',4)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ui_bloque (codigo, tipo, orden, fijo, ancho) VALUES
  ('kpis','kpi_grid',0,true,'full'),
  ('agenda','lista',1,false,'full')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ui_elemento (bloque_id, clave, tipo, orden, fuente_dato)
SELECT b.id, v.clave, v.tipo, v.orden, v.fuente
FROM ui_bloque b
JOIN (VALUES
  ('kpis','participantes','numero',0,'/api/panorama#kpis.n_participantes'),
  ('kpis','acompanamientos','numero',1,'/api/panorama#kpis.n_acompanamientos'),
  ('kpis','renuncias','numero',2,'/api/panorama#kpis.n_renuncias'),
  ('agenda','proximas','lista',0,'/api/acompanamientos')
) AS v(bloque, clave, tipo, orden, fuente) ON v.bloque = b.codigo
WHERE NOT EXISTS (SELECT 1 FROM ui_elemento e WHERE e.bloque_id = b.id AND e.clave = v.clave);

INSERT INTO ui_pantalla (vista_id, bloque_id, orden)
SELECT v.id, b.id, 0 FROM ui_vista v, ui_bloque b
WHERE v.codigo = 'dashboard' AND b.codigo = 'kpis'
  AND NOT EXISTS (SELECT 1 FROM ui_pantalla p WHERE p.vista_id = v.id AND p.bloque_id = b.id);

INSERT INTO ui_pantalla (vista_id, bloque_id, orden)
SELECT v.id, b.id, 1 FROM ui_vista v, ui_bloque b
WHERE v.codigo = 'agenda' AND b.codigo = 'agenda'
  AND NOT EXISTS (SELECT 1 FROM ui_pantalla p WHERE p.vista_id = v.id AND p.bloque_id = b.id);

-- ── Conteos finales (salida esperada) ──────────────────────────────────────
SELECT 'participantes' AS entidad, count(DISTINCT id_participante)::text AS n FROM vw_espejo_participante
UNION ALL SELECT 'acompanamientos', count(*)::text FROM vw_acompanamientos_2026
UNION ALL SELECT 'renuncias', count(*)::text FROM vw_renuncias_2026
UNION ALL SELECT 'actividades', count(*)::text FROM prog_actividad_pequena
UNION ALL SELECT 'IIEE', count(*)::text FROM core_ie;
