"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const browserWindow = document.getElementById("browser-window");
const browserStage = document.getElementById("browser-stage");
const clock = document.getElementById("clock");
const dockBrowser = document.querySelector('.dock-app[data-app="browser"]');
const homeView = document.getElementById("home-view");
const toast = document.getElementById("toast");
const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
});
scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let currentFrame;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function resolveUrl(value) {
  const input = value.trim();
  if (!input) throw new Error("Enter a URL or search term.");
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) return input;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) return `https://${input}`;
  // Google frequently rate-limits shared proxy egress IPs with a 429/reCAPTCHA
  // page, so use a less aggressive search endpoint for bare search terms.
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(input)}`;
}

function updateDock() {
  dockBrowser.classList.toggle("active", !browserWindow.classList.contains("minimized") && !browserWindow.classList.contains("closed"));
}

function openBrowser() {
  browserWindow.classList.remove("minimized", "closed");
  updateDock();
  address.focus();
}

function closeBrowser() {
  browserStage.replaceChildren(homeView);
  currentFrame = undefined;
  error.textContent = "";
}

function hideBrowser() {
  browserWindow.classList.add("closed");
  updateDock();
}

function minimizeBrowser() {
  browserWindow.classList.add("minimized");
  updateDock();
}

function toggleMaximize() {
  browserWindow.classList.toggle("maximized");
}

async function navigate(value) {
  error.textContent = "";
  await registerSW();
  const wispUrl = new URL("/wisp/", location.href);
  wispUrl.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl.toString() }]);
  openBrowser();
  currentFrame = scramjet.createFrame();
  currentFrame.frame.id = "sj-frame";
  currentFrame.frame.title = "Protobash browser";
  currentFrame.frame.allow = "fullscreen; autoplay; clipboard-read; clipboard-write";
  browserStage.replaceChildren(currentFrame.frame);
  currentFrame.go(resolveUrl(value));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await navigate(address.value);
  } catch (err) {
    error.textContent = err instanceof Error ? err.message : String(err);
  }
});

document.getElementById("show-home").addEventListener("click", (event) => {
  event.preventDefault();
  closeBrowser();
});
document.getElementById("browser-home").addEventListener("click", closeBrowser);
document.getElementById("browser-close").addEventListener("click", () => {
  closeBrowser();
  hideBrowser();
});
document.getElementById("browser-minimize").addEventListener("click", minimizeBrowser);
document.getElementById("browser-maximize").addEventListener("click", toggleMaximize);
document.getElementById("show-desktop").addEventListener("click", minimizeBrowser);
document.querySelectorAll('[data-app="browser"]').forEach((button) => {
  button.addEventListener("click", openBrowser);
});
document.getElementById("browser-back").addEventListener("click", () => currentFrame?.back());
document.getElementById("browser-forward").addEventListener("click", () => currentFrame?.forward());
document.getElementById("browser-reload").addEventListener("click", () => currentFrame?.reload());
const privacyMessage = () => showToast(location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "Local mode: the proxy egress is your own network. Remote hosting changes the server egress, but does not guarantee anonymity." : "Destination sites see the proxy server egress IP; browser WebRTC and fingerprinting can still reveal client-side data.");
document.getElementById("privacy-button").addEventListener("click", privacyMessage);
document.getElementById("footer-privacy").addEventListener("click", privacyMessage);

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat([], { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date());
}

updateClock();
setInterval(updateClock, 30000);

document.querySelector(".window-titlebar").addEventListener("dblclick", toggleMaximize);
