
// ====== Navigation entre les 6 écrans ======
const navItems = document.querySelectorAll('.nav-item[data-screen]');
const screens = document.querySelectorAll('.screen');
navItems.forEach(item=>{
  item.addEventListener('click',()=>{
    navItems.forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    const id = item.dataset.screen;
    screens.forEach(s=>s.classList.toggle('active', s.id==='screen-'+id));
    document.getElementById('sidebar').classList.remove('open');
    // reset scroll
    document.querySelector('.content').scrollTop=0;
  });
});

// Sidebar mobile
document.getElementById('menuBtn').addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('open');
});

// ====== Tabs (settings + logs) ======
function bindTabs(group, panes){
  document.querySelectorAll(`[data-${group}]`).forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll(`[data-${group}]`).forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset[group];
      if(panes){
        document.querySelectorAll(panes).forEach(p=>{
          p.style.display = p.dataset.pane===target ? '' : 'none';
        });
      }
    });
  });
}
bindTabs('settab', '.set-pane');
// logs tabs (just visual switch, swap preset)
document.querySelectorAll('[data-logtab]').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('[data-logtab]').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
  });
});

// ====== Modal ======
function openModal(){ document.getElementById('modalBg').classList.add('show'); }
function closeModal(){ document.getElementById('modalBg').classList.remove('show'); }
document.getElementById('modalBg').addEventListener('click',e=>{
  if(e.target.id==='modalBg') closeModal();
});
document.getElementById('deployBtn').addEventListener('click',openModal);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeModal();
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){ e.preventDefault(); document.querySelector('.search input').focus(); }
});
// drag & drop simulation
['dropzone','modalDz'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  ['dragenter','dragover'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();el.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();el.classList.remove('drag');}));
});

// ====== Charts (SVG) ======
function makePath(svg, points, close, cls){
  const w = svg.viewBox.baseVal.width, h = svg.viewBox.baseVal.height;
  const d = points.map((p,i)=>{
    const x = (i/(points.length-1))*w;
    const y = h - (p*h) - 4;
    return (i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1);
  }).join(' ');
  const ns = 'http://www.w3.org/2000/svg';
  if(close){
    const area = document.createElementNS(ns,'path');
    area.setAttribute('d', d+` L${w} ${h} L0 ${h} Z`);
    area.setAttribute('class', cls+'-area');
    svg.appendChild(area);
  }
  const line = document.createElementNS(ns,'path');
  line.setAttribute('d', d);
  line.setAttribute('class', cls+'-line');
  svg.appendChild(line);
}
function gen(n, seed, smooth){
  const pts=[]; let v=0.5;
  for(let i=0;i<n;i++){
    v += (Math.sin(i*0.4+seed)+Math.random()*0.4-0.2)*0.12;
    v = Math.max(0.1, Math.min(0.95, v));
    pts.push(v);
  }
  if(smooth) return pts;
  return pts;
}
function drawChart(id, opts){
  const svg = document.getElementById(id);
  if(!svg) return;
  svg.innerHTML='';
  const ns = 'http://www.w3.org/2000/svg';
  // grid
  for(let i=1;i<4;i++){
    const ln=document.createElementNS(ns,'line');
    ln.setAttribute('x1',0);ln.setAttribute('x2',svg.viewBox.baseVal.width);
    ln.setAttribute('y1',i*svg.viewBox.baseVal.height/4);
    ln.setAttribute('y2',i*svg.viewBox.baseVal.height/4);
    ln.setAttribute('class','chart-grid-line');
    ln.setAttribute('stroke','#1a1a1a');ln.setAttribute('stroke-width','1');
    svg.appendChild(ln);
  }
  // gradient
  const def=document.createElementNS(ns,'defs');
  const grad=document.createElementNS(ns,'linearGradient');
  grad.setAttribute('id','grad-'+id);grad.setAttribute('x1','0');grad.setAttribute('y1','0');
  grad.setAttribute('x2','0');grad.setAttribute('y2','1');
  grad.innerHTML='<stop offset="0%" stop-color="'+opts.color+'" stop-opacity="0.35"/><stop offset="100%" stop-color="'+opts.color+'" stop-opacity="0"/>';
  def.appendChild(grad); svg.appendChild(def);
  const pts = gen(opts.n||80, opts.seed||1);
  const w=svg.viewBox.baseVal.width, h=svg.viewBox.baseVal.height;
  const d = pts.map((p,i)=>{
    const x=(i/(pts.length-1))*w;
    const y=h-(p*h)-4;
    return (i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1);
  }).join(' ');
  const area=document.createElementNS(ns,'path');
  area.setAttribute('d', d+` L${w} ${h} L0 ${h} Z`);
  area.setAttribute('fill',`url(#grad-${id})`);
  svg.appendChild(area);
  const line=document.createElementNS(ns,'path');
  line.setAttribute('d',d);line.setAttribute('fill','none');
  line.setAttribute('stroke',opts.color);line.setAttribute('stroke-width','1.6');
  svg.appendChild(line);
}
drawChart('ov-chart',{color:'#58a6ff',n:80,seed:2});
drawChart('an-chart1',{color:'#58a6ff',n:96,seed:5});
drawChart('an-chart2',{color:'#3fb950',n:60,seed:1});
drawChart('an-chart3',{color:'#d29922',n:60,seed:3});

