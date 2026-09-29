/* EA Spacework · app.js — SPA funcional (7 pantallas, datos reales) · v0.2 */
const $ = s => document.querySelector(s);
const el = id => document.getElementById(id);
const esc = s => (s==null?'':String(s)).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const ICONS = {
 home:"M9 2.39a1.5 1.5 0 0 1 2 0l5.5 4.94c.32.28.5.69.5 1.12v7.05c0 .83-.67 1.5-1.5 1.5H13a1.5 1.5 0 0 1-1.5-1.5V12a.5.5 0 0 0-.5-.5H9a.5.5 0 0 0-.5.5v3.5c0 .83-.67 1.5-1.5 1.5H4.5A1.5 1.5 0 0 1 3 15.5V8.45c0-.43.18-.84.5-1.12L9 2.39Zm1.33.74a.5.5 0 0 0-.66 0l-5.5 4.94a.5.5 0 0 0-.17.38v7.05c0 .28.22.5.5.5H7a.5.5 0 0 0 .5-.5V12c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5v3.5c0 .28.22.5.5.5h2.5a.5.5 0 0 0 .5-.5V8.45a.5.5 0 0 0-.17-.38l-5.5-4.94Z",
 reloj:"M10 4a6 6 0 1 1-5.98 5.54.5.5 0 1 0-1-.08A7 7 0 1 0 5 5.1V3.5a.5.5 0 0 0-1 0v3c0 .28.22.5.5.5h3a.5.5 0 0 0 0-1H5.53c1.1-1.23 2.7-2 4.47-2Zm0 2.5a.5.5 0 0 0-1 0v4c0 .28.22.5.5.5h3a.5.5 0 0 0 0-1H10V6.5Z",
 grafico:"M2.5 2c.28 0 .5.22.5.5v13c0 .83.67 1.5 1.5 1.5h13a.5.5 0 0 1 0 1h-13A2.5 2.5 0 0 1 2 15.5v-13c0-.28.22-.5.5-.5ZM12 5.5c0-.28.22-.5.5-.5h4c.28 0 .5.22.5.5v4a.5.5 0 0 1-1 0V6.7l-4.65 4.65a.5.5 0 0 1-.7 0L9 9.71l-3.15 3.14a.5.5 0 0 1-.7-.7l3.5-3.5a.5.5 0 0 1 .7 0L11 10.29 15.3 6h-2.8a.5.5 0 0 1-.5-.5Z",
 bloques:"M14.88 1.28l.35 1.07a2.2 2.2 0 0 0 1.4 1.4l1.07.35h.02a.42.42 0 0 1 0 .8l-1.07.35a2.2 2.2 0 0 0-1.4 1.4l-.35 1.07a.42.42 0 0 1-.8 0l-.35-1.07a2.23 2.23 0 0 0-1.4-1.4l-1.07-.35a.42.42 0 0 1 0-.8l1.07-.35a2.2 2.2 0 0 0 1.38-1.4l.35-1.07a.42.42 0 0 1 .8 0Zm-3.62 2.3a1.5 1.5 0 0 0-1.97-.9L3.58 4.44A2.5 2.5 0 0 0 2 6.75v5.75a1.5 1.5 0 0 0 2 1.41v-1.07l-.32.12A.5.5 0 0 1 3 12.5V6.75c0-.61.38-1.16.95-1.39l5.87-2.32a.5.5 0 0 1 .67.38c.14-.12.3-.2.46-.27ZM17.5 13c-.17 0-.34-.03-.5-.1v1.22a.5.5 0 0 1-.32.47l-6 2.37a.5.5 0 0 1-.68-.46V9.88c0-.2.13-.4.32-.47l2.92-1.16-.33-.94-2.96 1.17A1.5 1.5 0 0 0 9 9.88v6.62a1.5 1.5 0 0 0 2.05 1.4l6-2.38c.57-.23.95-.78.95-1.4v-1.2Z",
 lista:"M9 8.5c0-.28.22-.5.5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3c0-.28.22-.5.5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm0 3c0-.28.22-.5.5-.5H13a.5.5 0 0 1 0 1H9.5a.5.5 0 0 1-.5-.5Zm-1-6a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 3a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-.75 3.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM7.09 3c.2-.58.76-1 1.41-1h3c.65 0 1.2.42 1.41 1h1.59c.83 0 1.5.67 1.5 1.5v12c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-12C4 3.67 4.67 3 5.5 3h1.59ZM8.5 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3Z",
 alerta:"M9.56 3.26a.5.5 0 0 1 .88 0l6.5 12a.5.5 0 0 1-.44.74h-13a.5.5 0 0 1-.44-.74l6.5-12Zm1.76-.47a1.5 1.5 0 0 0-2.64 0l-6.5 12A1.5 1.5 0 0 0 3.5 17h13a1.5 1.5 0 0 0 1.32-2.21l-6.5-12ZM10.5 7.5a.5.5 0 0 0-1 0v4a.5.5 0 1 0 1 0v-4Z",
 calendario:"M14.5 3A2.5 2.5 0 0 1 17 5.34v9.16a2.5 2.5 0 0 1-2.34 2.5H5.5A2.5 2.5 0 0 1 3 14.66V5.5A2.5 2.5 0 0 1 5.34 3h9.16ZM16 7H4v7.5c0 .78.6 1.42 1.36 1.5h9.14c.78 0 1.42-.6 1.5-1.36V7Z"
};
const ico = n => '<svg viewBox="0 0 20 20"><path d="'+(ICONS[n]||'')+'"/></svg>';

