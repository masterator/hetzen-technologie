(function(){
'use strict';
const same=(a,b)=>String(a??'').trim().toLowerCase()===String(b??'').trim().toLowerCase();
const metaKey='hetzenSyncMetaV1';
function stable(p){return String(p).toUpperCase()+'-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36))}
function migrate(){
 db.customers=(db.customers||[]).map(c=>{if(!c.id)c.id=stable('CUS');return c});
 db.leads=(db.leads||[]).map(l=>{if(!l.id)l.id=stable('LEAD');return l});
 const m=new Map(db.customers.map(c=>[String(c.name||'').trim().toLowerCase(),c]));
 ['consultations','requirements','projects','quotes','invoices','documents','tasks','support'].forEach(k=>(db[k]||[]).forEach(x=>{const c=m.get(String(x.customer||x.business||'').trim().toLowerCase());if(c)x.customerId=x.customerId||c.id}));
 db._documentCounters=db._documentCounters||{};
}
migrate();
function audit(t,id,a,d){db.auditTrail=Array.isArray(db.auditTrail)?db.auditTrail:[];db.auditTrail.unshift({type:t,id,action:a,details:d,at:new Date().toISOString()});db.auditTrail=db.auditTrail.slice(0,200)}
function pending(){try{const m=JSON.parse(localStorage.getItem(metaKey)||'{}');localStorage.setItem(metaKey,JSON.stringify({...m,pending:true}))}catch(e){}}
const wrap=(name,after)=>{const old=window[name];if(!old)return;window[name]=function(e){const n=db[name==='addCustomer'?'customers':name==='addLead'?'leads':name==='addQuote'?'quotes':name==='addInvoice'?'invoices':'projects'].length;old(e);after(n)}};
wrap('addCustomer',n=>{if(db.customers.length>n){db.customers[0].id=db.customers[0].id||stable('CUS');audit('customer',db.customers[0].id,'created',{name:db.customers[0].name});migrate()}});
wrap('addLead',n=>{if(db.leads.length>n){db.leads[0].id=db.leads[0].id||stable('LEAD');audit('lead',db.leads[0].id,'created',{name:db.leads[0].name});migrate()}});
wrap('addQuote',n=>{if(db.quotes.length>n){const q=db.quotes[0],c=db.customers.find(x=>same(x.name,q.customer));q.customerId=c?.id;q.quoteDate=q.quoteDate||new Date().toISOString().slice(0,10);q.expiryDate=q.expiryDate||document.getElementById('qExpiry')?.value||new Date(Date.now()+14*86400000).toISOString().slice(0,10);audit('quote',q.id,'created',{});migrate()}});
wrap('addInvoice',n=>{if(db.invoices.length>n){const x=db.invoices[0],c=db.customers.find(v=>same(v.name,x.customer));x.customerId=c?.id;x.issuedDate=x.issuedDate||new Date().toISOString().slice(0,10);audit('invoice',x.id,'created',{});migrate()}});
wrap('addProject',n=>{if(db.projects.length>n){const p=db.projects[0],c=db.customers.find(v=>same(v.name,p.customer));p.id=p.id||stable('PRJ');p.customerId=c?.id;audit('project',p.id,'created',{});migrate()}});
const oldReq=window.saveRequirements;if(oldReq)window.saveRequirements=function(e){const name=document.getElementById('rqCustomer')?.value||'',con=db.consultations.filter(x=>same(x.customer||x.business,name)).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0];if(con){if(!rqScope.value.trim())rqScope.value=con.problem||con.desiredOutcome||'';if(!rqTimeline.value.trim())rqTimeline.value=con.timeline||'';if(!rqApproval.value.trim())rqApproval.value=con.approvalContact||'';if(!rqService.value&&con.services){const sv=services.find(x=>same(x[1],con.services.split(',')[0].trim())||same(x[0],con.services.split(',')[0].trim()));if(sv)rqService.value=sv[0]}}oldReq(e);const r=db.requirements[0];if(r){r.customerId=db.customers.find(c=>same(c.name,name))?.id;r.serviceName=services.find(x=>x[0]===r.service)?.[1]||r.serviceName||r.service;migrate()}};
function docNo(kind){db._documentCounters=db._documentCounters||{};const k=kind+'-'+new Date().getFullYear();db._documentCounters[k]=(db._documentCounters[k]||0)+1;localStorage.setItem('hetzenDocumentCounters',JSON.stringify(db._documentCounters));pending();return 'HT-'+kind.toUpperCase().slice(0,3)+'-'+new Date().getFullYear()+'-'+String(db._documentCounters[k]).padStart(4,'0')}
function np(v){return String(v??'').trim()||'Not provided'}
const z=()=>{try{return Object.assign({email:'midimetjasilas93@gmail.com',phone:'081 300 4634',legalName:'Hetzen Records (Pty) Ltd',registrationNumber:'2024/074697/07',paymentTerms:'50% deposit; balance on official handover',quoteValidityDays:14,vatNumber:'',bankName:'',accountName:'Hetzen Records (Pty) Ltd',accountNumber:'',branchCode:''},JSON.parse(localStorage.getItem('hetzenSettings')||'{}'))}catch(e){return{}}};
function documentSettings(){
  try{
    return Object.assign({
      company:'Hetzen Technologies',
      tagline:'Technology. Digital Solutions. Business Growth.',
      email:'midimetjasilas93@gmail.com',
      phone:'081 300 4634',
      paymentTerms:'Not provided'
    },JSON.parse(localStorage.getItem('hetzenSettings')||'{}'));
  }catch(e){
    return {company:'Hetzen Technologies',tagline:'Technology. Digital Solutions. Business Growth.',email:'midimetjasilas93@gmail.com',phone:'081 300 4634',paymentTerms:'Not provided'};
  }
}
const docMoney=v=>money(Number(v||0));
const docText=v=>{const s=String(v??'').trim().replace(/[—–]/g,'');return s||'Not provided'};
const exactCustomer=(recordOrName)=>{
  const ref=typeof recordOrName==='object'&&recordOrName?recordOrName:{name:recordOrName};
  const id=String(ref.customerId||'').trim();
  if(id){
    const byId=db.customers.find(c=>String(c.id||'')===id);
    if(byId)return byId;
  }
  const name=String(ref.name||ref.business||recordOrName||'').trim().toLowerCase();
  return db.customers.find(c=>String(c.name||'').trim().toLowerCase()===name)||null;
};
const docCustomer=(recordOrName)=>{
  const c=exactCustomer(recordOrName);
  if(c)return c;
  const name=typeof recordOrName==='object'&&recordOrName?(recordOrName.name||recordOrName.business||''):recordOrName;
  return {name:docText(name),contact:'Not provided',phone:'Not provided',email:'Not provided',industry:'Not provided',services:'Not provided'};
};
const customerCard=(recordOrName)=>{
  const c=docCustomer(recordOrName);
  return '<div class="doc-card"><h3>Customer</h3>'+
    '<p class="ats-field"><strong>Business:</strong> '+esc(docText(c.name))+'</p>'+
    '<p class="ats-field"><strong>Contact:</strong> '+esc(docText(c.contact))+'</p>'+
    '<p class="ats-field"><strong>Phone:</strong> '+esc(docText(c.phone))+'</p>'+
    '<p class="ats-field"><strong>Email:</strong> '+esc(docText(c.email))+'</p>'+
  '</div>';
};
const companyCard=()=>{
  const s=documentSettings();
  return '<div class="doc-card"><h3>Issued by</h3>'+
    '<p class="ats-field"><strong>Company:</strong> '+esc(docText(s.company||'Hetzen Technologies'))+'</p>'+
    '<p class="ats-field"><strong>Email:</strong> '+esc(docText(s.email))+'</p>'+
    '<p class="ats-field"><strong>Phone:</strong> '+esc(docText(s.phone))+'</p>'+
    '<p class="ats-field"><strong>Location:</strong> South Africa</p>'+
  '</div>';
};
const docValueRow=(label,value)=>'<p class="ats-field"><strong>'+esc(label)+':</strong> '+esc(docText(value))+'</p>';
const docSection=(title,html)=>'<section class="doc-section"><h2>'+esc(title)+'</h2>'+html+'</section>';
const docTable=(headers,rows)=>{
  return '<table class="print-table"><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
    (rows.length?rows.map(row=>'<tr>'+row.map(cell=>'<td>'+esc(docText(cell))+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'">Not provided</td></tr>')+
  '</tbody></table>';
};
const docSignatures=(left,right)=>'<div class="doc-signatures"><div class="signature-line">'+left+'<br>Name: ______________________________</div><div class="signature-line">'+right+'<br>Name: ______________________________</div></div>';
const checklistRows=checklist=>{
  const entries=checklist&&typeof checklist==='object'?Object.entries(checklist):[];
  return entries.map(([label,checked])=>[label,checked?'Complete':'Not completed']);
};
const relatedInvoices=project=>{
  const id=String(project?.id||'').trim();
  const cid=String(project?.customerId||'').trim();
  const name=String(project?.customer||'').trim().toLowerCase();
  return db.invoices.filter(inv=>{
    if(id&&String(inv.projectId||'')===id)return true;
    if(cid&&String(inv.customerId||'')===cid)return true;
    return !inv.customerId&&!inv.projectId&&String(inv.customer||'').trim().toLowerCase()===name;
  });
};
const relatedTasks=project=>{
  const id=String(project?.id||'').trim();
  const cid=String(project?.customerId||'').trim();
  const name=String(project?.customer||'').trim().toLowerCase();
  return db.tasks.filter(task=>{
    if(id&&String(task.projectId||'')===id)return true;
    if(cid&&String(task.customerId||'')===cid)return true;
    return !task.customerId&&!task.projectId&&String(task.customer||'').trim().toLowerCase()===name;
  });
};
const stableNumber=(record,kind)=>{
  if(record&&record.id)return String(record.id);
  return docNo(kind);
};

function printTemplate(title,customer,body,total='',forcedNumber=''){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('print-target'));
  document.getElementById('printSheet')?.remove();
  const s=documentSettings();
  const number=forcedNumber||docNo('custom');
  const sheet=document.createElement('section');
  sheet.id='printSheet';
  sheet.className='page print-target';
  sheet.innerHTML='<div class="print-sheet document-ats">'+
    '<header class="document-header">'+
      '<div class="document-brand">'+
        '<img src="hetzen-logo-transparent.png" alt="Hetzen Technologies official logo" style="background:#111!important">'+
        '<div><div class="document-company">'+esc(docText(s.company||'Hetzen Technologies'))+'</div>'+
        '<div class="document-tagline">'+esc(docText(s.tagline))+'</div></div>'+
      '</div>'+
      '<div class="document-meta"><strong>'+esc(title)+'</strong><br>'+
        'Document Number: '+esc(number)+'<br>'+
        'Issued: '+esc(new Date().toLocaleDateString('en-ZA'))+'<br>'+
        'Customer: '+esc(docText(customer))+
      '</div>'+
    '</header>'+
    '<main><h1 class="document-title">'+esc(title)+'</h1>'+body+
      (total?'<div class="doc-total-box"><div class="doc-total-row grand"><span>Total</span><span>'+esc(total)+'</span></div></div>':'')+
    '</main>'+
    '<footer class="document-footer-brand">'+
      '<div><strong>'+esc(docText(s.company||'Hetzen Technologies'))+'</strong><br>'+esc(docText(s.tagline))+'</div>'+
      '<div>'+esc(docText(s.email))+'<br>'+esc(docText(s.phone))+'<br>South Africa</div>'+
    '</footer>'+
  '</div>';
  document.querySelector('.content').appendChild(sheet);
  sheet.dataset.documentNumber=number;
  document.body.classList.add('document-printing');
  if(!document.getElementById('hetzenDocumentPrintOverrides')){const st=document.createElement('style');st.id='hetzenDocumentPrintOverrides';st.textContent='@media print{.footer-note,.toast{display:none!important}.document-printing .footer-note,.document-printing .toast{display:none!important}.document-ats .document-brand img{background:#111!important;object-fit:contain!important;object-position:left center!important}}';document.head.appendChild(st)}
  const toastEl=document.getElementById('toast');
  const previousToastDisplay=toastEl?toastEl.style.display:'';
  if(toastEl)toastEl.style.display='none';
  const restore=()=>{
    document.body.classList.remove('document-printing');
    if(toastEl)toastEl.style.display=previousToastDisplay;
  };
  window.addEventListener('afterprint',restore,{once:true});
  window.print();
  setTimeout(()=>{restore();sheet.remove()},1200);
  return number;
}

window.generateInvoicePDF=function(i){
  const x=db.invoices[i];if(!x)return;
  x.id=x.id||docNo('invoice');
  const s=documentSettings();
  const customer=docCustomer(x);
  const body=
    '<div class="doc-summary">'+customerCard(x)+
      '<div class="doc-card"><h3>Invoice</h3>'+
        docValueRow('Reference',x.id)+
        docValueRow('Issue date',x.issuedDate||x.createdAt?.slice?.(0,10))+
        docValueRow('Due date',x.due)+
        docValueRow('Payment terms',s.paymentTerms)+
        docValueRow('Status',x.status)+
      '</div>'+
    '</div>'+
    docSection('Invoice Details',docTable(['Service / Description','Amount'],[[x.items||x.description||x.service,' '+docMoney(x.amount)]]))+
    '<div class="doc-note">Please use the invoice reference when making payment. Contact Hetzen Technologies if any invoice information requires correction.</div>'+
    companyCard();
  saveReportHistory({title:'Invoice '+x.id,customer:customer.name,type:'invoice'});
  audit('invoice',x.id,'printed',{});
  persist();
  printTemplate('Tax Invoice',customer.name,body,docMoney(x.amount),x.id);
};

window.generateQuotePDF=function(i){
  const x=db.quotes[i];if(!x)return;
  x.id=x.id||docNo('quote');
  const s=documentSettings();
  const customer=docCustomer(x);
  const body=
    '<div class="doc-summary">'+customerCard(x)+
      '<div class="doc-card"><h3>Quotation</h3>'+
        docValueRow('Reference',x.id)+
        docValueRow('Quote date',x.quoteDate||x.createdAt?.slice?.(0,10))+
        docValueRow('Valid until',x.expiryDate)+
        docValueRow('Payment terms',s.paymentTerms)+
        docValueRow('Status',x.status)+
      '</div>'+
    '</div>'+
    docSection('Scope & Pricing',docTable(['Service / Description','Amount'],[[x.items||x.description||x.service,' '+docMoney(x.amount)]]))+
    docSection('Terms','<p>'+esc(docText(s.paymentTerms))+'</p>')+
    docSignatures('Customer acceptance / authorised signature','Hetzen Technologies representative')+
    companyCard();
  saveReportHistory({title:'Quotation '+x.id,customer:customer.name,type:'quote'});
  audit('quote',x.id,'printed',{});
  persist();
  printTemplate('Quotation',customer.name,body,docMoney(x.amount),x.id);
};

window.generateServicePDF=function(i){
  const x=db.consultations[i];if(!x)return;
  const n=stableNumber(x,'service');
  const customer=docCustomer(x);
  const answers=Object.entries(x.answers||{}).flatMap(([k,v])=>Array.isArray(v)?v.map(a=>[k,a]):[]);
  const body=
    '<div class="doc-summary">'+customerCard(x)+
      '<div class="doc-card"><h3>Engagement</h3>'+
        docValueRow('Reference',n)+
        docValueRow('Date',x.date)+
        docValueRow('Services',x.services)+
        docValueRow('Status',x.status)+
      '</div>'+
    '</div>'+
    docSection('Business Need',
      docValueRow('What the business does',x.businessDescription)+
      docValueRow('Business need',x.problem)+
      docValueRow('Desired outcome',x.desiredOutcome))+
    docSection('Delivery Planning',
      docValueRow('Timeline',x.timeline)+
      docValueRow('Budget',x.budget)+
      docValueRow('Approval contact',x.approvalContact))+
    docSection('Services & Notes',
      docValueRow('Services',x.services)+
      docValueRow('Customer responsibilities',x.customerResponsibilities)+
      docValueRow('Required content',x.requiredContent)+
      docValueRow('Required access',x.requiredAccess)+
      docValueRow('Notes',x.importantNotes))+
    (answers.length?docSection('Service Requirements',docTable(['Area','Requirement'],answers)):'' )+
    docSignatures('Customer approval / authorised signature','Hetzen Technologies representative')+
    companyCard();
  saveReportHistory({title:'Service Report - '+customer.name,customer:customer.name,type:'service'});
  printTemplate('Consultation / Service Report',customer.name,body,'',n);
};

window.generateProjectPDF=function(i){
  const x=db.projects[i];if(!x)return;
  const n=stableNumber(x,'project');
  const customer=docCustomer(x);
  const inv=relatedInvoices(x),tasks=relatedTasks(x);
  const invoiceRows=inv.map(v=>[v.id,v.amount?docMoney(v.amount):'Not provided',v.status]);
  const taskRows=tasks.map(v=>[v.name,v.due,v.status]);
  const body=
    '<div class="doc-summary">'+customerCard(x)+companyCard()+'</div>'+
    docSection('Project Details',
      docTable(['Field','Value'],[
        ['Project name',x.name],['Services',x.services],['Status',x.status],['Due date',x.due],
        ['Progress',String(Number(x.progress||0))+'%']
      ]))+
    (inv.length?docSection('Related Invoices',docTable(['Invoice','Amount','Status'],invoiceRows)):'')+
    (tasks.length?docSection('Related Tasks',docTable(['Task','Due date','Status'],taskRows)):'')+
    docSignatures('Customer acknowledgement','Hetzen Technologies representative');
  saveReportHistory({title:'Project Report - '+x.name,customer:customer.name,type:'project'});
  printTemplate('Project Report',customer.name,body,'',n);
};

window.generateRequirementsPDF=function(i){
  const x=db.requirements[i];if(!x)return;
  const n=stableNumber(x,'requirements');
  const customer=docCustomer(x);
  const sections=[
    ['Service',x.serviceName||x.service],
    ['Scope',x.scope],
    ['Deliverables',x.deliverables],
    ['Customer responsibilities',x.responsibilities],
    ['Content or files needed',x.content],
    ['Access needed',x.access],
    ['Timeline',x.timeline],
    ['Approval contact',x.approvalContact],
    ['Important notes',x.notes],
    ['Status',x.status]
  ];
  const body='<div class="doc-summary">'+customerCard(x)+companyCard()+'</div>'+
    sections.map(([label,value])=>docSection(label,'<p>'+esc(docText(value))+'</p>')).join('')+
    docSection('Service Checklist',
      checklistRows(x.checklist).length?docTable(['Checklist item','Status'],checklistRows(x.checklist)):'<p>Not provided</p>');
  saveReportHistory({title:'Requirements & Scope',customer:customer.name,type:'requirements'});
  printTemplate('Requirements & Scope',customer.name,body,'',n);
};

window.generateDocumentPDF=function(i){
  const d=db.documents[i];if(!d)return;
  const type=String(d.type||'').toLowerCase();
  const customer=docCustomer(d);
  const customerId=String(d.customerId||customer.id||'').trim();
  const exactRecord=(items,extraMatch)=>{
    if(customerId){
      const byId=items.find(v=>String(v.customerId||'')===customerId);
      if(byId)return byId;
    }
    return items.find(v=>extraMatch(v)&&String(v.customer||v.business||'').trim().toLowerCase()===String(customer.name||'').trim().toLowerCase());
  };
  if(type.includes('invoice')){
    const x=exactRecord(db.invoices,v=>String(v.id||'')===String(d.reference||d.name||'')||true);
    if(x)return generateInvoicePDF(db.invoices.indexOf(x));
  }
  if(type.includes('quote')){
    const x=exactRecord(db.quotes,v=>String(v.id||'')===String(d.reference||d.name||'')||true);
    if(x)return generateQuotePDF(db.quotes.indexOf(x));
  }
  if(type.includes('project')){
    const x=exactRecord(db.projects,v=>String(v.name||'')===String(d.reference||d.name||''));
    if(x)return generateProjectPDF(db.projects.indexOf(x));
  }
  if(type.includes('service')||type.includes('consult')){
    const x=exactRecord(db.consultations,v=>String(v.business||'')===String(customer.name||''));
    if(x)return generateServicePDF(db.consultations.indexOf(x));
  }
  if(type.includes('require')){
    const x=exactRecord(db.requirements,v=>String(v.serviceName||v.service||'')===String(d.reference||d.name||''));
    if(x)return generateRequirementsPDF(db.requirements.indexOf(x));
  }
  const body='<div class="doc-summary">'+customerCard(d)+companyCard()+'</div>'+
    docSection('Document Information',docValueRow('Document',d.name)+docValueRow('Type',d.type)+docValueRow('Status',d.status));
  printTemplate(docText(d.name),customer.name,body,'',stableNumber(d,'custom'));
};

window.generateCustomerStatement=function(name){
  const c=exactCustomer(name);
  const customerName=c?c.name:docText(name);
  const inv=c?db.invoices.filter(x=>{
    if(String(x.customerId||'').trim())return String(x.customerId)===String(c.id);
    return String(x.customer||'').trim().toLowerCase()===String(c.name||'').trim().toLowerCase();
  }):db.invoices.filter(x=>String(x.customer||'').trim().toLowerCase()===String(customerName).trim().toLowerCase());
  const total=inv.reduce((a,x)=>a+Number(x.amount||0),0);
  const paid=inv.filter(x=>String(x.status||'').toLowerCase()==='paid').reduce((a,x)=>a+Number(x.amount||0),0);
  const outstanding=Math.max(0,total-paid);
  const body='<div class="doc-summary">'+customerCard(c||{name:customerName})+companyCard()+'</div>'+
    docSection('Invoice History',docTable(['Invoice','Issue date','Due date','Status','Amount'],inv.map(x=>[x.id,x.issuedDate||x.createdAt?.slice?.(0,10),x.due,x.status,docMoney(x.amount)])))+
    '<div class="doc-total-box">'+
      '<div class="doc-total-row"><span>Total Recorded</span><span>'+esc(docMoney(total))+'</span></div>'+
      '<div class="doc-total-row"><span>Total Paid</span><span>'+esc(docMoney(paid))+'</span></div>'+
      '<div class="doc-total-row grand"><span>Outstanding</span><span>'+esc(docMoney(outstanding))+'</span></div>'+
    '</div>';
  saveReportHistory({title:'Customer Statement',customer:customerName,type:'statement'});
  printTemplate('Customer Statement',customerName,body, '', stableNumber(c||{id:''},'statement'));
};

const oldGenerateCustomReport=window.generateCustomReport;
window.generateCustomReport=function(e){
  e.preventDefault();
  const type=document.getElementById('rType')?.value||'custom';
  const customerName=document.getElementById('rCustomer')?.value||'';
  const exactName=String(customerName).trim().toLowerCase();
  const findByCustomer=(items,field='customer')=>items.find(v=>{
    const cid=String(v.customerId||'').trim();
    const c=exactCustomer(customerName);
    if(c&&cid)return cid===String(c.id||'');
    return String(v[field]||v.customer||v.business||'').trim().toLowerCase()===exactName;
  });
  if(type==='invoice'){const x=findByCustomer(db.invoices);if(x)return window.generateInvoicePDF(db.invoices.indexOf(x))}
  if(type==='quote'){const x=findByCustomer(db.quotes);if(x)return window.generateQuotePDF(db.quotes.indexOf(x))}
  if(type==='project'){const x=findByCustomer(db.projects);if(x)return window.generateProjectPDF(db.projects.indexOf(x))}
  if(type==='service'||type==='consultation'){const x=findByCustomer(db.consultations,'business');if(x)return window.generateServicePDF(db.consultations.indexOf(x))}
  if(type==='requirements'){const x=findByCustomer(db.requirements);if(x)return window.generateRequirementsPDF(db.requirements.indexOf(x))}
  if(type==='statement')return window.generateCustomerStatement(customerName);
  if(type==='customer'){
    const c=exactCustomer(customerName),customer=docCustomer(c||customerName);
    const body='<div class="doc-summary">'+customerCard(c||customerName)+companyCard()+'</div>'+
      docSection('Customer Profile',docValueRow('Industry',customer.industry)+docValueRow('Services',customer.services)+docValueRow('Status',customer.status));
    return printTemplate('Customer Report',customer.name,body,'',stableNumber(c||{},'customer'));
  }
  if(typeof oldGenerateCustomReport==='function')return oldGenerateCustomReport(e);
};
const oldBackup=window.exportBackup;if(oldBackup)window.exportBackup=function(){oldBackup();localStorage.setItem('hetzenLastBackupAt',new Date().toISOString())};
window.exportInvoicesCSV=()=>csvDownload('hetzen-invoices.csv',['id','customer','amount','due','status']);
window.exportProjectsCSV=()=>csvDownload('hetzen-projects.csv',['name','customer','services','status','due','progress']);
function csvDownload(name,keys){const rows=[keys.join(',')].concat(db[keys[0]==='id'?'invoices':'projects'].map(r=>keys.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(',')));const u=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),500)}
setTimeout(()=>{const b=document.getElementById('backupStatus');if(b){const t=localStorage.getItem('hetzenLastBackupAt');b.textContent=t&&Date.now()-Date.parse(t)<604800000?'Last full backup: '+new Date(t).toLocaleString('en-ZA'):'Backup reminder: download a full backup at least every 7 days.'}},0);
document.addEventListener('click',e=>{const b=e.target.closest('.customer360-save');if(!b)return;const old=b.dataset.original||'',name=(document.getElementById('c360Name')?.value||'').trim();if(name&&db.customers.some(c=>String(c.name||'').trim().toLowerCase()===name.toLowerCase()&&String(c.name||'').trim().toLowerCase()!==old.toLowerCase())){e.stopImmediatePropagation();e.preventDefault();toast('A customer with this name already exists. Choose a different name.')}},true);
const auto=window.renderAutomations;if(auto)window.renderAutomations=function(){auto();const b=document.getElementById('automationList');if(b&&!document.getElementById('customAutomationNote')){const n=document.createElement('div');n.id='customAutomationNote';n.className='notice';n.textContent='Custom automations are notes only. Built-in lifecycle automations run automatically when enabled.';b.prepend(n)}};
})();
