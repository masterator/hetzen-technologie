function toggleMenu(){document.getElementById("nav").classList.toggle("open")}
document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("nav").classList.remove("open")));
document.getElementById("enquiry").addEventListener("submit",function(e){
  e.preventDefault();
  const fd=new FormData(this);
  const subject=encodeURIComponent("Hetzen Technologies Project Enquiry - "+(fd.get("business")||"New Client"));
  const body=encodeURIComponent(
    "Name: "+fd.get("name")+"\n"+
    "Business: "+(fd.get("business")||"Not provided")+"\n"+
    "Service: "+fd.get("service")+"\n\n"+
    "What they need:\n"+fd.get("problem")
  );
  window.location.href="mailto:midimetjasilas93@gmail.com?subject="+subject+"&body="+body;
});