const NAV = [
  {id:'programacion', ico:'bloques',   t:'Programación', sub:'Actividades del POA'},
  {id:'indicadores',  ico:'grafico',   t:'Indicadores',  sub:'Avance programado vs reportado'},
  {id:'historial',    ico:'reloj',     t:'Historial',    sub:'Movimientos recientes'},
  {id:'home',         ico:'home',      t:'EA Spacework', sub:'Efecto Áncash'},
  {id:'reportes',     ico:'lista',     t:'Reportes',     sub:'Reportes enviados'},
  {id:'registrar',    ico:'alerta',    t:'Registrar',    sub:'Incidencias y alertas'},
  {id:'calendario',   ico:'calendario',t:'Calendario',   sub:'Agenda del mes'}
];

const ST = { cfg:null, usuario:null, vista:'home', fUgt:'', fEstado:'', anio:2026, mes:new Date().getMonth()+1, dia:null, isAdmin:true };

async function api(path, opts){
  const r = await fetch(path, Object.assign({headers:{'Content-Type':'application/json'}}, opts||{}));
  let j = null;
  try { j = await r.json(); } catch(e){}
  if(!r.ok){ throw new Error((j && (j.detail||j.error)) || ('HTTP '+r.status)); }
  return j;
}
function toast(msg, err){
  const t = el('toast'); t.textContent = msg; t.className = 'toast'+(err?' err':''); t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(()=>{ t.hidden = true; }, 3200);
}
function openSheet(html, after){
  el('sheet').innerHTML = html; el('sheetOv').hidden = false;
  if(after) after();
}
function closeSheet(){ el('sheetOv').hidden = true; el('sheet').innerHTML=''; }
var _ov = el('sheetOv');
if (_ov) _ov.addEventListener('click', e => { if(e.target.id==='sheetOv') closeSheet(); });
function fatal(msg){
  var v = document.getElementById('view');
  if(v) v.innerHTML = '<div class="empty">⚠️ ' + esc(msg) + '<br><br>Recarga con <b>Ctrl+F5</b> y avísame.</div>';
}

function fmtFecha(f){
  if(!f) return 'sin fecha';
  const d = new Date(f); if(isNaN(d)) return String(f);
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const dd = String(d.getUTCDate()).padStart(2,'0'), mm = String(d.getUTCMonth()+1).padStart(2,'0');
  return dias[d.getUTCDay()]+'; '+dd+'/'+mm+'/'+d.getUTCFullYear();
}
function fmtHora(h){ return h ? String(h).slice(0,5) : ''; }
function fmtFechaHora(f){
  if(!f) return '';
  const d = new Date(f); if(isNaN(d)) return String(f);
  const p = n=>String(n).padStart(2,'0');
  return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' · '+p(d.getHours())+':'+p(d.getMinutes());
}
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function setHead(id){
  const s = NAV.find(n=>n.id===id) || NAV[3];
  el('hTitle').textContent = s.t; el('hSub').textContent = s.sub;
  el('btnBack').hidden = true;
}
function renderNav(){
  el('nav').innerHTML = NAV.map(s =>
    '<button data-v="'+s.id+'" class="'+(s.id===ST.vista?'active':'')+'" title="'+esc(s.t)+'">'+ico(s.ico)+'</button>').join('');
  [...el('nav').querySelectorAll('button')].forEach(b => b.onclick = () => go(b.dataset.v));
}
async function go(v){ ST.vista = v; setHead(v); renderNav(); el('view').innerHTML = '<div class="loading">Cargando…</div>';
  try { await VIEWS[v](); } catch(e){ el('view').innerHTML = '<div class="empty">Error: '+esc(e.message)+'</div>'; }
}

/* ============ VISTAS ============ */
const VIEWS = {};

