/* Service worker do Meu Dia a Dia.
   Guarda o app no aparelho para funcionar sem internet.
   Ao publicar uma versão nova, troque o número em VERSAO. */
var VERSAO = 'dia-v3';
var ARQUIVOS = [
  './','./index.html','./manifest.webmanifest',
  './icones/icone-192.png','./icones/icone-512.png',
  './icones/icone-maskable-512.png','./icones/apple-touch-icon.png'
];

/* Na instalação, busca cada arquivo IGNORANDO o cache do navegador
   (cache:'reload'). Sem isso, o navegador pode devolver a versão velha
   que ele ainda guarda e gravá-la no cache novo — que é exatamente o
   motivo de um app publicado continuar aparecendo desatualizado. */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VERSAO).then(function(c){
      return Promise.all(ARQUIVOS.map(function(u){
        return fetch(new Request(u, {cache:'reload'}))
          .then(function(r){ if(r && r.ok) return c.put(u, r); })
          .catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ns){
    return Promise.all(ns.map(function(n){ if(n!==VERSAO) return caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('message', function(e){
  if(e.data === 'pular-espera') self.skipWaiting();
});

self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  if(new URL(req.url).origin!==self.location.origin) return;

  /* Página (index.html): REDE PRIMEIRO. Estando online, o celular sempre
     recebe a versão publicada; sem internet, cai no cache e o app abre
     igual. Os ícones e o manifest continuam vindo do cache primeiro,
     porque quase nunca mudam e assim o app abre instantâneo. */
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(function(resp){
        if(resp && resp.status===200){
          var copia=resp.clone();
          caches.open(VERSAO).then(function(c){ c.put('./index.html', copia); });
        }
        return resp;
      }).catch(function(){
        return caches.match('./index.html').then(function(a){
          return a || new Response('', {status:504, statusText:'sem conexão'});
        });
      })
    );
    return;
  }

  e.respondWith(caches.match(req).then(function(achou){
    if(achou) return achou;
    return fetch(req).then(function(resp){
      if(resp && resp.status===200 && resp.type==='basic'){
        var copia=resp.clone();
        caches.open(VERSAO).then(function(c){ c.put(req, copia); });
      }
      return resp;
    }).catch(function(){
      return new Response('', {status:504, statusText:'sem conexão'});
    });
  }));
});
