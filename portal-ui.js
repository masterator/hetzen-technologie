/* Hetzen Portal — plain-language UI layer.
   Loads after the portal's own scripts. It changes wording, shortens forms
   and adds the new home page. It does not change how data is stored. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const hasDb=()=>typeof db!=='undefined'&&db&&typeof db==='object';
const say=m=>{if(typeof toast==='function')toast(m)};

/* ---------- 1. Plain words in the save-status label ---------- */
const BADGE=[
  [/CLOUD SYNCED/,'✓ Saved','ok'],
  [/LOCAL CHANGES/,'Saving…',''],
  [/OUT OF DATE/,'Changed on another device','warn'],
  [/CLOUD ERROR/,'Not saved online yet','warn'],
  [/OFFLINE MODE/,'Offline mode',''],
  [/OFFLINE/,'Offline · saved on this device',''],
  [/LOCAL MODE/,'Saved on this device',''],
  [/CLOUD/,'Connecting…','']
];
function plainBadge(){
  const b=$('cloudBadge');if(!b)return;
  const t=b.textContent||'';
  if(b.dataset.plain===t)return;
  for(const [re,txt,state] of BADGE){
    if(re.test(t)){b.dataset.plain=txt;b.dataset.state=state;b.textContent=txt;return}
  }
}
const badgeEl=$('cloudBadge');
if(badgeEl){plainBadge();new MutationObserver(plainBadge).observe(badgeEl,{childList:true,characterData:true,subtree:true})}

/* ---------- 2. Page names and headings ---------- */
const PAGES={
  dashboard:['Home',null,null],
  customers:['Customers','Everyone you work with, and everything about them in one place.','+ New customer'],
  leads:['Enquiries','People who asked about your services but are not customers yet.','+ New enquiry'],
  consultations:['Consultations','Notes from your first conversations with customers.','+ New consultation'],
  requirements:['Job details','What the customer needs, what you will deliver, and what you still need from them.','+ Add job details'],
  services:['Services','The services you offer.',null],
  projects:['Jobs','Work in progress, from start to handover.','+ New job'],
  quotes:['Quotes','Prices you have sent to customers.','+ New quote'],
  payments:['Invoices','Money owed to you and payments received.','+ New invoice'],
  documents:['Documents','Contracts, handover notes and other files.','+ Add document'],
  tasks:['Reminders','Things you need to do.','+ New reminder'],
  support:['Support','Problems customers have asked you to fix.','+ New support request'],
  reports:['Reports','Printable summaries and documents.',null],
  forms:['Forms','Form templates you use.',null],
  automations:['Automations','Things the portal does for you automatically.',null],
  settings:['Settings','Your business details, appearance and how saving works.',null]
};
if(typeof titles==='object'&&titles){Object.keys(PAGES).forEach(k=>{titles[k]=PAGES[k][0]})}
Object.entries(PAGES).forEach(([id,[name,sub,btn]])=>{
  const sec=$(id);if(!sec)return;
  const hero=sec.querySelector(':scope>.hero');if(!hero)return;
  const h=hero.querySelector('h2'),p=hero.querySelector('p');
  if(h)h.textContent=name;
  if(p&&sub)p.textContent=sub;
  const b=btn&&hero.querySelector('.btn.gold');
  if(b)b.textContent=btn;
});
const activePage=document.querySelector('.page.active');
if(activePage&&$('title'))$('title').textContent=(PAGES[activePage.id]||[])[0]||$('title').textContent;
document.title='Hetzen Portal';