VIEWS.home = async () => {
  const [ind, com] = await Promise.all([ api('/api/app/indicadores?anio='+ST.anio), api('/api/app/comentarios?limit=4') ]);
  const t = ind.total || {programadas:0,ejecutadas:0,reportadas:0};
  const u = ST.usuario ? ST.usuario.nombre.split(' ')[0] : '';
  el('view').innerHTML = ''
   + '<div class="sect">Hola '+esc(u)+' · '+ST.anio+'</div>'
   + '<div class="kpis">'
   +   '<div class="kpi"><b>'+t.programadas+'</b><span>Programadas</span></div>'
   +   '<div class="kpi"><b>'+t.ejecutadas+'</b><span>Ejecutadas</span></div>'
   +   '<div class="kpi"><b>'+t.reportadas+'</b><span>Reportadas</span></div>'
   + '</div>'
   + '<div class="sect">Acciones rápidas</div>'
   + '<button class="btn" data-a="nueva-act">➕  Nueva actividad</button>'
   + '<div class="row"><button class="btn ghost sm" data-a="nueva-poa">🏷️ Nueva del POA</button>'
   +   '<button class="btn ghost sm" data-a="nueva-inc">⚠️ Registrar incidencia</button></div>'
   + '<button class="btn soft sm" data-a="refrescar">🔄 Refrescar datos</button>'
   + '<div class="sect">Sugerencias del equipo</div>'
   + (com.filas.length ? com.filas.map(c =>
       '<div class="card" style="cursor:default"><div class="body" style="padding:10px 12px">'+esc(c.texto)
       + '<div class="hint" style="margin-top:4px">'+esc(c.usuario||'')+' · '+fmtFechaHora(c.fecha)+'</div></div></div>').join('')
     : '<div class="empty">Aún no hay comentarios.</div>')
   + '<div class="row"><input class="fld" id="cmt" placeholder="Escribe una sugerencia…">'
   +   '<button class="btn sm" style="flex:0 0 84px" id="cmtBtn">Enviar</button></div>';
  el('cmtBtn').onclick = async () => {
    const v = el('cmt').value.trim(); if(!v) return;
    try { await api('/api/app/comentarios',{method:'POST',body:JSON.stringify({texto:v,usuario_id:ST.usuario&&ST.usuario.id})});
      toast('Comentario publicado'); VIEWS.home(); } catch(e){ toast(e.message,true); }
  };
  bindActions();
};

VIEWS.indicadores = async () => {
  const ind = await api('/api/app/indicadores?anio='+ST.anio);
  const max = Math.max(1, ...ind.filas.map(f=>f.programadas));
  el('view').innerHTML = ''
   + '<div class="sect">Avance '+ST.anio+' · por UGT</div>'
   + '<div class="kpis">'
   +   '<div class="kpi"><b>'+ind.total.programadas+'</b><span>Programadas</span></div>'
   +   '<div class="kpi"><b>'+ind.total.ejecutadas+'</b><span>Ejecutadas</span></div>'
   +   '<div class="kpi"><b>'+ind.total.reportadas+'</b><span>Reportadas</span></div>'
   + '</div>'
   + (ind.filas.length ? ind.filas.map(f => {
        const w = Math.round(f.programadas/max*100), we = Math.round(f.ejecutadas/max*100);
        return '<div class="bar"><div class="top"><span>'+esc(f.ugt)+'</span><span>'+f.programadas+'</span></div>'
        + '<div class="track"><i style="width:'+w+'%;background:#c9d3e6"></i></div>'
        + '<div class="track"><i style="width:'+we+'%;background:#437a22"></i></div>'
        + '<div class="leg">🟩 Ejecutadas: '+f.ejecutadas+' · 📝 Reportadas: '+f.reportadas+'</div></div>';
      }).join('') : '<div class="empty">Sin actividades todavía.<br>Crea una actividad del POA y luego actividades específicas.</div>')
   + '<div class="hint">Verde = ejecutadas · Gris = programadas (escala por UGT). Los datos salen en vivo del backend (schema efectoancash).</div>';
};

