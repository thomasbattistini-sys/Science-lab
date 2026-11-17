/* Melchior's Maths Lab offline cache (scope ./ = /Science-lab/maths/). Separate from Science Lab. */
'use strict';
const PREFIX='maths-lab-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'v2-20261117-history-explain';
const FILES=['./','./index.html','./app.js','./marking.js','./skills.js','./explain.js','./history.js','./data.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./fig/Lshape.svg','./fig/Tshape.svg','./fig/cube3.svg','./fig/cube4.svg','./fig/cubs0.svg','./fig/cubs1.svg','./fig/cubv0.svg','./fig/cubv1.svg','./fig/cutout.svg','./fig/equi.svg','./fig/g_isos.svg','./fig/g_line1.svg','./fig/g_line2.svg','./fig/g_point1.svg','./fig/g_quad1.svg','./fig/g_tri1.svg','./fig/house.svg','./fig/logo.svg','./fig/mockL.svg','./fig/mockcub.svg','./fig/mocktrap.svg','./fig/mocktri.svg','./fig/para0.svg','./fig/para1.svg','./fig/para2.svg','./fig/para3.svg','./fig/para4.svg','./fig/rect1.svg','./fig/rect2.svg','./fig/step.svg','./fig/trap0.svg','./fig/trap1.svg','./fig/trap2.svg','./fig/trap3.svg','./fig/trap4.svg','./fig/trap5.svg','./fig/trapx.svg','./fig/tri0.svg','./fig/tri1.svg','./fig/tri2.svg','./fig/tri3.svg','./fig/tri4.svg','./fig/tri_h.svg','./fig/twotrap.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data==='status'&&event.ports[0])event.waitUntil(caches.open(CACHE).then(cache=>cache.match(new URL('./index.html',self.registration.scope).href)).then(hit=>event.ports[0].postMessage(hit?'offline-ready':'not-ready')));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),3500);let response;try{response=await fetch(request,{signal:controller.signal});}finally{clearTimeout(timer);}if(response.ok){const cache=await caches.open(CACHE);await cache.put(new URL('./index.html',self.registration.scope).href,response.clone());return response;}throw new Error('Navigation unavailable');}catch(e){return await caches.match(new URL('./index.html',self.registration.scope).href,{cacheName:CACHE})||new Response('Open Maths Lab online once to prepare offline use.',{status:503,headers:{'Content-Type':'text/plain'}});}})());return;
 }
 const clean=url.origin+url.pathname;
 if(FILES.slice(1).some(f=>clean===new URL(f,self.registration.scope).href))event.respondWith(caches.open(CACHE).then(c=>c.match(clean)).then(hit=>hit||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(clean,copy));}return response;})));
});
