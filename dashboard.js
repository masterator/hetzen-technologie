const config=window.HETZEN_CONFIG||{};
if(!window.supabase) throw new Error('Supabase client library failed to load.');
const supabaseClient=window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY);
const defaultData={clients:[],leads:[],quotes:[],invoices:[],projects:[],tasks:[],documents:[]};
let data=JSON.parse(localStorage.getItem('hetzen_business_os_v1')||'null')||defaultData;
let currentUser=null;
let serviceRows=[];
const content=document.getElementById('content'), title=document.getElementById('pageTitle');
const serviceNames=['Website & Web Development','AI & Automation','Custom Software','API & System Integration','Branding & Digital Identity','IT / Digital Solutions'];

function money(n){return 'R '+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

async function loadData(){
 const {data:clients,error:cErr}=await supabaseClient.from('clients').select('*').order('created_at',{ascending:false});
 if(cErr) throw cErr;
 const {data:records,error:rErr}=await supabaseClient.from('business_records').select('*').order('created_at',{ascending:false});
 if(rErr) throw rErr;
 const {data:svcs,error:sErr}=await supabaseClient.from('services').select('*').eq('active',true).order('name');
 if(sErr) throw sErr;
 serviceRows=svcs||[];
 data={clients:clients||[],leads:[],quotes:[],invoices:[],projects:[],tasks:[],documents:[]};
 (records||[]).forEach(r=>{if(data[r.record_type]) data[r.record_type].push({...r,name:r.name,category:r.category,status:r.status,value:r.value});});
 localStorage.setItem('hetzen_business_os_v1',JSON.stringify(data));
}

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
 <div class="grid"><div class="panel"><h3>Recent activity</h3>${all.length?'<table class="table"><thead><tr><th>Name</th><th>Area</th><th>Status</th><th>Value</th></tr></thead><tbody>'+all.slice(0,8).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.category||'Client')}</td><td><span class="pill">${esc(x.status||'New')}</span></td><td>${money(x.value)}</td></tr>`).join('')+'</tbody></table>':'<div class="empty">No records yet. Use + Add to create your first client or lead.</div>'}</div>
 <div class="panel"><h3>Hetzen service areas</h3><div class="service-list">${(serviceRows.length?serviceRows.map(s=>s.name):serviceNames).map(s=>`<div class="service"><span>${esc(s)}</span><span class="gold">›</span></div>`).join('')}</div></div></div>`;
}
function servicesView(){content.innerHTML=`<div class="hero"><div><span class="eyebrow">SERVICE CATALOGUE</span><h2>Everything Hetzen offers.</h2><p>Services are stored in Supabase and shared across the business.</p></div></div><div class="grid">${(serviceRows.length?serviceRows:serviceNames.map(name=>({name}))).map((s,i)=>`<div class="panel feature"><strong>${esc(s.name)}</strong><small>${esc(s.description||'Service area '+(i+1))}${s.price_from!=null?' • From '+money(s.price_from):''}</small></div>`).join('')}</div>`}
function listView(view){
 const arr=data[view]||[];
 content.innerHTML=`<div class="toolbar"><input id="search" placeholder="Search ${view}..." oninput="filterRows()"><button class="primary" onclick="openModal('${view}')">+ Add ${view==='clients'?'Client':view.slice(0,-1)}</button></div><div class="panel"><table class="table"><thead><tr><th>Name / Company</th><th>Service</th><th>Status</th><th>Value</th></tr></thead><tbody id="rows">${rows(arr)}</tbody></table></div>`;
}
function rows(arr){return arr.length?arr.map(x=>`<tr data-search="${esc((x.name||'')+' '+(x.category||'')+' '+(x.status||''))}"><td>${esc(x.name)}</td><td>${esc(x.category||'—')}</td><td><span class="pill">${esc(x.status||'New')}</span></td><td>${money(x.value)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">No records yet.</td></tr>'}
function filterRows(){const q=document.getElementById('search').value.toLowerCase();document.querySelectorAll('#rows tr').forEach(r=>r.style.display=(r.dataset.search||'').toLowerCase().includes(q)?'':'none')}
function reports(){const revenue=data.invoices.reduce((s,x)=>s+Number(x.value||0),0);content.innerHTML=`<div class="hero"><div><span class="eyebrow">REPORTING</span><h2>Business reports</h2><p>Live totals from the dashboard records.</p></div></div><div class="cards"><div class="card"><div class="label">Clients</div><div class="value">${data.clients.length}</div></div><div class="card"><div class="label">Quotes</div><div class="value">${data.quotes.length}</div></div><div class="card"><div class="label">Projects</div><div class="value">${data.projects.length}</div></div><div class="card"><div class="label">Invoice Value</div><div class="value gold">${money(revenue)}</div></div></div>`}
function settings(){content.innerHTML=`<div class="hero"><div><span class="eyebrow">SYSTEM</span><h2>Settings</h2><p>Hetzen Business OS is connected to Supabase.</p></div></div><div class="panel"><h3>Account</h3><p>Signed in as <strong>${esc(currentUser?.email||'')}</strong></p><p>Data is stored securely in the Hetzen Supabase database with row-level security.</p></div>`}
function openModal(type){document.getElementById('modal').classList.remove('hidden');document.getElementById('recordType').value=type;document.getElementById('modalTitle').textContent='Add '+(type==='clients'?'Client':type.slice(0,-1))}
function closeModal(){document.getElementById('modal').classList.add('hidden');document.getElementById('recordForm').reset()}

document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>render(b.dataset.view));
document.getElementById('quickAdd').onclick=()=>openModal('clients');
document.getElementById('menu').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
document.getElementById('closeModal').onclick=closeModal;
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
document.getElementById('logoutBtn').onclick=async()=>{await supabaseClient.auth.signOut();location.reload()};

document.getElementById('recordForm').onsubmit=async e=>{
 e.preventDefault();
 const type=document.getElementById('recordType').value;
 const name=document.getElementById('recordName').value.trim();
 const category=document.getElementById('recordCategory').value;
 const status=document.getElementById('recordStatus').value;
 const value=Number(document.getElementById('recordValue').value||0);
 let result;
 if(type==='clients'){
   result=await supabaseClient.from('clients').insert({name,email:null,phone:null,company:name,notes:null}).select().single();
 }else{
   result=await supabaseClient.from('business_records').insert({record_type:type==='leads'?'lead':type==='quotes'?'quote':type==='invoices'?'invoice':type==='projects'?'project':type==='tasks'?'task':'document',name,category,status,value}).select().single();
 }
 if(result.error){alert(result.error.message);return}
 closeModal(); await loadData(); render(type);
};

async function start(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(!session){
   document.getElementById('loginScreen').classList.remove('hidden');
   document.getElementById('loginScreen').style.display='flex';
   document.getElementById('appShell').style.display='none';
   return;
 }
 currentUser=session.user;
 document.getElementById('loginScreen').style.display='none';
 document.getElementById('appShell').style.display='flex';
 try{await loadData();render()}catch(err){console.error(err);content.innerHTML=`<div class="panel"><h3>Database connection error</h3><p>${esc(err.message)}</p></div>`}
}
document.getElementById('loginForm').onsubmit=async e=>{
 e.preventDefault();
 const error=document.getElementById('loginError'); error.textContent='';
 const {error:err}=await supabaseClient.auth.signInWithPassword({email:document.getElementById('loginEmail').value,password:document.getElementById('loginPassword').value});
 if(err){error.textContent=err.message;return}
 start();
};
supabaseClient.auth.onAuthStateChange((_event,session)=>{if(session){currentUser=session.user;start()}});
start();