VIEWS.historial = async () => {
  const h = await api('/api/app/historial?limit=60');
  const ev = h.eventos || [];
  el('view').innerHTML = ''
   + '<div class="sect">Últimos movimientos</div>'
   + (ev.length ? '<div class="tl">'+ev.map(e =>
        '<div class="tli"><b>'+esc(e.accion)+' · '+esc(e.entidad)+(e.entidad_id?' #'+e.entidad_id:'')+'</b>'
        + esc(e.payload||'') + '<br><time>'+fmtFechaHora(e.fecha)+' · '+esc(e.usuario)+'</time></div>').join('')+'</div>'
     : '<div class="empty">Aún no hay movimientos registrados.<br>Cada acción en la app queda auditada aquí.</div>')
   + '<div class="sect">Reportes recientes</div>'
   + ((h.reportes&&h.reportes.length) ? h.reportes.map(r =>
        '<div class="card" style="cursor:default;border-left-color:#437a22"><div class="body" style="padding:10px 12px">'
        + '<b>'+esc(r.actividad||'Actividad')+'</b><br>'+esc(r.detalle||'')+'<div class="hint">'+fmtFechaHora(r.fecha)+'</div></div></div>').join('')
     : '<div class="empty">Sin reportes aún.</div>');
};

VIEWS.programacion = async () => {
  const poa = await api('/api/app/poa?anio='+ST.anio);
  const q = [];
  if(ST.fUgt) q.push('ugt='+encodeURIComponent(ST.fUgt));
  if(ST.fEstado) q.push('estado='+ST.fEstado);
  q.push('anio='+ST.anio);
  const acts = await api('/api/app/actividades?'+q.join('&'));
  const ugts = (ST.cfg&&ST.cfg.ugts)||[];
  const ests = (ST.cfg&&ST.cfg.estados)||[];
  el('view').innerHTML = ''
   + '<div class="addbtn" id="addAct"><span>Agregar actividad específica</span>'+ico('bloques')+'</div>'
   + (poa.filas.length ? '' : '<div class="hint" style="color:#8a6500">⚠️ El POA '+ST.anio+' está vacío. Crea primero una <b>actividad del POA</b> para poder colgar actividades específicas.</div>')
   + '<div class="fila">'
   +   '<select class="fld sel" id="fUgt"><option value="">Todas las UGT</option>'
   +     ugts.map(u=>'<option value="'+esc(u.nombre)+'"'+(ST.fUgt===u.nombre?' selected':'')+'>'+esc(u.nombre)+'</option>').join('')+'</select>'
   +   '<select class="fld sel" id="fEst"><option value="">Todo estado</option>'
   +     ests.map(e=>'<option value="'+esc(e.codigo)+'"'+(ST.fEstado===e.codigo?' selected':'')+'>'+esc(e.etiqueta)+'</option>').join('')+'</select>'
   +   '<div class="clear" id="fClear">×</div>'
   + '</div>'
   + '<div class="sect">Actividades ('+acts.filas.length+')</div>'
   + (acts.filas.length ? acts.filas.map(a =>
        '<div class="card" data-id="'+a.id+'" style="border-left-color:'+esc(a.estado_color||'#0e7c70')+'">'
        + '<div class="cap">'+esc(a.actividad||'Actividad')+'</div><div class="body">'
        + '<div class="lugar">Lugar: '+esc([a.distrito,a.centro_poblado].filter(Boolean).join(' / ')||'—')+'</div>'
        + '<div>Responsable: '+esc(a.responsable||'—')+'</div>'
        + '<div>Fecha: '+fmtFecha(a.fecha_programada)+(a.hora_inicio?' · '+fmtHora(a.hora_inicio):'')+'</div>'
        + (a.ie_nombre?'<div class="hint">'+esc(a.ie_nombre)+'</div>':'')
        + '<div class="hint" style="margin-top:4px">'+esc(a.ugt||'')+' · Reportes: '+a.n_reportes+'</div></div>'
        + '<div class="pie"><span class="tag">'+esc(a.nivel||'')+'</span>'
        + '<span class="r"><span class="dot" style="background:'+esc(a.estado_color||'#888')+'"></span>'
        + '<span class="pill" style="background:'+esc(a.estado_color||'#888')+'">'+esc(a.estado||'—')+'</span></span></div></div>').join('')
     : '<div class="empty">No hay actividades con este filtro.</div>');
  el('addAct').onclick = () => formActividad(poa.filas);
  el('fUgt').onchange = e => { ST.fUgt = e.target.value; VIEWS.programacion(); };
  el('fEst').onchange = e => { ST.fEstado = e.target.value; VIEWS.programacion(); };
  el('fClear').onclick = () => { ST.fUgt=''; ST.fEstado=''; VIEWS.programacion(); };
  [...el('view').querySelectorAll('.card[data-id]')].forEach(c => c.onclick = () => detalleActividad(+c.dataset.id));
};

