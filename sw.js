// Fonctionnement hors connexion. La version du cache et les listes de fichiers sont posées à la construction
// (vite.config.ts) : la version change toute seule dès qu'un fichier change.
const CACHE = 'lexicolab-f7fffacfa6';
const COQUILLE = ["./","assets/index-Bp_BAAg2.js","assets/index-b2z42xIz.css","donnees/LICENCE.txt","donnees/noyau/criteres.txt","donnees/noyau/index.txt","donnees/noyau/manifeste.json","donnees/noyau/mots-du-jour.txt","icone-192.png","icone-512.png","index.html","manifest.webmanifest"];      // ce qu'il faut pour ouvrir l'application et chercher un mot
const PAQUETS = ["donnees/noyau/affixes.json","donnees/noyau/courbe.json","donnees/noyau/definitions-a.json","donnees/noyau/definitions-b.json","donnees/noyau/definitions-c.json","donnees/noyau/definitions-d.json","donnees/noyau/definitions-e.json","donnees/noyau/definitions-f.json","donnees/noyau/definitions-g.json","donnees/noyau/definitions-h.json","donnees/noyau/definitions-i.json","donnees/noyau/definitions-j.json","donnees/noyau/definitions-k.json","donnees/noyau/definitions-l.json","donnees/noyau/definitions-m.json","donnees/noyau/definitions-n.json","donnees/noyau/definitions-o.json","donnees/noyau/definitions-p.json","donnees/noyau/definitions-q.json","donnees/noyau/definitions-r.json","donnees/noyau/definitions-s.json","donnees/noyau/definitions-t.json","donnees/noyau/definitions-u.json","donnees/noyau/definitions-v.json","donnees/noyau/definitions-w.json","donnees/noyau/definitions-x.json","donnees/noyau/definitions-y.json","donnees/noyau/definitions-z.json","donnees/noyau/langues.txt","donnees/noyau/origines-a.json","donnees/noyau/origines-b.json","donnees/noyau/origines-c.json","donnees/noyau/origines-d.json","donnees/noyau/origines-e.json","donnees/noyau/origines-f.json","donnees/noyau/origines-g.json","donnees/noyau/origines-h.json","donnees/noyau/origines-i.json","donnees/noyau/origines-j.json","donnees/noyau/origines-k.json","donnees/noyau/origines-l.json","donnees/noyau/origines-m.json","donnees/noyau/origines-n.json","donnees/noyau/origines-o.json","donnees/noyau/origines-p.json","donnees/noyau/origines-q.json","donnees/noyau/origines-r.json","donnees/noyau/origines-s.json","donnees/noyau/origines-t.json","donnees/noyau/origines-u.json","donnees/noyau/origines-v.json","donnees/noyau/origines-w.json","donnees/noyau/origines-x.json","donnees/noyau/origines-y.json","donnees/noyau/origines-z.json","donnees/noyau/paquet-a.txt","donnees/noyau/paquet-b.txt","donnees/noyau/paquet-c.txt","donnees/noyau/paquet-d.txt","donnees/noyau/paquet-e.txt","donnees/noyau/paquet-f.txt","donnees/noyau/paquet-g.txt","donnees/noyau/paquet-h.txt","donnees/noyau/paquet-i.txt","donnees/noyau/paquet-j.txt","donnees/noyau/paquet-k.txt","donnees/noyau/paquet-l.txt","donnees/noyau/paquet-m.txt","donnees/noyau/paquet-n.txt","donnees/noyau/paquet-o.txt","donnees/noyau/paquet-p.txt","donnees/noyau/paquet-q.txt","donnees/noyau/paquet-r.txt","donnees/noyau/paquet-s.txt","donnees/noyau/paquet-t.txt","donnees/noyau/paquet-u.txt","donnees/noyau/paquet-v.txt","donnees/noyau/paquet-w.txt","donnees/noyau/paquet-x.txt","donnees/noyau/paquet-y.txt","donnees/noyau/paquet-z.txt","donnees/noyau/registres.json","donnees/noyau/sens-mots.txt","donnees/noyau/sens-vecteurs.bin","donnees/noyau/sens.txt"];        // le détail des mots et leurs définitions, gardés ensuite en arrière-plan

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c)))).then(() => self.clients.claim()));
});

// L'application demande, une fois ouverte, de garder aussi les paquets : toutes les fiches marchent alors sans réseau.
self.addEventListener('message', (e) => {
  if (e.data !== 'garder-les-paquets') return;
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    for (const fichier of PAQUETS) {
      if (!(await c.match(fichier))) await c.add(fichier).catch(() => {});
    }
  }));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  const chemin = new URL(e.request.url).pathname;
  // Les données et les fichiers numérotés ne changent jamais sous un même nom de cache : la copie gardée suffit.
  if (chemin.includes('/donnees/') || chemin.includes('/assets/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const garde = await c.match(e.request);
      if (garde) return garde;
      const reponse = await fetch(e.request);
      if (reponse.ok) c.put(e.request, reponse.clone());
      return reponse;
    }));
    return;
  }
  // Le reste : avec du réseau, on prend toujours la dernière version et on la garde ; sans réseau, la copie gardée.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((reponse) => {
      if (reponse.ok) {
        const copie = reponse.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie));
      }
      return reponse;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
