self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function () {
  self.clients.matchAll({ type: 'window' }).then(function (windowClients) {
    windowClients.forEach((windowClient) => {
      windowClient.navigate(windowClient.url)
    })
  })

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function (registration) {
      registration.unregister().then(() => window.location.reload(true))
    })
  }
})