VIEWS.reportes = async () => {
  const r = await api('/api/app/reportes?limit=120');
  el('view').innerHTML = '<div class="sect">Reportes enviados ('+r.filas.length+')</div>'
   + (r.filas.length ? r.filas.map(x =>
      '<div class="card" style="cursor:default;border-left-color:#437a22"><div class="cap" style="background:#cfe3cf">'
      + esc(x.actividad||'Actividad')+'</div><div class="body">'
      + '<div class="lugar">'+esc([x.distrito,x.centro_poblado].filter(Boolean).join(' / ')||'—')+'</div>'
      + '<div>'+esc(x.descripcion||'')+'</div>'
      + (x.logro?'<div class="hint">Logro: '+esc(x.logro)+'</div>':'')
      + '<div class="hint" style="margin-top:4px">Docentes: '+(x.n_docentes||0)+' · Familias: '+(x.n_familias||0)
      + ' · Estudiantes: '+(x.n_estudiantes||0)+' · Otros: '+(x.n_otros||0)+'</div>'
      + '<div class="hint">'+esc(x.ugt||'')+' · '+fmtFechaHora(x.enviado_en)+'</div></div></div>').join('')
    : '<div class="empty">Todavía no hay reportes.<br>Abre una actividad → <b>Reportar</b>.</div>');
};

VIEWS.registrar = async () => {
  const inc = await api('/api/app/incidencias?limit=60');
  el('view').innerHTML = ''
   + '<button class="btn" id="addInc">⚠️  Registrar incidencia / alerta</button>'
   + '<div class="sect">Bandeja ('+inc.filas.length+')</div>'
   + (inc.filas.length ? inc.filas.map(i =>
      '<div class="card" data-i="'+i.id+'" style="border-left-color:'+(i.tipo==='alerta'?'#c05000':'#b3261e')+'">'
      + '<div class="cap" style="background:'+(i.tipo==='alerta'?'#ffe0c7':'#f6cfcb')+'">'+esc(i.tipo.toUpperCase())+'</div><div class="body">'
      + '<div>'+esc(i.descripcion||'')+'</div>'
      + (i.diagnostico_previo?'<div class="hint">Diagnóstico: '+esc(i.diagnostico_previo)+'</div>':'')
      + '<div class="hint" style="margin-top:4px">'+esc(i.actividad||'')+' · '+esc([i.distrito,i.centro_poblado].filter(Boolean).join(' / ')||'')+'</div></div></div>').join('')
    : '<div class="empty">Bandeja vacía.<br>Registra incidencias o alertas desde aquí.</div>');
  el('addInc').onclick = formIncidencia;
};

VIEWS.calendario = async () => {
  const cal = await api('/api/app/calendario?anio='+ST.anio+'&mes='+ST.mes+(ST.fUgt?'&ugt='+encodeURIComponent(ST.fUgt):''));
  const porDia = {}; cal.filas.forEach(f => { const d = f.fecha_programada ? new Date(f.fecha_programada).getUTCDate() : null; if(d){ (porDia[d]=porDia[d]||[]).push(f); } });
  const first = new Date(Date.UTC(ST.anio, ST.mes-1, 1));
  const startDow = first.getUTCDay();
  const dias = new Date(Date.UTC(ST.anio, ST.mes, 0)).getUTCDate();
  const hoy = new Date();
  let cells = '';
  for(let i=0;i<startDow;i++) cells += '<div class="cal18 out"></div>';
  for(let d=1; d<=dias; d++){
    const tiene = porDia[d] ? '<i></i>' : '';
    const cls = 'cal18'+(ST.dia===d?' sel':'')+((hoy.getMonth()+1===ST.mes&&hoy.getFullYear()===ST.anio&&hoy.getDate()===d)?' today':'');
    cells += '<div class="'+cls+'" data-d="'+d+'">'+d+tiene+'</div>';
  }
  const lista = ST.dia && porDia[ST.dia] ? porDia[ST.dia].map(f =>
      '<div class="card" data-cid="'+f.id+'" style="border-left-color:'+esc(f.estado_color||'#0e7c70')+'"><div class="body" style="padding:9px 12px">'
      + '<b>'+esc(f.actividad||'')+'</b><br>'+esc([f.distrito,f.centro_poblado].filter(Boolean).join(' / ')||'')
      + '<div class="hint">'+(f.hora_inicio?fmtHora(f.hora_inicio)+' · ':'')+esc(f.estado||'')+'</div></div></div>').join('')
    : (ST.dia ? '<div class="empty">Sin actividades ese día.</div>' : '<div class="hint">Toca un día para ver su agenda.</div>');
  el('view').innerHTML = ''
   + '<div class="fila"><div class="clear" id="mPrev">‹</div>'
   + '<div class="sel" style="justify-content:center;font-weight:800">'+MESES[ST.mes]+' '+ST.anio+'</div>'
   + '<div class="clear" id="mNext">›</div></div>'
   + '<div class="cal">'+['D','L','M','M','J','V','S'].map(d=>'<div class="dow">'+d+'</div>').join('')+cells+'</div>'
   + '<div class="sect">'+(ST.dia?('Agenda del '+ST.dia+' de '+MESES[ST.mes]):'Agenda')+'</div>' + lista;
  el('mPrev').onclick = () => { ST.mes--; if(ST.mes<1){ST.mes=12;ST.anio--;} ST.dia=null; VIEWS.calendario(); };
  el('mNext').onclick = () => { ST.mes++; if(ST.mes>12){ST.mes=1;ST.anio++;} ST.dia=null; VIEWS.calendario(); };
  [...el('view').querySelectorAll('.cal18[data-d]')].forEach(c => c.onclick = () => { ST.dia=+c.dataset.d; VIEWS.calendario(); });
  [...el('view').querySelectorAll('.card[data-cid]')].forEach(c => c.onclick = () => detalleActividad(+c.dataset.cid));
};