// ====== Live logs ======
const logBox = document.getElementById('logBox');
const logTemplates = [
  ['info','GET /api/products 200 12ms'],
  ['info','GET / 200 4ms cache:hit'],
  ['info','GET /static/chunk-2f8a.js 200 2ms brotli'],
  ['info','POST /api/checkout 200 280ms stripe:ok'],
  ['info','GET /api/products 200 11ms db:38ms'],
  ['debug','edge cache miss key=products.list'],
  ['debug','prefetch queued: /api/reviews'],
  ['warn','rate limit接近 100/min ip=82.64.12.4'],
  ['warn','canary 5% : 0 erreurs observées'],
  ['err','POST /api/upload 500 - disk full'],
  ['err','health check failed /api/health 503'],
  ['info','build complete portfolio-site 34s'],
  ['info','rollback auto v1.4.2 → ok'],
  ['debug','cgroups cpu=42% ram=38% pid=2109'],
  ['info','WAF blocked: SQLi pattern ip=45.10.0.5'],
  ['warn','cert renew: acme-corp.fr 42j left'],
];
const auditTemplates = [
  ['info','a.carter deploy portfolio-site a1b3c2f → prod'],
  ['info','ci-bot rollback shop-frontend → v1.4.2'],
  ['warn','m.dupont read env DATABASE_URL'],
  ['info','github-actions canary rust-worker 5%'],
  ['err','denied: anonymous push without token'],
];
let logPaused = false;
let liveLogActive = false;
let logCount = 0;
function ts(){
  const d=new Date();
  return d.toLocaleTimeString('fr-FR',{hour12:false})+'.'+String(d.getMilliseconds()).padStart(3,'0');
}
function addLog(){
  if(logPaused || !logBox || liveLogActive) return;
  const activeTab = document.querySelector('[data-logtab].active')?.dataset.logtab || 'app';
  const pool = activeTab==='audit' ? auditTemplates : logTemplates;
  const [lvl,msg] = pool[Math.floor(Math.random()*pool.length)];
  const line = document.createElement('div');
  line.className = 'log-line '+lvl;
  line.innerHTML = `<span class="ts">${ts()}</span><span class="lvl">${lvl.toUpperCase()}</span><span class="msg">${msg}</span>`;
  logBox.appendChild(line);
  logCount++;
  // apply current filter
  applyLogFilter();
  // cap lines
  while(logBox.children.length>200) logBox.removeChild(logBox.firstChild);
  logBox.scrollTop = logBox.scrollHeight;
}
document.getElementById('pauseBtn').addEventListener('click',function(){
  logPaused = !logPaused;
  this.textContent = logPaused ? '▶ Resume' : '⏸ Pause';
});
// level filter
const activeLvls = {info:true,warn:true,err:true,debug:true};
document.querySelectorAll('.lvl-chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    chip.classList.toggle('active');
    activeLvls[chip.dataset.lvl] = chip.classList.contains('active');
    applyLogFilter();
  });
});
function applyLogFilter(){
  const q = (document.getElementById('logSearch').value||'').toLowerCase();
  logBox.querySelectorAll('.log-line').forEach(line=>{
    const lvl = line.className.match(/\b(info|warn|err|debug)\b/)[0];
    const msg = line.querySelector('.msg').textContent.toLowerCase();
    const lvlOk = activeLvls[lvl];
    const qOk = !q || msg.includes(q);
    line.style.display = (lvlOk && qOk) ? '' : 'none';
  });
}
document.getElementById('logSearch').addEventListener('input',applyLogFilter);
// seed initial logs
for(let i=0;i<24;i++) addLog();
window.__logInterval = setInterval(addLog, 900);

