// Hetzen portal service worker
// Network-first for pages/scripts so security fixes reach every device straight away.
// Falls back to the cached copy only when offline.
const CACHE='hetzen-portal-shell-v2';
const SHELL=['./business-portal.html','./manifest.webmanifest','./logo.png','./hetzen-logo-transparent.png','./supabase-config.js','./portal-hardening.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  // Delete old caches (v1 kept serving outdated code forever)
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.origin!==location.origin)return;

  const isImage=/\.(png|jpg|jpeg|svg|webp|ico)$/i.test(u.pathname);

  if(isImage){
    // Images rarely change: cache-first is fine
    event.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{
      if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return r;
    })));
    return;
  }

  // HTML / JS / CSS / config: always try the network first
  event.respondWith(
    fetch(req).then(r=>{
      if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return r;
    }).catch(()=>caches.match(req).then(c=>c||caches.match('./business-portal.html')))
  );
});
