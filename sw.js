/* Service worker: precache app shell; network-first for data so updates show; offline fallback. Bump VERSION on each release. */
const VERSION="barmm-ppp-v3.0.0",SHELL=["./","index.html","404.html","assets/styles.css","assets/app.js","assets/survey.json","assets/content.json","assets/vendor/chart.umd.js","assets/MTIT-logo.webp","assets/mtit-icon-192.png","assets/mtit-icon-512.png","manifest.webmanifest"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
 if(u.origin!==location.origin){ // Google Fonts etc.: stale-while-revalidate, fail silently offline
  e.respondWith(caches.open(VERSION).then(c=>c.match(r).then(h=>{const f=fetch(r).then(n=>{c.put(r,n.clone());return n}).catch(()=>h);return h||f})));return}
 const dyn=/\.(json|html|js|css)$/.test(u.pathname)||u.pathname.endsWith("/");
 e.respondWith(dyn?fetch(r).then(n=>{const cp=n.clone();caches.open(VERSION).then(c=>c.put(r,cp));return n}).catch(()=>caches.match(r).then(h=>h||caches.match("index.html")))
  :caches.match(r).then(h=>h||fetch(r).then(n=>{const cp=n.clone();caches.open(VERSION).then(c=>c.put(r,cp));return n})))});