// ====== chips generic ======
document.querySelectorAll('.chips').forEach(group=>{
  group.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click',()=>{
      group.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

// ====== click outside closes sidebar on mobile ======
document.addEventListener('click',e=>{
  const sb=document.getElementById('sidebar');
  if(sb.classList.contains('open') && !sb.contains(e.target) && !e.target.closest('#menuBtn')){
    sb.classList.remove('open');
  }
});

// =========================================================================
// API INTEGRATION — données réelles depuis server.py (graceful fallback démo)
// =========================================================================
const API = '';  // même origine que le dashboard

async function api(path){
  try{
    const r = await fetch(API+path, {credentials:'omit'});
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
}

// helper : crée une carte projet depuis une ligne API
function projectCard(p){
  const fwColors={'Next.js':'#58a6ff','React':'#3fb950','Vue':'#3fb950','Django':'#d29922',
    'Python':'#d29922','Rust':'#f85149','Go':'#58a6ff','Laravel':'#f85149','PHP':'#888',
    'Static':'#888','Node':'#3fb950','Unknown':'#888'};
  const stCls={'running':'running','stopped':'stopped','error':'error'}[p.status]||'stopped';
  const stTxt={'running':'Running','stopped':'Stopped','error':'Error'}[p.status]||p.status;
  const port = p.port || '—';
  return `<div class="proj-card">
    <div class="proj-card-hd">
      <div class="proj-name"><span class="proj-ico" style="background:${fwColors[p.framework]||'#888'}"></span> ${p.name} <span class="fw-badge">${p.framework||'?'}</span></div>
      <span class="status ${stCls}">${stTxt}</span>
    </div>
    <div class="proj-meta">
      <div class="row"><span>Version</span><span>v${p.version||1}</span></div>
      <div class="row"><span>Port</span><span>${port}</span></div>
      <div class="row"><span>Créé</span><span>${p.created?new Date(p.created*1000).toLocaleString('fr-FR'):'—'}</span></div>
    </div>
    <div class="proj-domain">${p.name}.nercel.app → :${port}</div>
  </div>`;
}

async function loadStatus(){
  const d = await api('/api/status');
  if(!d) return;  // fallback démo
  // met à jour les 4 cartes de stats
  const stats = document.querySelectorAll('#screen-overview .stats .stat');
  if(stats.length>=4){
    stats[0].querySelector('.stat-val').textContent = (d.projects||[]).length;
    stats[1].querySelector('.stat-val').textContent = d.deployments||0;
    stats[2].innerHTML = `<div class="stat-label">En ligne</div><div class="stat-val">${d.running||0}<span style="color:var(--text-3);font-size:16px"> / ${(d.projects||[]).length}</span></div><div class="stat-delta flat">health checks OK</div>`;
    stats[3].querySelector('.stat-val').textContent = d.requests||0;
    stats[3].querySelector('.stat-label').textContent = 'Requêtes totales';
  }
  // sous-titre
  const sub = document.querySelector('#screen-overview .page-sub');
  if(sub) sub.textContent = `${(d.projects||[]).length} projets · ${d.running||0} running · CPU ${d.cpu||0}% · RAM ${d.ram||0}% · ${d.features||79} features`;
  // badge latéral
  const fc = document.querySelector('.sidebar-foot .feat-count');
  if(fc) fc.textContent = `${d.features||79} / ${d.features||79} features active`;
}

async function loadProjects(){
  const d = await api('/api/projects');
  if(!d || !d.projects || !d.projects.length) return;  // garde la démo
  const grid = document.querySelector('#screen-overview .proj-grid');
  if(grid) grid.innerHTML = d.projects.map(projectCard).join('');
}

function pushRealLog(line){
  if(!logBox) return;
  const lvl = (line.level||'info').slice(0,4);
  const el = document.createElement('div');
  el.className = 'log-line '+(line.level||'info');
  el.innerHTML = `<span class="ts">${line.ts||ts()}</span><span class="lvl">${lvl.toUpperCase()}</span><span class="msg">${(line.msg||'').replace(/</g,'&lt;')}</span>`;
  logBox.appendChild(el);
  while(logBox.children.length>200) logBox.removeChild(logBox.firstChild);
  applyLogFilter();
  logBox.scrollTop = logBox.scrollHeight;
}

function connectLiveLogs(){
  // tente SSE ; si ça marche, on stoppe le générateur factice
  try{
    const es = new EventSource(API+'/api/logs/stream');
    es.onmessage = (ev)=>{
      if(!liveLogActive){
        // premier message réel : on bascule en mode live et on vide la démo
        liveLogActive = true;
        clearInterval(window.__logInterval);
        if(logBox) logBox.innerHTML='';
      }
      try{ pushRealLog(JSON.parse(ev.data)); }catch(e){}
    };
    es.onerror = ()=>{ /* garde le générateur factice en cas d'erreur */ };
  }catch(e){ /* navigateur sans EventSource → démo */ }
}

// Démarre l'intégration au chargement
(function initApi(){
  // n'essaie l'API que si on est servie par HTTP (pas file://)
  if(location.protocol === 'file:'){
    return;  // mode démo autonome
  }
  loadStatus();
  loadProjects();
  connectLiveLogs();
  // refresh stats toutes les 10 s
  setInterval(loadStatus, 10000);
})();