/* ============ ACCIONES ============ */
function bindActions(){
  const map = { 'nueva-act':()=>formActividad(null), 'nueva-poa':formPoa, 'nueva-inc':formIncidencia,
                'refrescar':()=>{ toast('Actualizando…'); VIEWS.home(); } };
  [...el('view').querySelectorAll('[data-a]')].forEach(b => b.onclick = () => (map[b.dataset.a]||(()=>{}))());
}

function optsel(id, items, valKey, txtKey, ph){
  return '<select class="fld" id="'+id+'">'+(ph!==false?'<option value="">— elegir —</option>':'')
    + items.map(i=>'<option value="'+esc(i[valKey])+'">'+esc(i[txtKey])+'</option>').join('')+'</select>';
}
function numf(id,lbl){ return '<div class="fgroup"><span class="lbl">'+lbl+'</span><input class="fld" id="'+id+'" type="number" min="0" value="0"></div>'; }
function txtf(id,lbl,val,type){ return '<div class="fgroup"><span class="lbl">'+lbl+'</span><input class="fld" id="'+id+'" type="'+(type||'text')+'" value="'+esc(val||'')+'"></div>'; }

async function formActividad(prePoas){
  let poas = prePoas;
  if(!poas){ try { poas = (await api('/api/app/poa?anio='+ST.anio)).filas; } catch(e){ poas = []; } }
  if(!poas.length){ toast('Primero crea una actividad del POA', true); return formPoa(); }
  const ests = (ST.cfg&&ST.cfg.estados)||[];
  openSheet(
    '<h3>Nueva actividad específica</h3>'
    + '<div class="fgroup"><span class="lbl">Actividad del POA</span>'+optsel('fPoa', poas, 'id','nombre')+'</div>'
    + '<div class="row">'+txtf('fFec','Fecha','','date')+txtf('fHora','Hora inicio','','time')+'</div>'
    + '<div class="row">'+txtf('fDist','Distrito')+txtf('fCp','Centro poblado')+'</div>'
    + '<div class="row">'+txtf('fNiv','Nivel')+txtf('fEsp','Específico (opcional)')+'</div>'
    + '<div class="fgroup"><span class="lbl">Buscar IE (opcional)</span>'
    +   '<input class="fld" id="fIeq" placeholder="Nombre o código…"><div id="fIer" class="chips" style="margin-top:6px"></div>'
    +   '<input type="hidden" id="fIe"></div>'
    + '<div class="fgroup"><span class="lbl">Estado</span>'+optsel('fEst', ests, 'codigo','etiqueta')+'</div>'
    + '<div class="row"><button class="btn ghost" id="cxl">Cancelar</button><button class="btn" id="ok">Guardar actividad</button></div>',
    () => {
      el('cxl').onclick = closeSheet;
      let tm; el('fIeq').oninput = e => { clearTimeout(tm); tm = setTimeout(async () => {
        const q = e.target.value.trim(); el('fIer').innerHTML='';
        if(q.length<2) return;
        try { const r = await api('/api/app/buscar_ie?q='+encodeURIComponent(q));
          el('fIer').innerHTML = r.filas.map(f => '<span class="chip" data-id="'+f.id+'">'+esc(f.nombre)+'</span>').join('');
          [...el('fIer').querySelectorAll('.chip')].forEach(c => c.onclick = () => {
            el('fIe').value = c.dataset.id; [...el('fIer').querySelectorAll('.chip')].forEach(x=>x.classList.remove('on')); c.classList.add('on'); });
        } catch(err){} }, 350); };
      el('ok').onclick = async () => {
        const body = { act_grande_id:+el('fPoa').value || null, fecha_programada:el('fFec').value||null,
          hora_inicio:el('fHora').value||null, distrito:el('fDist').value||null, centro_poblado:el('fCp').value||null,
          nivel:el('fNiv').value||null, especifico:el('fEsp').value||null, ie_id:+(el('fIe').value||0)||null,
          responsable_id:(ST.usuario&&ST.usuario.id)||null, estado:el('fEst').value||'programado' };
        if(!body.act_grande_id) return toast('Elige la actividad del POA', true);
        try { await api('/api/app/actividades',{method:'POST',body:JSON.stringify(body)});
          closeSheet(); toast('Actividad creada ✅'); go('programacion'); } catch(e){ toast(e.message,true); }
      };
    });
}

