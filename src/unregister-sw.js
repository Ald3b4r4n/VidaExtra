// Força remoção de Service Workers durante desenvolvimento
(async function () {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("Service Worker removido:", registration.scope);
      }

      // Limpa caches antigos
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log("Cache removido:", cacheName);
      }

      // Limpa localStorage se tiver dados antigos de redirect
      const hasOldData = localStorage.getItem("vidaextra-redirect");
      if (hasOldData) {
        localStorage.clear();
        console.log("LocalStorage limpo");
      }

      // Se havia SW/cache, recarrega a página uma vez para aplicar mudanças
      if (registrations.length > 0 || cacheNames.length > 0) {
        const reloaded = sessionStorage.getItem("sw-cleaned");
        if (!reloaded) {
          sessionStorage.setItem("sw-cleaned", "true");
          window.location.reload(true);
        }
      }
    } catch (err) {
      console.warn("Erro ao remover SW:", err);
    }
  }
})();