/* ---------- 3. Customer: type a name, new names are added for you ---------- */
const CUST=['qCustomer','iCustomer','sCustomer','pCustomer','rqCustomer','dCustomer'];
function datalist(){
  let dl=$('customerNames');
  if(!dl){dl=document.createElement('datalist');dl.id='customerNames';document.body.appendChild(dl)}
  return dl;
}
CUST.forEach(id=>{
  const el=$(id);if(!el||el.tagName!=='SELECT')return;
  const inp=document.createElement('input');
  inp.id=id;inp.setAttribute('list','customerNames');inp.autocomplete='off';
  inp.placeholder=id==='dCustomer'?'Leave empty if it is for you':'Start typing a name';
  if(el.required)inp.required=true;
  el.replaceWith(inp);
  if(id!=='dCustomer'){
    const hint=document.createElement('span');hint.className='hint';
    hint.textContent='New name? We’ll add them to your customers for you.';
    inp.insertAdjacentElement('afterend',hint);
  }
});
window.refreshCustomerSelects=function(){
  if(!hasDb())return;
  const dl=datalist();dl.textContent='';
  (db.customers||[]).filter(c=>c&&c.status!=='Archived'&&c.name).forEach(c=>{
    const o=document.createElement('option');o.value=c.name;dl.appendChild(o);
  });
};
window.refreshCustomerSelects();

document.addEventListener('submit',e=>{
  if(!hasDb())return;
  const f=e.target;
  const inp=f&&f.querySelector&&f.querySelector(CUST.map(x=>'#'+x).join(','));
  if(!inp)return;
  const name=String(inp.value||'').trim();
  if(!name)return;
  inp.value=name;
  db.customers=Array.isArray(db.customers)?db.customers:[];
  const found=db.customers.find(c=>String(c.name||'').trim().toLowerCase()===name.toLowerCase());
  if(found){inp.value=found.name;if(found.status==='Archived'){found.status='Active';found.updatedAt=new Date().toISOString()}return}
  const now=new Date().toISOString();
  db.customers.unshift({
    id:(typeof makeStableId==='function'?makeStableId('CUS'):'CUS-'+Date.now().toString(36)),
    name,contact:'',phone:'',email:'',industry:'',services:'Not assigned',projects:0,
    status:'Active',createdAt:now,updatedAt:now
  });
  setTimeout(()=>say(name+' was added to your customers'),1900);
},true);

