/* Service worker do Meu Dia a Dia.
   Guarda o app no aparelho para funcionar sem internet.
   Ao publicar uma versão nova, troque o número em VERSAO. */
var VERSAO = 'dia-v1';
var ARQUIVOS = [
  './','./index.html','./manifest.webmanifest',
  './icones/icone-192.png','./icones/icone-512.png',
  './icones/icone-maskable-512.png','./icones/apple-touch-icon.png'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSAO).then(function(c){ return c.addAll(ARQUIVOS); })
    .then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ns){
    return Promise.all(ns.map(function(n){ if(n!==VERSAO) return caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  if(new URL(req.url).origin!==self.location.origin) return;
  e.respondWith(caches.match(req).then(function(achou){
    if(achou) return achou;
    return fetch(req).then(function(resp){
      if(resp && resp.status===200 && resp.type==='basic'){
        var copia=resp.clone();
        caches.open(VERSAO).then(function(c){ c.put(req, copia); });
      }
      return resp;
    }).catch(function(){
      if(req.mode==='navigate') return caches.match('./index.html');
      return new Response('', {status:504, statusText:'sem conexão'});
    });
  }));
});
