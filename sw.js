const CACHE_NAME = "bclean-almacen-v2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json"
];


/* =====================================================
   INSTALACIÓN
===================================================== */

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(ARCHIVOS);

      })

  );

  self.skipWaiting();

});


/* =====================================================
   ACTIVACIÓN
===================================================== */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))

        );

      })

  );

  self.clients.claim();

});


/* =====================================================
   PETICIONES
===================================================== */

self.addEventListener("fetch", event => {

  const request = event.request;

  /*
   * Las llamadas al API de Google Apps Script
   * NO se almacenan en caché.
   *
   * Esto es importante porque las entradas,
   * salidas y existencias deben consultar
   * siempre la información actual.
   */

  if(
    request.url.includes("script.google.com") ||
    request.url.includes("googleusercontent.com")
  ){

    event.respondWith(
      fetch(request)
    );

    return;

  }


  /*
   * Para los archivos de la aplicación:
   * primero intenta red y si no hay conexión
   * utiliza la copia almacenada.
   */

  event.respondWith(

    fetch(request)
      .then(response => {

        if(
          response &&
          response.status === 200 &&
          response.type !== "opaque"
        ){

          const copia = response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {
              cache.put(request,copia);
            });

        }

        return response;

      })
      .catch(() => {

        return caches
          .match(request);

      })

  );

});
