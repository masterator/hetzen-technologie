import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';

const port = 4173;
const server = spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
const base = `http://127.0.0.1:${port}`;
const artifacts='test-artifacts';
rmSync(artifacts,{recursive:true,force:true}); mkdirSync(artifacts,{recursive:true});
const wait = ms => new Promise(r=>setTimeout(r,ms));

const data = {
  customers:[{id:'CUS-TEST-001',name:'Browser Test Client',contact:'Test Contact',phone:'071 000 0000',email:'client@example.test',industry:'Retail',services:'Website, POS',projects:1,status:'Active'}],
  leads:[],
  consultations:[{id:'CON-TEST-001',customerId:'CUS-TEST-001',business:'Browser Test Client',contact:'Test Contact',phone:'071 000 0000',email:'client@example.test',industry:'Retail',businessDescription:'Retail business requiring digital tools',problem:'Improve customer ordering',desiredOutcome:'Increase online orders',timeline:'2 weeks',budget:'R10,000',customerResponsibilities:'Provide content and approvals',requiredContent:'Logo and product list',requiredAccess:'Domain and Google Business Profile',approvalContact:'Test Contact',importantNotes:'Browser test consultation',services:'Website, POS',answers:{Website:['Mobile-friendly website','WhatsApp ordering']},status:'Requirements saved',date:'08 Oct 2026'}],
  requirements:[{id:'REQ-TEST-001',customerId:'CUS-TEST-001',customer:'Browser Test Client',service:'web',serviceName:'Website',scope:'Mobile website with ordering',deliverables:'Website and WhatsApp ordering',responsibilities:'Content and approvals',content:'Logo and product list',access:'Domain access',timeline:'2 weeks',approvalContact:'Test Contact',notes:'Test requirements',checklist:{'Mobile-friendly website':true,'WhatsApp ordering':true},status:'In progress'}],
  projects:[{id:'PRJ-TEST-001',customerId:'CUS-TEST-001',name:'Browser Test Website',customer:'Browser Test Client',services:'Website',status:'Build',due:'2026-10-22',progress:40}],
  quotes:[{id:'QUO-TEST-001',customerId:'CUS-TEST-001',customer:'Browser Test Client',amount:1450,items:'Product Catalogue Website',quoteDate:'2026-10-08',expiryDate:'2026-10-22',status:'Sent'}],
  invoices:[{id:'INV-TEST-001',customerId:'CUS-TEST-001',customer:'Browser Test Client',amount:1450,items:'Product Catalogue Website',issuedDate:'2026-10-08',due:'2026-10-22',status:'Due',projectId:'PRJ-TEST-001'}],
  documents:[
    {name:'Invoice Document',customer:'Browser Test Client',customerId:'CUS-TEST-001',type:'invoice',status:'Issued',reference:'INV-TEST-001'},
    {name:'Quotation Document',customer:'Browser Test Client',customerId:'CUS-TEST-001',type:'quote',status:'Sent',reference:'QUO-TEST-001'},
    {name:'Consultation Document',customer:'Browser Test Client',customerId:'CUS-TEST-001',type:'consultation',status:'Saved'},
    {name:'Requirements Document',customer:'Browser Test Client',customerId:'CUS-TEST-001',type:'requirements',status:'In progress'}
  ],
  tasks:[{id:'TASK-TEST-001',customerId:'CUS-TEST-001',customer:'Browser Test Client',projectId:'PRJ-TEST-001',name:'Collect content',due:'2026-10-10',status:'To do'}],
  support:[],forms:[],automations:[]
};
const settings={company:'Hetzen Technologies',tagline:'Technology. Digital Solutions. Business Growth.',email:'midimetjasilas93@gmail.com',phone:'081 300 4634',paymentTerms:'50% deposit; balance on official handover'};

async function seed(page){
  await page.addInitScript(({data,settings})=>{
    localStorage.setItem('hetzenBusinessDataV2',JSON.stringify(data));
    localStorage.setItem('hetzenSettings',JSON.stringify(settings));
    localStorage.setItem('hetzenDocumentCounters',JSON.stringify({}));
  },{data,settings});
  await page.goto(base+'/business-portal.html',{waitUntil:'networkidle'});
  await page.evaluate(()=>{
    document.getElementById('authGate')?.classList.add('auth-hidden');
    document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));
  });
  await wait(500);
}