/* ---------- 4. Short forms: the rest goes under "Add more details" ---------- */
const FORMS={
  customerModal:{title:'New customer',keep:['cName','cPhone'],button:'Save customer',notRequired:['cContact'],
    labels:{cName:'Name',cPhone:'Phone or WhatsApp',cEmail:'Email',cContact:'Who to speak to',cIndustry:'Type of business'},
    ph:{cName:'Person or business',cPhone:'e.g. 081 234 5678',cContact:'If different from the name above'}},
  leadModal:{title:'New enquiry',keep:['lName','lNeed'],button:'Save enquiry',
    labels:{lName:'Name',lNeed:'What do they need?',lSource:'Where did they find you?',lStage:'Stage',lAction:'Next step'}},
  quoteModal:{title:'New quote',keep:['qCustomer','qService','qAmount'],button:'Save quote',
    labels:{qCustomer:'Who is it for?',qService:'What is it for?',qAmount:'Price (R)',qExpiry:'Price is valid until',qStatus:'Status'},
    ph:{qService:'For example: 5-page website',qAmount:'0.00'}},
  invoiceModal:{title:'New invoice',keep:['iCustomer','iAmount'],button:'Save invoice',
    labels:{iCustomer:'Who is it for?',iAmount:'Amount (R)',iDue:'Pay by',iStatus:'Status'},ph:{iAmount:'0.00'}},
  projectModal:{title:'New job',keep:['pName','pCustomer'],button:'Save job',
    labels:{pName:'What is the job?',pCustomer:'Who is it for?',pServices:'Services',pStatus:'Stage',pDue:'Finish by'},
    ph:{pName:'For example: Salon booking website'}},
  taskModal:{title:'New reminder',keep:['tName','tDue'],button:'Save reminder',
    labels:{tName:'What do you need to do?',tDue:'When?',tStatus:'Status'}},
  supportModal:{title:'New support request',keep:['sCustomer','sIssue'],button:'Save request',
    labels:{sCustomer:'Who is it for?',sIssue:'What is wrong?',sPriority:'How urgent?'}},
  documentModal:{title:'Add document',keep:['dName','dCustomer'],button:'Add document',
    labels:{dName:'Document name',dCustomer:'Customer',dType:'Type',dStatus:'Status'}},
  consultModal:{title:'New consultation',keep:['coBusiness','coPhone','coProblem'],
    labels:{coBusiness:'Name',coPhone:'Phone or WhatsApp',coProblem:'What do they need help with?'}},
  requirementsModal:{title:'Job details',keep:['rqCustomer','rqService','rqScope'],
    labels:{rqCustomer:'Who is it for?',rqService:'Which service?',rqScope:'What does the customer need?'}}
};
Object.entries(FORMS).forEach(([mid,cfg])=>{
  const modal=$(mid);if(!modal)return;
  const h=modal.querySelector('.modal-head h3');if(h&&cfg.title)h.textContent=cfg.title;
  const form=modal.querySelector('form');if(!form)return;
  const grid=form.querySelector('.formgrid');if(!grid)return;
  modal.querySelectorAll('.field label').forEach(l=>{l.textContent=l.textContent.replace(/\s*\*\s*$/,'')});
  Object.entries(cfg.labels||{}).forEach(([id,txt])=>{
    const c=$(id);const l=c&&c.closest('.field')&&c.closest('.field').querySelector('label');
    if(l){l.textContent=txt;l.setAttribute('for',id)}
  });
  Object.entries(cfg.ph||{}).forEach(([id,txt])=>{const c=$(id);if(c)c.placeholder=txt});
  (cfg.notRequired||[]).forEach(id=>{const c=$(id);if(c)c.required=false});
  const extra=[...grid.children].filter(el=>{
    if(!el.classList||!el.classList.contains('field'))return false;
    const c=el.querySelector('input[id],select[id],textarea[id]');
    return !(c&&cfg.keep.includes(c.id));
  });
  if(extra.length){
    const d=document.createElement('details');d.className='optional';
    const s=document.createElement('summary');s.textContent='Add more details (optional)';
    const inner=document.createElement('div');inner.className='formgrid';
    d.append(s,inner);extra.forEach(el=>inner.appendChild(el));
    grid.appendChild(d);
  }
  const btn=[...form.children].find(el=>el.matches&&el.matches('button.btn.gold'));
  if(btn&&cfg.button)btn.textContent=cfg.button;
});
/* collapse the extra details again whenever a pop-up is closed */
const baseClose=window.closeModal;
if(typeof baseClose==='function'){
  window.closeModal=function(id){baseClose(id);const m=$(id);if(m)m.querySelectorAll('details.optional[open]').forEach(d=>d.open=false)};
}