function formPoa(){
  const comps = (ST.cfg&&ST.cfg.componentes)||[], ugts = (ST.cfg&&ST.cfg.ugts)||[];
  openSheet(
    '<h3>Nueva actividad del POA</h3>'
    + txtf('pNom','Nombre de la actividad')
    + '<div class="row"><div class="fgroup"><span class="lbl">Componente</span>'+optsel('pComp', comps,'id','nombre')+'</div>'
    +   '<div class="fgroup"><span class="lbl">UGT (opcional)</span>'+optsel('pUgt', ugts,'id','nombre')+'</div></div>'
    + '<div class="row">'+txtf('pAnio','Año', ST.anio,'number')+txtf('pMeta','Meta (opcional)')+'</div>'
    + '<div class="hint">El POA son las <b>actividades grandes</b>. Cuelga de ellas las actividades específicas (visitas, reuniones…).</div>'
    + '<div class="row" style="margin-top:10px"><button class="btn ghost" id="cxl">Cancelar</button><button class="btn" id="ok">Crear del POA</button></div>',
    () => {
      el('cxl').onclick = closeSheet;
      el('ok').onclick = async () => {
        const body = { nombre:el('pNom').value.trim(), componente_id:+(el('pComp').value||0)||null,
          ugt_id:+(el('pUgt').value||0)||null, anio:+(el('pAnio').value||ST.anio), meta:el('pMeta').value||null,
          responsable_id:(ST.usuario&&ST.usuario.id)||null };
        if(!body.nombre) return toast('Pon un nombre', true);
        try { await api('/api/app/poa',{method:'POST',body:JSON.stringify(body)});
          closeSheet(); toast('Actividad del POA creada ✅'); go('programacion'); } catch(e){ toast(e.message,true); }
      };
    });
}

function formIncidencia(){
  const sem = (ST.cfg&&ST.cfg.semaforos)||[];
  openSheet(
    '<h3>Registrar incidencia / alerta</h3>'
    + '<div class="fgroup"><span class="lbl">Tipo</span><select class="fld" id="iTipo"><option value="incidencia">Incidencia</option><option value="alerta">Alerta</option></select></div>'
    + '<div class="fgroup"><span class="lbl">Semáforo</span><select class="fld" id="iSem"><option value="">—</option>'
    +   sem.map(s=>'<option value="'+esc(s.codigo)+'">'+esc(s.etiqueta)+'</option>').join('')+'</select></div>'
    + '<div class="fgroup"><span class="lbl">Descripción</span><textarea class="fld" id="iDesc"></textarea></div>'
    + '<div class="fgroup"><span class="lbl">Diagnóstico / acciones previas</span><textarea class="fld" id="iDiag"></textarea></div>'
    + '<div class="row"><button class="btn ghost" id="cxl">Cancelar</button><button class="btn" id="ok">Guardar</button></div>',
    () => {
      el('cxl').onclick = closeSheet;
      el('ok').onclick = async () => {
        const body = { tipo:el('iTipo').value, descripcion:el('iDesc').value||null,
          diagnostico_previo:el('iDiag').value||null, nivel_semaforo:el('iSem').value||null };
        if(!body.descripcion) return toast('Escribe una descripción', true);
        try { await api('/api/app/incidencias',{method:'POST',body:JSON.stringify(body)});
          closeSheet(); toast('Registrado ✅'); go('registrar'); } catch(e){ toast(e.message,true); }
      };
    });
}

