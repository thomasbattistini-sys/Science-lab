/* Scoped, versioned offline cache. No background sync or analytics. */
'use strict';
const PREFIX='science-lab-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'b1923d807364';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data==='status'&&event.ports[0])event.waitUntil(caches.open(CACHE).then(cache=>cache.match(new URL('./index.html',self.registration.scope).href)).then(hit=>event.ports[0].postMessage(hit?'offline-ready':'not-ready')));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),3500);let response;try{response=await fetch(request,{signal:controller.signal});}finally{clearTimeout(timer);}if(response.ok){const cache=await caches.open(CACHE);await cache.put(new URL('./index.html',self.registration.scope).href,response.clone());return response;}throw new Error('Navigation unavailable');}catch(e){return await caches.match(new URL('./index.html',self.registration.scope).href)||new Response('Open Science Lab online once to prepare offline use.',{status:503,headers:{'Content-Type':'text/plain'}});}})());return;
 }
 if(FILES.slice(1).some(file=>url.href===new URL(file,self.registration.scope).href))event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;})));
});
