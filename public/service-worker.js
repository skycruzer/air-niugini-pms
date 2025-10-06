if (!self.define) {
  let e,
    s = {};
  const a = (a, t) => (
    (a = new URL(a + '.js', t).href),
    s[a] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (t, i) => {
    const n = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[n]) return;
    let c = {};
    const o = (e) => a(e, n),
      r = { module: { uri: n }, exports: c, require: o };
    s[n] = Promise.all(t.map((e) => r[e] || o(e))).then((e) => (i(...e), c));
  };
}
define(['./workbox-93b8dbcf'], function (e) {
  'use strict';
  (importScripts('fallback-Utz-ZmDTIKUgKt9NoFaok.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/PWA-ICONS-README.md', revision: '93b9962337f38008144f6c0eaa995e4c' },
        { url: '/_next/app-build-manifest.json', revision: 'e00e5313dcb94d4d93fcb99d0e4c3e02' },
        {
          url: '/_next/static/Utz-ZmDTIKUgKt9NoFaok/_buildManifest.js',
          revision: '58d5b0629be1f2aeee4f260e197897d9',
        },
        {
          url: '/_next/static/Utz-ZmDTIKUgKt9NoFaok/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/1051-01e0f71f581498a5.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/1460-d58e1c7c192ba001.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/1770-f9a27c0b76c9d24e.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/1940.76470164b01f379d.js', revision: '76470164b01f379d' },
        { url: '/_next/static/chunks/2218.285a11fd55202743.js', revision: '285a11fd55202743' },
        { url: '/_next/static/chunks/2515.f1afc1e3a6c64007.js', revision: 'f1afc1e3a6c64007' },
        { url: '/_next/static/chunks/2607-20d10cf45a0ba51c.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/294-14d1d8fa3f95c9d6.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/3014.1e0bed8b46ce23fb.js', revision: '1e0bed8b46ce23fb' },
        { url: '/_next/static/chunks/3173.15bfe94dee73995e.js', revision: '15bfe94dee73995e' },
        { url: '/_next/static/chunks/383.8df37c28f73624d4.js', revision: '8df37c28f73624d4' },
        { url: '/_next/static/chunks/4072.ad24d4ea4b3600c3.js', revision: 'ad24d4ea4b3600c3' },
        { url: '/_next/static/chunks/5007-c2cdb6dadd73d1cb.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/5092-f6b1dd8b346fcfd9.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/5261-511efa1ec0f27c7f.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/5374-0ed3f2916364baab.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/574-f307eb58a0b2d776.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/5750-26ae39151de11b33.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/5899-b4320eb903b77c00.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/6419-be89737c9dcdaaa2.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/6705-34b0352c4d58ae10.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/6781-ab5a5b58fd2d8090.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/6972-5523d84ddfbe114d.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/7280-19321a340f4b60dc.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/7349-2b07b06008637cc9.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/7398.aa501468a1ddcbbe.js', revision: 'aa501468a1ddcbbe' },
        { url: '/_next/static/chunks/7532-211e6aa394b27b95.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/7672.19e7477af9cbc173.js', revision: '19e7477af9cbc173' },
        { url: '/_next/static/chunks/7976.5355bc436d92d638.js', revision: '5355bc436d92d638' },
        { url: '/_next/static/chunks/8374.16c04450e0dd1fbf.js', revision: '16c04450e0dd1fbf' },
        { url: '/_next/static/chunks/8443-3517bf2dbd63fa90.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/847-5dc7f7f7e7d9a65d.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/8742-f86cbae0a9956758.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/_next/static/chunks/9324.2abfb6703b84267a.js', revision: '2abfb6703b84267a' },
        { url: '/_next/static/chunks/9364.6433c6280ed2132a.js', revision: '6433c6280ed2132a' },
        { url: '/_next/static/chunks/9463.5f0fdaa153523885.js', revision: '5f0fdaa153523885' },
        { url: '/_next/static/chunks/9543.c6f4762c6cdb0123.js', revision: 'c6f4762c6cdb0123' },
        { url: '/_next/static/chunks/9733.cc6678e722eef500.js', revision: 'cc6678e722eef500' },
        { url: '/_next/static/chunks/9905-b2ba6e8829bd4942.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        {
          url: '/_next/static/chunks/app/_not-found/page-8e54677664cc9dce.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/admin/system/page-1db68c3a652cd9e0.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/analytics/advanced/page-d9aa04eca351b406.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/analytics/page-0f40442d18e7ad1e.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/audit/%5Bid%5D/page-747dc3a0bdea2ba2.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/audit/page-cbc9472fdf6ac712.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/certifications/bulk/page-29740da34a70347e.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/certifications/calendar/page-f7334f01fd2b7595.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/certifications/expiry-planning/page-97833baa255d426f.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/certifications/page-0eaad944ba325192.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/disciplinary/new/page-740c262dc8a70330.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/disciplinary/page-ad7e44f583b2a4f7.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/layout-85bd4f4d8eb41738.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/leave/calendar/page-337b18ee7e660cfe.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/leave/page-2499e1239dc28c39.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/leave/roster-planning/page-73d62e0db254e847.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-6adaeb2ac7b9c197.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/pilots/%5Bid%5D/certifications/page-36202f2e5eb23670.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/pilots/%5Bid%5D/certifications/timeline/page-f403a2b3e7285374.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/pilots/%5Bid%5D/page-451f8f190ff14caa.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/pilots/page-4ceeafa6b8457195.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/reports/page-b089b30425d3ae36.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/settings/page-49febb6822af0920.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/tasks/new/page-e669aa9ef4ed33e6.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/dashboard/tasks/page-5548ee0c2f1d0aa5.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/error-292f40387a23f3fa.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/layout-60809542778e5670.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/login/page-73fa0eb9f155fd1a.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/not-found-254b828689950291.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/app/page-29a7e14e29371f38.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/chart-vendor.da73d26a6934bd7c.js',
          revision: 'da73d26a6934bd7c',
        },
        {
          url: '/_next/static/chunks/heavy-vendor.eef3b18119e31b15.js',
          revision: 'eef3b18119e31b15',
        },
        {
          url: '/_next/static/chunks/main-app-2d3f159b9374be2c.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        { url: '/_next/static/chunks/main-b167de4964eb3e04.js', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        {
          url: '/_next/static/chunks/pages/_app-d488d527b47e490d.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/pages/_error-407ff4ac28f5f540.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/radix-vendor.970f62cff563bad8.js',
          revision: '970f62cff563bad8',
        },
        {
          url: '/_next/static/chunks/react-vendor-c5bf74d03b2c2bad.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/vendors-b81574aa2f5c9677.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        {
          url: '/_next/static/chunks/webpack-eb23aec8f7c69d5e.js',
          revision: 'Utz-ZmDTIKUgKt9NoFaok',
        },
        { url: '/_next/static/css/7cca8e2c5137bd71.css', revision: '7cca8e2c5137bd71' },
        { url: '/_next/static/css/8b1675282384109e.css', revision: '8b1675282384109e' },
        {
          url: '/_next/static/media/19cfc7226ec3afaa-s.woff2',
          revision: '9dda5cfc9a46f256d0e131bb535e46f8',
        },
        {
          url: '/_next/static/media/21350d82a1f187e9-s.woff2',
          revision: '4e2553027f1d60eff32898367dd4d541',
        },
        {
          url: '/_next/static/media/8e9860b6e62d6359-s.woff2',
          revision: '01ba6c2a184b8cba08b0d57167664d75',
        },
        {
          url: '/_next/static/media/ba9851c3c22cd980-s.woff2',
          revision: '9e494903d6b0ffec1a1e14d34427d44d',
        },
        {
          url: '/_next/static/media/c5fe6dc8356a8c31-s.woff2',
          revision: '027a89e9ab733a145db70f09b8a18b42',
        },
        {
          url: '/_next/static/media/df0a9ae256c0569c-s.woff2',
          revision: 'd54db44de5ccb18886ece2fda72bdfe0',
        },
        {
          url: '/_next/static/media/e4af272ccee01ff0-s.p.woff2',
          revision: '65850a373e258f1c897a2b3d75eb74de',
        },
        { url: '/apple-touch-icon.svg', revision: '15fb384f80a32e3c64d6cc6e9f1dc429' },
        { url: '/browserconfig.xml', revision: '3a76393febc8efce6790da65060deeac' },
        { url: '/favicon.svg', revision: '826727ff82bba6ccf601d2cdaad12f8d' },
        { url: '/icon-128x128.svg', revision: '1cffb834941e407736988d158157c5c3' },
        { url: '/icon-144x144.svg', revision: '0c3d95b58165abd577108529e9eda567' },
        { url: '/icon-152x152.svg', revision: 'a66c8aca343d7ad5cbb31459b425254a' },
        { url: '/icon-192x192.png', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
        { url: '/icon-192x192.svg', revision: '15fb384f80a32e3c64d6cc6e9f1dc429' },
        { url: '/icon-384x384.svg', revision: '88ada173cb81c34f7124d060851efd1a' },
        { url: '/icon-512x512.svg', revision: '88e3e8fe3b558fe917874aae1f3b8f38' },
        { url: '/icon-72x72.svg', revision: 'c9274786e039afa27ea0d1402dde7151' },
        { url: '/icon-96x96.svg', revision: '402b7091e7129346e0f0c6253777389f' },
        {
          url: '/images/air-niugini-50th-anniversary.jpg',
          revision: 'fe0713931944bae35e2475dbaa59d674',
        },
        { url: '/images/air-niugini-b767-new.jpg', revision: '7180e476c86e03993d985e4cf7cb535f' },
        { url: '/images/air-niugini-logo.jpg', revision: 'c93b55cdfed99b8644db1639f598be73' },
        { url: '/images/boeing-767.jpg', revision: 'ee60a0112ef5fa221fe66f7ffa735840' },
        { url: '/manifest.json', revision: '0cb8291bd78bd46245f1c6fbd428f857' },
        { url: '/offline', revision: 'Utz-ZmDTIKUgKt9NoFaok' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: s, event: a, state: t }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, { status: 200, statusText: 'OK', headers: s.headers })
                : s,
          },
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/.*\.supabase\.co\/.*$/i,
      new e.NetworkFirst({
        cacheName: 'supabase-api-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:json)$/i,
      new e.NetworkFirst({
        cacheName: 'data-cache',
        networkTimeoutSeconds: 5,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 300 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/dashboard\/.*$/i,
      new e.NetworkFirst({
        cacheName: 'dashboard-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 300 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      'GET'
    ));
});
