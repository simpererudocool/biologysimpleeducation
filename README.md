# Protobash

A lightweight desktop-style proxy browser built on Scramjet 2, the Scramjet controller and utilities, libcurl transport, and Wisp.

## Setup

Requires Node.js 20.19+ and pnpm 10+.

```bash
pnpm install
pnpm start
```

Open <http://localhost:8080> and launch **Browser** from the desktop or dock. Bare search terms use DuckDuckGo HTML because Google commonly rate-limits shared proxy IPs with 429/reCAPTCHA.

## How it is wired

- `src/index.js` serves the public site and mounts core assets at `/scram/`, the controller at `/controller/`, utilities at `/utils/`, and libcurl at `/libcurl/`.
- `/libcurl/` serves the libcurl transport.
- `/wisp/` is the WebSocket transport endpoint.
- `public/sw.js` uses the Scramjet 2 service-worker router for proxied requests and leaves other requests untouched.
- `public/index.js` registers the service worker, loads the Scramjet 2 browser bundles, and initializes the controller with libcurl transport.

The service worker must be used from HTTPS in production. Localhost is allowed by browsers for development.

## Scramjet 2 runtime assets

Scramjet 2 is currently published as a prerelease, so this project pins compatible package versions explicitly. The server serves the core, controller, utilities, and libcurl browser assets directly from their installed packages:

- `/scram/scramjet.js` and `/scram/scramjet.wasm`
- `/controller/controller.api.js`, `/controller/controller.sw.js`, and `/controller/controller.inject.js`
- `/utils/scramjet-utils.js`
- `/libcurl/index.mjs`

The service worker is registered at `/sw.js?v=2` to install the Scramjet v2 router and claim the page before the controller starts. If a browser still has a stale worker after upgrading, unregister it in DevTools → Application → Service Workers, clear site data, and reload.

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
