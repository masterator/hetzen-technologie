const KEY='hetzen_business_os_v1';
const defaultData={clients:[],leads:[],quotes:[],invoices:[],projects:[],tasks:[],documents:[]};
let data=JSON.parse(localStorage.getItem(KEY)||'null')||defaultData;
const services=['Website & Web Development','AI & Automation','Custom Software','API & System Integration','Branding & Digital Identity','IT / Digital Solutions'];
const content=document.getElementById('content'), title=document.getElementById('pageTitle');
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function money(n){return 'R '+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}
function render(view='overview'){
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 const names={overview:'Business Overview',clients:'Clients',leads:'Leads',quotes:'Quotes',invoices:'Invoices',projects:'Projects',services:'Services',tasks:'Tasks',documents:'Documents',reports:'Reports',settings:'Settings'};
 title.textContent=names[view]||'Business Overview';
 if(view==='overview') return overview();
 if(view==='services') return servicesView();
 if(view==='reports') return reports();
 if(view==='settings') return settings();
 listView(view);
}
function overview(){
 const all=[...data.clients,...data.leads,...data.quotes,...data.invoices,...data.projects];
 const total=all.reduce((s,x)=>s+Number(x.value||0),0);
 content.innerHTML=`<div class="hero"><div><span class="eyebrow">BUSINESS OPERATIONS</span><h2>One system for the whole business.</h2><p>Manage clients, sales, projects and every Hetzen service from one place.</p></div></div>
 <div class="cards"><div class="card"><div class="label">Clients</div><div class="value">${data.clients.length}</div></div><div class="card"><div class="label">Open Leads</div><div class="value">${data.leads.length}</div></div><div class="card"><div class="label">Active Projects</div><div class="value">${data.projects.filter(x=>x.status==='In Progress'||x.status==='Active').length}</div></div><div class="card"><div class="label">Pipeline Value</div><div class="value gold">${money(total)}</div></div></div>
 <div class="grid"><div class="panel"><h3>Recent activity</h3>${all.length?'<table class="table"><thead><tr><th>Name</th><th>Area</th><th>Status</th><th>Value</th></tr></thead><tbody>'+all.slice(-8).reverse().map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.category||'Client')}</td><td><span class="pill">${esc(x.status||'New')}</span></td><td>${money(x.value)}</td></tr>`).join('')+'</tbody></table>':'<div class="empty">No records yet. Use + Add to create your first client or lead.</div>'}</div>
 <div class="panel"><h3>Hetzen service areas</h3><div class="service-list">${services.map(s=>`<div class="service"><span>${s}</span><span class="gold">›</span></div>`).join('')}</div></div></div>`;
}
function servicesView(){content.innerHTML=`<div class="hero"><div><span class="eyebrow">SERVICE CATALOGUE</span><h2>Everything Hetzen offers.</h2><p>Services are shared across clients, quotes and projects.</p></div></div><div class="grid">${services.map((s,i)=>`<div class="panel feature"><strong>${s}</strong><small>Service area ${i+1} • Add pricing, packages and delivery details later.</small></div>`).join('')}</div>`}
function listView(view){
 const arr=data[view]||[];
 content.innerHTML=`<div class="toolbar"><input id="search" placeholder="Search ${view}..." oninput="filterRows()"><button class="primary" onclick="openModal('${view}')">+ Add ${view.slice(0,-1)}</button></div><div class="panel"><table class="table"><thead><tr><th>Name / Company</th><th>Service</th><th>Status</th><th>Value</th></tr></thead><tbody id="rows">${rows(arr)}</tbody></table></div>`;
}
function rows(arr){return arr.length?arr.map((x,i)=>`<tr data-search="${esc((x.name||'')+' '+(x.category||'')+' '+(x.status||''))}"><td>${esc(x.name)}</td><td>${esc(x.category||'—')}</td><td><span class="pill">${esc(x.status||'New')}</span></td><td>${money(x.value)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">No records yet.</td></tr>'}
function filterRows(){const q=document.getElementById('search').value.toLowerCase();document.querySelectorAll('#rows tr').forEach(r=>r.style.display=(r.dataset.search||'').toLowerCase().includes(q)?'':'none')}
function reports(){const revenue=data.invoices.reduce((s,x)=>s+Number(x.value||0),0);content.innerHTML=`<div class="hero"><div><span class="eyebrow">REPORTING</span><h2>Business reports</h2><p>Live totals from the dashboard records.</p></div></div><div class="cards"><div class="card"><div class="label">Clients</div><div class="value">${data.clients.length}</div></div><div class="card"><div class="label">Quotes</div><div class="value">${data.quotes.length}</div></div><div class="card"><div class="label">Projects</div><div class="value">${data.projects.length}</div></div><div class="card"><div class="label">Invoice Value</div><div class="value gold">${money(revenue)}</div></div></div><div class="panel" style="margin-top:18px"><h3>Service demand</h3>${services.map(s=>`<div class="service"><span>${s}</span><span>${data.leads.filter(x=>x.category===s).length+data.projects.filter(x=>x.category===s).length} records</span></div>`).join('')}</div>`}
function settings(){content.innerHTML=`<div class="hero"><div><span class="eyebrow">SYSTEM</span><h2>Settings</h2><p>Foundation settings for the Hetzen Business OS.</p></div></div><div class="panel"><h3>Current foundation</h3><p class="danger-note">This first version stores dashboard records in this browser using local storage. It is a front-end foundation only; it is not yet a secure multi-user production database. The next backend phase can move clients, quotes, invoices and projects into a real database with authentication and permissions.</p><button class="primary" onclick="if(confirm('Clear all dashboard demo data?')){data=defaultData;save();render('overview')}">Clear local dashboard data</button></div>`}
function openModal(type){document.getElementById('modal').classList.remove('hidden');document.getElementById('recordType').value=type;document.getElementById('modalTitle').textContent='Add '+type.slice(0,-1)}
function closeModal(){document.getElementById('modal').classList.add('hidden');document.getElementById('recordForm').reset()}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>render(b.dataset.view));
document.getElementById('quickAdd').onclick=()=>openModal('clients');
document.getElementById('menu').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
document.getElementById('closeModal').onclick=closeModal;
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
document.getElementById('recordForm').onsubmit=e=>{e.preventDefault();const type=document.getElementById('recordType').value;data[type].push({name:document.getElementById('recordName').value,category:document.getElementById('recordCategory').value,status:document.getElementById('recordStatus').value,value:Number(document.getElementById('recordValue').value||0),created:new Date().toISOString()});save();closeModal();render(type)};
render();