const CACHE='hetzen-portal-shell-v1';
const SHELL=['./business-portal.html','./manifest.webmanifest','./logo.png','./hetzen-logo-transparent.png','./supabase-config.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=new URL(event.request.url);
  if(u.origin!==location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r;
  }).catch(()=>caches.match('./business-portal.html'))));
});