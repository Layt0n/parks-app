/* parks, service worker.
 *
 * Strategie cache-first sur les ressources de l'application. Bumper
 * CACHE_VERSION force le retelechargement de tout, c'est le seul levier de
 * mise a jour : deploy.sh l'incremente automatiquement quand un fichier a change.
 *
 * Les tuiles du fond de carte ne sont volontairement pas mises en cache ici.
 * Hors ligne, le fond reste gris, les marqueurs et les listes fonctionnent.
 */

var CACHE_VERSION = 10;
var CACHE = "parks-v" + CACHE_VERSION;

var ASSETS = [
  "./",
  "./index.html",
  "./places_abc.json",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // un echec isole (CDN injoignable) ne doit pas faire echouer l'installation
      return Promise.all(ASSETS.map(function(u){
        return c.add(new Request(u, { mode: u.indexOf("http") === 0 ? "cors" : "same-origin" }))
                .catch(function(err){ console.warn("sw: non mis en cache", u, err); });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  // les tuiles restent au reseau et au cache HTTP du navigateur
  if (req.url.indexOf("tile.openstreetmap.org") >= 0) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: false }).then(function(hit){
      if (hit) return hit;
      return fetch(req).then(function(res){
        if (res && (res.ok || res.type === "opaque")){
          var copie = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copie); });
        }
        return res;
      }).catch(function(){
        // hors ligne et hors cache : servir la coquille pour toute navigation
        if (req.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 504, statusText: "hors ligne" });
      });
    })
  );
});