async function capture(page,fn,name,viewport){
  await page.setViewportSize(viewport);
  await page.evaluate(fn);
  await page.waitForSelector('#printSheet',{state:'attached'});
  await page.emulateMedia({media:'print'});
  const text=await page.locator('#printSheet').innerText();
  const html=await page.locator('#printSheet').innerHTML();
  if(text.includes('—')) throw new Error(name+': contains em dash');
  if(text.includes('Hetzen Records (Pty) Ltd')) throw new Error(name+': legal name leaked');
  if(text.includes('2024/074697/07')) throw new Error(name+': registration number leaked');
  if(/Bank:|Account Number|VAT/i.test(text)) throw new Error(name+': bank/VAT detail leaked');
  if(!html.includes('document-ats')) throw new Error(name+': missing document-ats template');
  if(!html.includes('doc-summary')) throw new Error(name+': missing document summary');
  if(!html.includes('hetzen-logo-transparent.png')) throw new Error(name+': missing logo');
  await page.screenshot({path:`${artifacts}/${name}.png`,fullPage:true});
  await page.pdf({path:`${artifacts}/${name}.pdf`,format:'A4',printBackground:true});
  await page.emulateMedia({media:'screen'});
  return {text,html};
}

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await seed(page);

  const tests=[
    ['invoice-row',()=>window.generateInvoicePDF(0)],
    ['quote-row',()=>window.generateQuotePDF(0)],
    ['consultation-row',()=>window.generateServicePDF(0)],
    ['project-row',()=>window.generateProjectPDF(0)],
    ['requirements-row',()=>window.generateRequirementsPDF(0)],
    ['statement-row',()=>window.generateCustomerStatement('Browser Test Client')]
  ];
  for(const [name,fn] of tests) await capture(page,fn,name,{width:1440,height:1000});

  const invoiceFirst=await page.evaluate(()=>{window.generateInvoicePDF(0);return document.getElementById('printSheet').dataset.documentNumber});
  await page.waitForSelector('#printSheet',{state:'attached'});
  await wait(100);
  const invoiceSecond=await page.evaluate(()=>{window.generateInvoicePDF(0);return document.getElementById('printSheet').dataset.documentNumber});
  if(invoiceFirst!==invoiceSecond) throw new Error('Invoice number changed on reprint');

  const quoteFirst=await page.evaluate(()=>{window.generateQuotePDF(0);return document.getElementById('printSheet').dataset.documentNumber});
  await page.waitForSelector('#printSheet',{state:'attached'}); await wait(100);
  const quoteSecond=await page.evaluate(()=>{window.generateQuotePDF(0);return document.getElementById('printSheet').dataset.documentNumber});
  if(quoteFirst!==quoteSecond) throw new Error('Quote number changed on reprint');

  for(const [name,fn] of [
    ['invoice-doc-page',()=>window.generateDocumentPDF(0)],
    ['quote-doc-page',()=>window.generateDocumentPDF(1)],
    ['consultation-doc-page',()=>window.generateDocumentPDF(2)],
    ['requirements-doc-page',()=>window.generateDocumentPDF(3)]
  ]) await capture(page,fn,name,{width:1440,height:1000});

  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  await seed(mobile);
  for(const [name,fn] of [
    ['invoice-mobile',()=>window.generateInvoicePDF(0)],
    ['quote-mobile',()=>window.generateQuotePDF(0)],
    ['consultation-mobile',()=>window.generateServicePDF(0)],
    ['requirements-mobile',()=>window.generateRequirementsPDF(0)]
  ]) await capture(mobile,fn,name,{width:390,height:844});

  await mobile.emulateMedia({media:'print'}); const visible=await mobile.locator('#printSheet').evaluate(el=>getComputedStyle(el).display!=='none');
  if(!visible) throw new Error('Mobile print sheet is hidden');
  console.log('DOCUMENT BROWSER TESTS PASSED');
} finally {
  await browser.close();
  server.kill();
}
