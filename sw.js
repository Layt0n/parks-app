/* parks, service worker.
 *
 * Strategie cache-first sur les ressources de l'application. Bumper
 * CACHE_VERSION force le retelechargement de tout, c'est le seul levier de
 * mise a jour : deploy.sh l'incremente automatiquement quand un fichier a change.
 *
 * L'installation ne met en cache QUE le shell (index, manifest, icones, Leaflet) :
 * l'epoque ou places_abc.json, 11,4 Mo, faisait partie de l'installation, la mise
 * a jour mettait des dizaines de secondes a s'activer sur le telephone, l'onglet
 * ferme avant la fin, l'ancien service worker restait actif et servait l'ancienne
 * base pour toujours : les lieux existants devenaient « introuvables ». La base
 * se met en cache au premier telechargement qui la traverse, offline garanti
 * ensuite, l'activation du nouveau worker est quasi immediate.
 *
 * Ne sont mis en cache que les fichiers de l'app (meme origine) et Leaflet :
 * la meteo Open-Meteo et le resume Wikipedia passent chaque fois au reseau,
 * jamais servi perime. Les tuiles du fond restent hors cache.
 */

var CACHE_VERSION = 21;
var CACHE = "parks-v" + CACHE_VERSION;

var ASSETS = [
  "./",
  "./index.html",
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
  // l'app et ses dependances seulement : meteo et Wikipedia ne se cachent jamais
  var deApp = req.url.indexOf(self.location.origin) === 0
           || req.url.indexOf("https://cdnjs.cloudflare.com/") === 0;
  if (!deApp) return;

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
