const CACHE_NAME = 'vidaextra-ac4-v2';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'operador.jpg',
  'manifest.json',
  'valores-ac4.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força a ativação imediata
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Toma controle imediato de todas as páginas
});

// Estratégia: Cache-first com fallback para rede
self.addEventListener('fetch', (event) => {
  // Ignora requisições de terceiros (CDNs são incluídas no cache inicial)
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.includes('extension') || 
      !(event.request.url.indexOf('http') === 0)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se existir
        if (response) {
          return response;
        }

        // Para navegação, retorna a página inicial
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        // Busca na rede
        return fetch(event.request)
          .then((response) => {
            // Não cacheamos respostas inválidas
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Adiciona ao cache para próximas requisições
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback para páginas
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Mensagem para atualização
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
