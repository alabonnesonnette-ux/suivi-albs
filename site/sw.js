/* Suivi ALBS — service worker : uniquement les notifications de rappel (aucun cache) */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  const title=d.title||"🔔 Rappel Suivi ALBS";
  e.waitUntil(self.registration.showNotification(title,{body:d.body||"",icon:"icon-192.png",data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||"./",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{for(const c of cs){if("navigate" in c){return c.navigate(url).then(w=>w&&w.focus())}}return self.clients.openWindow(url)}))});
