# Kernel Exploit

A GNOME-inspired personal web desktop with a routed Scramjet browser, BareMux, libcurl transport, Wisp, and a customizable game vault.

## Setup

Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm start
```

Open <http://localhost:8080>. Use the Kernel Exploit desktop, open **browser**, or launch Roblox from **game vault**. Bare search terms use DuckDuckGo HTML because Google commonly rate-limits shared proxy IPs with 429/reCAPTCHA. Add your own game links to the cards in `public/index.html` when ready.

## How it is wired

- `src/index.js` serves the public site and mounts the package assets at `/scram/`.
- `/baremux/` serves the BareMux worker.
- `/libcurl/` serves the libcurl transport.
- `/wisp/` is the WebSocket transport endpoint.
- `public/sw.js` loads `scramjet.all.js`, routes proxy requests, and passes other requests through.
- `public/index.js` initializes `ScramjetController`, registers the service worker, and configures BareMux.

The service worker must be used from HTTPS in production. Localhost is allowed by browsers for development.

## Troubleshooting `Invalid URL scheme: None`

The npm `2.0.0-alpha` package is currently marked by its own registry metadata as broken, and its bundled Epoxy client can produce this error. This starter uses the maintained v1.1.0 release so the documented controller and service-worker API works reliably.

After changing versions, reinstall and clear the old browser state. The proxy frame is styled to fill the entire viewport; if an older page remains letterboxed, reload after clearing the service worker:

```bash
pnpm install
pnpm start
```

Then unregister the old service worker in DevTools → Application → Service Workers, clear site data, and reload the exact URL printed by the server, typically `http://localhost:8080`. The registration is equivalent to `navigator.serviceWorker.register('/sw.js', { scope: '/' })`.

## Scramjet runtime assets

The server imports `scramjetPath` from `@mercuryworkshop/scramjet/path` and serves its generated assets under `/scram/`, including:

- `/scram/scramjet.all.js`
- `/scram/scramjet.wasm.wasm`
- `/scram/scramjet.sync.js`

No manual copying of the Scramjet bundle is needed.

## Privacy and security

A proxy changes the destination-facing network path; it does **not** make the operator anonymous. Destination sites normally see the proxy server's egress IP, while the proxy host can see incoming client connections and may have network/provider logs. This app does not display client IPs in its UI and disables Wisp logging, but production hosting, reverse proxies, and access logs still need your own privacy policy.

Before exposing it publicly, configure Wisp host restrictions, rate limiting, authentication, resource limits, and an allowlist appropriate for your environment. Do not use it to bypass access controls or policies you do not have permission to bypass.

## TypeScript

If you add TypeScript files, include the Scramjet global types in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "typeRoots": ["node_modules/@mercuryworkshop/scramjet"]
  }
}
```