async function detalleActividad(id){
  let d; try { d = await api('/api/app/actividades/'+id); } catch(e){ return toast(e.message,true); }
  const a = d.actividad;
  openSheet(
    '<h3>'+esc(a.actividad||'Actividad')+'</h3>'
    + '<div class="card" style="cursor:default;border-left-color:'+esc(a.estado_color||'#0e7c70')+'"><div class="body">'
    + '<div class="lugar">Lugar: '+esc([a.distrito,a.centro_poblado].filter(Boolean).join(' / ')||'—')+'</div>'
    + '<div>Fecha: '+fmtFecha(a.fecha_programada)+(a.hora_inicio?' · '+fmtHora(a.hora_inicio):'')+'</div>'
    + '<div>Responsable: '+esc(a.responsable||'—')+'</div>'
    + '<div>'+esc(a.ugt||'')+' · '+esc(a.componente||'')+'</div>'
    + '<div class="pie" style="padding:6px 0 0"><span></span><span class="pill" style="background:'+esc(a.estado_color||'#888')+'">'+esc(a.estado||'')+'</span></div>'
    + '</div></div>'
    + '<div class="row" style="margin-top:10px"><button class="btn" id="dRep">📝 Reportar</button>'
    +   '<button class="btn ghost" id="dEje">✅ Ejecutado</button></div>'
    + '<div class="row" style="margin-top:8px"><button class="btn soft sm" id="dCan">🚫 Cancelar</button>'
    +   '<button class="btn soft sm" id="dRe">🔁 Reprogramar</button></div>'
    + (d.reportes.length ? '<div class="sect">Reportes</div>'+d.reportes.map(r =>
        '<div class="hint" style="border-left:3px solid #437a22;padding-left:8px">'+esc(r.descripcion||'')+' · '+fmtFechaHora(r.enviado_en)+'</div>').join('') : '')
    + (d.historial.length ? '<div class="sect">Historial</div>'+d.historial.map(h =>
        '<div class="hint">'+esc(h.accion)+' · '+fmtFechaHora(h.fecha)+'</div>').join('') : '')
    + '<div style="margin-top:12px"><button class="btn soft" id="cxl">Cerrar</button></div>',
    () => {
      el('cxl').onclick = closeSheet;
      el('dRep').onclick = () => reportarForm(a.id, a.actividad);
      el('dEje').onclick = () => cambiarEstado(a.id,'ejecutado');
      el('dCan').onclick = () => cambiarEstado(a.id,'cancelado');
      el('dRe').onclick = () => cambiarEstado(a.id,'reprogramado');
    });
}
async function cambiarEstado(id, estado){
  try { await api('/api/app/actividades/'+id+'/estado?estado='+estado,{method:'PATCH',
      body:JSON.stringify({usuario_id:(ST.usuario&&ST.usuario.id)||null})});
    closeSheet(); toast('Estado: '+estado+' ✅'); go(ST.vista); } catch(e){ toast(e.message,true); }
}
function reportarForm(aid, nombre){
  openSheet(
    '<h3>Reportar: '+esc(nombre||'actividad')+'</h3>'
    + '<div class="fgroup"><span class="lbl">¿Qué se hizo?</span><textarea class="fld" id="rDesc"></textarea></div>'
    + '<div class="fgroup"><span class="lbl">Logro / resultado</span><textarea class="fld" id="rLog"></textarea></div>'
    + '<div class="k4">'+numf('rDoc','Docentes')+numf('rFam','Familias')+numf('rEst','Estudiantes')+numf('rOtr','Otros')+'</div>'
    + '<label class="optrow" style="cursor:pointer"><span>Marcar como <b>ejecutado</b></span><input type="checkbox" id="rEje" checked></label>'
    + '<div class="row" style="margin-top:10px"><button class="btn ghost" id="cxl">Cancelar</button><button class="btn" id="ok">Enviar reporte</button></div>',
    () => {
      el('cxl').onclick = closeSheet;
      el('ok').onclick = async () => {
        const body = { descripcion:el('rDesc').value||null, logro:el('rLog').value||null,
          n_docentes:+el('rDoc').value||0, n_familias:+el('rFam').value||0, n_estudiantes:+el('rEst').value||0,
          n_otros:+el('rOtr').value||0, marcar_ejecutado:el('rEje').checked };
        if(!body.descripcion) return toast('Describe lo realizado', true);
        try { await api('/api/app/actividades/'+aid+'/reporte',{method:'POST',body:JSON.stringify(body)});
          closeSheet(); toast('Reporte enviado ✅'); go('reportes'); } catch(e){ toast(e.message,true); }
      };
    });
}

/* ============ INIT ============ */
(async function init(){
  renderNav();
  try {
    const cfg = await api('/api/app/config');
    ST.cfg = cfg; ST.usuario = cfg.usuario;
    el('hUser').textContent = (cfg.usuario.nombre||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    el('hUser').title = cfg.usuario.nombre+' · '+cfg.usuario.email;
  } catch(e){ toast('No se pudo cargar config: '+e.message, true); }
  try { await go('home'); } catch(e){ fatal('Error al abrir la app: '+e.message); }
  if ('serviceWorker' in navigator) {
    try { navigator.serviceWorker.register('/sw.js').catch(()=>{}); } catch(e){}
  }
})();