/* ---------- 5. Home page ---------- */
function n(v){const x=Number(v);return isFinite(x)?x:0}
function rand(v){return typeof money==='function'?money(v):'R'+Math.round(n(v)).toLocaleString('en-ZA')}
function dayStart(d){const x=new Date(d);x.setHours(0,0,0,0);return x}
function isLate(inv){
  if(!inv||inv.status==='Paid')return false;
  if(inv.status==='Overdue')return true;
  const d=inv.due&&inv.due!=='—'?new Date(inv.due):null;
  return !!(d&&!isNaN(d)&&dayStart(d)<dayStart(new Date()));
}
function renderHome(){
  if(!hasDb()||!$('homeGreeting'))return;
  const hr=new Date().getHours();
  const s=(()=>{try{return JSON.parse(localStorage.getItem('hetzenSettings')||'{}')}catch(e){return{}}})();
  const who=String(s.ownerName||($('setContact')&&$('setContact').value)||'').trim().split(/\s+/)[0]||'';
  $('homeGreeting').textContent=(hr<12?'Good morning':hr<17?'Good afternoon':'Good evening')+(who?', '+who:'');
  $('homeDate').textContent=new Date().toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'});
  const inv=Array.isArray(db.invoices)?db.invoices:[];
  const unpaid=inv.filter(x=>x&&x.status!=='Paid');
  const late=unpaid.filter(isLate);
  $('statOwed').textContent=rand(unpaid.reduce((a,x)=>a+n(x.amount),0));
  const lateEl=$('statOwedSub');
  lateEl.textContent=late.length?(late.length+(late.length===1?' invoice is':' invoices are')+' late'):(unpaid.length?unpaid.length+' unpaid':'Nothing owed');
  lateEl.classList.toggle('late',late.length>0);
  const q=(Array.isArray(db.quotes)?db.quotes:[]).filter(x=>x&&['Sent','Awaiting'].includes(x.status));
  $('statQuotes').textContent=String(q.length);
  $('statQuotesSub').textContent=q.length?'worth '+rand(q.reduce((a,x)=>a+n(x.amount),0)):'None waiting';
  const jobs=(Array.isArray(db.projects)?db.projects:[]).filter(x=>x&&x.status!=='Complete');
  const wk=new Date();wk.setDate(wk.getDate()+7);
  const soon=jobs.filter(x=>{const d=x.due&&x.due!=='—'?new Date(x.due):null;return d&&!isNaN(d)&&d<=wk});
  $('statJobs').textContent=String(jobs.length);
  $('statJobsSub').textContent=soon.length?soon.length+' due this week':(jobs.length?'Nothing due this week':'No jobs in progress');
  renderAttention(late,soon);
}
function row(dot,title,sub,page,btn){
  const r=document.createElement('div');r.className='row';r.style.cssText='display:flex;align-items:center;gap:12px';
  const d=document.createElement('span');d.style.cssText='width:8px;height:8px;border-radius:4px;flex:none;background:'+dot;
  const t=document.createElement('div');t.style.flex='1';
  const a=document.createElement('div');a.textContent=title;
  const b=document.createElement('div');b.className='mini-stat';b.textContent=sub;
  t.append(a,b);
  const k=document.createElement('button');k.type='button';k.className='btn light';k.textContent=btn;
  k.addEventListener('click',()=>{if(typeof go==='function')go(page)});
  r.append(d,t,k);return r;
}
function renderAttention(late,soon){
  const box=$('todayActions');if(!box)return;
  const today=dayStart(new Date());
  const items=[];
  late.forEach(x=>{
    const d=x.due&&x.due!=='—'?new Date(x.due):null;
    const days=d&&!isNaN(d)?Math.round((today-dayStart(d))/864e5):0;
    items.push(['var(--late)','Invoice is '+(days>0?days+(days===1?' day':' days')+' late':'late'),(x.customer||'')+' · '+rand(x.amount),'payments','Open']);
  });
  (Array.isArray(db.tasks)?db.tasks:[]).filter(t=>t&&t.status!=='Done'&&t.due&&t.due!=='—'&&!isNaN(new Date(t.due))&&dayStart(new Date(t.due))<=today)
    .forEach(t=>items.push(['#2563EB',t.name||'Reminder',dayStart(new Date(t.due))<today?'Was due '+new Date(t.due).toLocaleDateString('en-ZA'):'Due today','tasks','Open']));
  soon.forEach(p=>items.push(['#2563EB','Job due soon: '+(p.name||''),(p.customer||'')+' · '+new Date(p.due).toLocaleDateString('en-ZA'),'projects','Open']));
  (Array.isArray(db.support)?db.support:[]).filter(s=>s&&s.status!=='Closed'&&s.status!=='Resolved'&&['Urgent','High'].includes(s.priority))
    .forEach(s=>items.push(['var(--late)','Urgent support: '+(s.customer||''),String(s.issue||'').slice(0,80),'support','Open']));
  box.textContent='';
  if(!items.length){const e=document.createElement('div');e.className='empty';e.textContent='All clear. Nothing needs you right now.';box.appendChild(e);return}
  items.slice(0,8).forEach(i=>box.appendChild(row(...i)));
}
const baseDash=window.renderDashboard;
if(typeof baseDash==='function'){
  window.renderDashboard=function(){try{baseDash.apply(this,arguments)}finally{try{renderHome()}catch(e){}}};
}
try{renderHome()}catch(e){}

/* open the "More" menu group when one of its pages is showing */
const baseGo=window.go;
if(typeof baseGo==='function'){
  window.go=function(id){baseGo(id);const b=document.querySelector('.side .nav-more [data-page="'+id+'"]');if(b){const d=b.closest('details');if(d)d.open=true}};
}

})();
