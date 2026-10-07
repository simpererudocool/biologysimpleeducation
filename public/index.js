"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const browserWindow = document.getElementById("browser-window");
const browserStage = document.getElementById("browser-stage");
const gamesWindow = document.getElementById("games-window");
const gameStage = document.getElementById("game-stage");
const gameHomeView = document.getElementById("game-home-view");
const gameFrameButtons = [document.getElementById("game-reload"), document.getElementById("game-fullscreen")];
const clock = document.getElementById("clock");
const dockBrowser = document.querySelector('.dock-app[data-app="browser"]');
const dockLibrary = document.querySelector('.dock-app[data-app="library"]');
const homeView = document.getElementById("home-view");
const toast = document.getElementById("toast");
const gameGrid = document.getElementById("game-grid");
const gameSearch = document.getElementById("game-search");
const gameCount = document.getElementById("game-count");
const gameEmpty = document.getElementById("game-empty");
const loadMoreGames = document.getElementById("load-more-games");
const gamesPerPage = 48;
let games = [];
let activeCategory = "all";
let visibleGames = gamesPerPage;
let currentFrame;
let localFrame;
let activeGameFrame;
let activeGame;
let activeWindow = "browser";
let scramjetController;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

const sportsGames = new Set(["basketballstars", "basketballlegends", "basketballrandom", "basketballbrosio", "basketrandom", "soccerrandom"]);
const racingGames = new Set(["drifthunters", "drivemad", "motox3m", "motoroadrash3d", "topspeedracing3d", "mergeroundracers", "racer", "gopherkart", "tanukisunset", "highwaytraffic", "flightsimulator", "snowbattle", "roadblocks", "slope", "slope2", "cubefield", "hexgl", "getawayshootoutnew"]);
const puzzleGames = new Set(["2048", "connect3", "cuttherope", "cuttheropeholiday", "cuttheropetimetravel", "factoryballsforever", "hextris", "littlealchemy", "packabunchas", "solitaire", "tetris", "themazeofspacegoblins", "breaklock", "chess", "riddleschool2", "sketchbook04"]);
const actionGames = new Set(["1v1lol", "doom", "deathrun3d", "timeshooter", "timeshooter2", "timeshooter3", "stickman-hook", "stickmanhook", "stickmanclimb", "stickmanboost", "stickmansurvival", "vex3", "vex4", "vex5", "vex6", "rooftopsnipers", "friendlyfire", "boxingrandom", "evilglitch", "ninjavsevilcorp", "zombsroyale", "subwaysurfers", "subwaysurfersny", "subwaysurferssingapore", "q1k3", "r3", "radiusraid", "asciispace", "themazeofspacegoblins", "worldshardestgame2", "xx142b2exe"]);

function getGameCategory(id) {
  if (sportsGames.has(id)) return "sports";
  if (racingGames.has(id)) return "racing";
  if (puzzleGames.has(id)) return "puzzle";
  if (actionGames.has(id)) return "action";
  return "arcade";
}

function getGameTitle(game) {
  const knownTitles = {
    basketballstars: "Basketball Stars",
    basketballlegends: "Basketball Legends",
    basketballrandom: "Basket Random",
    basketballbrosio: "Basket Bros",
    basketrandom: "Basket Random",
    drifthunters: "Drift Hunters",
    drivemad: "Drive Mad",
    motox3m: "Moto X3M",
    motoroadrash3d: "Moto Road Rash 3D",
    topspeedracing3d: "Top Speed Racing 3D",
    cuttherope: "Cut the Rope",
    getawayshootoutnew: "Getaway Shootout",
    fridaynightfunkin: "Friday Night Funkin'",
    fireboyandwatergirlforesttemple: "Fireboy and Watergirl",
    "stickman-hook": "Stickman Hook",
    webecomewhatwebehold: "We Become What We Behold",
  };
  if (knownTitles[game.id]) return knownTitles[game.id];
  return game.id.split(/[-_]+/).map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" ");
}

function getGameArtwork(game) {
  const artwork = {
    basketballstars: "/games/basketballstars/assets/images/basketball-stars.png",
    basketballlegends: "/games/basketballlegends/assets/images/logo.png",
  }[game.id];
  return artwork;
}

function getFilteredGames() {
  const query = gameSearch.value.trim().toLocaleLowerCase();
  return games.filter((game) => {
    const category = getGameCategory(game.id);
    return (activeCategory === "all" || category === activeCategory)
      && (!query || getGameTitle(game).toLocaleLowerCase().includes(query));
  });
}

function renderGames() {
  const filtered = getFilteredGames();
  const prioritized = [...filtered].sort((first, second) => {
    const firstFeatured = first.id === "basketballstars" || first.id === "basketballlegends";
    const secondFeatured = second.id === "basketballstars" || second.id === "basketballlegends";
    return Number(secondFeatured) - Number(firstFeatured);
  });
  const fragment = document.createDocumentFragment();
  prioritized.slice(0, visibleGames).forEach((game) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "game-card";
    button.dataset.gameId = game.id;
    if (game.id === "basketballstars" || game.id === "basketballlegends") button.classList.add("game-card-featured");
    button.setAttribute("aria-label", `Play ${getGameTitle(game)}`);
    const art = document.createElement("span");
    art.className = "game-card-art";
    const imageSource = getGameArtwork(game);
    if (imageSource) {
      const image = document.createElement("img");
      image.src = imageSource;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("load", () => art.classList.add("has-image"), { once: true });
      image.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "game-monogram";
        fallback.setAttribute("aria-hidden", "true");
        fallback.textContent = getGameTitle(game).split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
        art.replaceChildren(fallback);
      }, { once: true });
      art.append(image);
    } else {
      const monogram = document.createElement("span");
      monogram.className = "game-monogram";
      monogram.setAttribute("aria-hidden", "true");
      monogram.textContent = getGameTitle(game).split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
      art.append(monogram);
    }
    const info = document.createElement("span");
    info.className = "game-card-info";
    const name = document.createElement("span");
    name.className = "game-card-name";
    name.textContent = getGameTitle(game);
    const tag = document.createElement("span");
    tag.className = "game-card-tag";
    tag.textContent = getGameCategory(game.id);
    info.append(name, tag);
    button.append(art, info);
    button.addEventListener("click", () => launchGame(game));
    fragment.append(button);
  });
  gameGrid.replaceChildren(fragment);
  gameCount.textContent = `${filtered.length} ${filtered.length === 1 ? "game" : "games"}`;
  gameEmpty.hidden = filtered.length !== 0;
  loadMoreGames.hidden = filtered.length <= visibleGames;
}

async function loadGames() {
  try {
    const response = await fetch("/api/games");
    if (!response.ok) throw new Error(`Game library request failed (${response.status})`);
    games = await response.json();
  } catch (err) {
    games = [];
    gameCount.textContent = "Unavailable";
    showToast(err instanceof Error ? err.message : "Could not load the game library.");
  }
  renderGames();
}

function showGameLibrary() {
  activeGameFrame?.remove();
  activeGameFrame = undefined;
  activeGame = undefined;
  gameStage.replaceChildren(gameHomeView);
  document.getElementById("games-window-title").textContent = "Games";
  document.getElementById("game-toolbar-hint").textContent = "Choose a game to play";
  document.getElementById("game-library-button").hidden = true;
  gameFrameButtons.forEach((button) => { button.hidden = true; });
  updateDock();
}

function openLibrary() {
  gamesWindow.classList.remove("minimized", "closed");
  browserWindow.classList.remove("minimized", "closed");
  activeWindow = "games";
  showGameLibrary();
  gameSearch.focus();
}

function exitActiveGame() {
  showGameLibrary();
  gameSearch.focus();
}

function hideGamesWindow() {
  showGameLibrary();
  gamesWindow.classList.add("closed");
  if (activeWindow === "games" && !browserWindow.classList.contains("closed") && !browserWindow.classList.contains("minimized")) activeWindow = "browser";
  updateDock();
}

function minimizeGamesWindow() {
  showGameLibrary();
  gamesWindow.classList.add("minimized");
  if (activeWindow === "games" && !browserWindow.classList.contains("closed") && !browserWindow.classList.contains("minimized")) activeWindow = "browser";
  updateDock();
}

function toggleGamesMaximize() {
  gamesWindow.classList.toggle("maximized");
}

function launchGame(game) {
  browserWindow.classList.remove("minimized", "closed");
  activeWindow = "games";
  updateDock();
  activeGame = game;
  activeGameFrame = document.createElement("iframe");
  activeGameFrame.id = "game-frame";
  activeGameFrame.title = getGameTitle(game);
  activeGameFrame.allow = "fullscreen; autoplay; clipboard-read; clipboard-write; gamepad";
  activeGameFrame.allowFullscreen = true;
  activeGameFrame.referrerPolicy = "no-referrer";
  activeGameFrame.loading = "eager";
  activeGameFrame.src = `/games/${encodeURIComponent(game.id)}/`;
  gameStage.replaceChildren(activeGameFrame);
  document.getElementById("games-window-title").textContent = getGameTitle(game);
  document.getElementById("game-toolbar-hint").textContent = "Select Library to browse other games";
  document.getElementById("game-library-button").hidden = false;
  gameFrameButtons.forEach((button) => { button.hidden = false; });
  gamesWindow.classList.remove("closed", "minimized");
  updateDock();
}

function resolveUrl(value) {
  const input = value.trim();
  if (!input) throw new Error("Enter a URL or search term.");
  if (input.startsWith("/") || input.startsWith("./")) return new URL(input, location.href).toString();
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) return input;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) return `https://${input}`;
  // Google frequently rate-limits shared proxy egress IPs with a 429/reCAPTCHA
  // page, so use a less aggressive search endpoint for bare search terms.
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(input)}`;
}

function updateDock() {
  const browserVisible = !browserWindow.classList.contains("minimized") && !browserWindow.classList.contains("closed");
  const gamesVisible = !gamesWindow.classList.contains("minimized") && !gamesWindow.classList.contains("closed");
  browserWindow.classList.toggle("active-window", browserVisible && activeWindow === "browser");
  gamesWindow.classList.toggle("active-window", gamesVisible && activeWindow === "games");
  dockBrowser.classList.toggle("active", browserVisible && activeWindow === "browser");
  dockLibrary.classList.toggle("active", gamesVisible && activeWindow === "games");
}

function openBrowser() {
  browserWindow.classList.remove("minimized", "closed");
  activeWindow = "browser";
  updateDock();
  address.focus();
}

function closeBrowser() {
  browserStage.replaceChildren(homeView);
  currentFrame = undefined;
  localFrame = undefined;
  document.querySelector(".window-title").textContent = "Browser";
  error.textContent = "";
}

function hideBrowser() {
  closeBrowser();
  browserWindow.classList.add("closed");
  if (activeWindow === "browser" && !gamesWindow.classList.contains("closed") && !gamesWindow.classList.contains("minimized")) activeWindow = "games";
  updateDock();
}

function minimizeBrowser() {
  browserWindow.classList.add("minimized");
  if (activeWindow === "browser" && !gamesWindow.classList.contains("closed") && !gamesWindow.classList.contains("minimized")) activeWindow = "games";
  updateDock();
}

function toggleMaximize() {
  browserWindow.classList.toggle("maximized");
}

async function loadScript(src) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
}

async function initialiseScramjet() {
  await registerSW();
  await navigator.serviceWorker.ready;

  const serviceworker = navigator.serviceWorker.controller;
  if (!serviceworker) throw new Error("The proxy service worker did not become active.");

  await loadScript("/scram/scramjet.js");
  await loadScript("/controller/controller.api.js");
  await loadScript("/utils/scramjet-utils.js");

  const { default: LibcurlClient } = await import("/libcurl/index.mjs");
  const wispUrl = new URL("/wisp/", location.href);
  wispUrl.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  scramjetController = new globalThis.$scramjetController.Controller({
    serviceworker,
    transport: new LibcurlClient({ wisp: wispUrl.toString() }),
    config: {
      scramjetPath: "/scram/scramjet.js",
      wasmPath: "/scram/scramjet.wasm",
      injectPath: "/controller/controller.inject.js",
    },
  });
  await scramjetController.wait();
  setInterval(() => navigator.serviceWorker.controller?.postMessage("keepalive"), 15000);
}

let scramjetReady;
function ensureScramjetReady() {
  if (!scramjetReady) {
    scramjetReady = initialiseScramjet().then(
      () => true,
      (err) => {
        error.textContent = err instanceof Error ? err.message : String(err);
        return false;
      },
    );
  }
  return scramjetReady;
}

async function navigate(value) {
  error.textContent = "";
  openBrowser();
  const targetUrl = resolveUrl(value);
  const parsedTarget = new URL(targetUrl);
  if (parsedTarget.origin === location.origin && parsedTarget.pathname.startsWith("/games/")) {
    const gameId = parsedTarget.pathname.split("/")[2];
    const game = games.find((entry) => entry.id === gameId);
    if (game) {
      openLibrary();
      launchGame(game);
      return;
    }
  }
  if (parsedTarget.origin === location.origin) {
    localFrame = document.createElement("iframe");
    localFrame.id = "sj-frame";
    localFrame.title = "Protobash local page";
    localFrame.allow = "fullscreen; autoplay; clipboard-read; clipboard-write; gamepad";
    localFrame.referrerPolicy = "no-referrer";
    localFrame.src = targetUrl;
    browserStage.replaceChildren(localFrame);
    currentFrame = undefined;
    const localPath = new URL(targetUrl).pathname;
    const localGameId = localPath.startsWith("/games/") ? localPath.split("/")[2] : undefined;
    const localGame = games.find((game) => game.id === localGameId);
    document.querySelector(".window-title").textContent = localGame ? getGameTitle(localGame) : localPath.split("/").filter(Boolean).at(-1) || "Protobash";
    return;
  }
  if (!(await ensureScramjetReady()) || !scramjetController) {
    throw new Error(error.textContent || "Scramjet could not start.");
  }

  currentFrame = scramjetController.createFrame();
  currentFrame.element.id = "sj-frame";
  currentFrame.element.title = "Protobash browser";
  currentFrame.element.allow = "fullscreen; autoplay; clipboard-read; clipboard-write";
  browserStage.replaceChildren(currentFrame.element);
  localFrame = undefined;
  document.querySelector(".window-title").textContent = "Browser";
  currentFrame.go(targetUrl);
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
  activeWindow = "browser";
  closeBrowser();
  updateDock();
});
document.getElementById("browser-home").addEventListener("click", () => {
  activeWindow = "browser";
  closeBrowser();
  updateDock();
});
document.getElementById("browser-close").addEventListener("click", hideBrowser);
document.getElementById("browser-minimize").addEventListener("click", minimizeBrowser);
document.getElementById("browser-maximize").addEventListener("click", toggleMaximize);
document.getElementById("games-close").addEventListener("click", hideGamesWindow);
document.getElementById("games-minimize").addEventListener("click", minimizeGamesWindow);
document.getElementById("games-maximize").addEventListener("click", toggleGamesMaximize);
document.getElementById("game-library-button").addEventListener("click", exitActiveGame);
document.getElementById("game-reload").addEventListener("click", () => {
  if (activeGame) launchGame(activeGame);
});
document.getElementById("game-fullscreen").addEventListener("click", async () => {
  if (!activeGameFrame) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await (activeGameFrame.requestFullscreen ? activeGameFrame.requestFullscreen() : activeGameFrame.contentDocument?.documentElement.requestFullscreen());
  } catch (err) {
    showToast(err instanceof Error ? err.message : "Fullscreen is unavailable in this browser.");
  }
});
document.querySelector(".games-titlebar").addEventListener("dblclick", toggleGamesMaximize);
document.getElementById("games-privacy").addEventListener("click", privacyMessage);
document.getElementById("show-desktop").addEventListener("click", () => {
  minimizeBrowser();
  minimizeGamesWindow();
});
document.querySelectorAll('[data-app="browser"]').forEach((button) => {
  button.addEventListener("click", openBrowser);
});
document.querySelectorAll('[data-app="library"]').forEach((button) => {
  button.addEventListener("click", openLibrary);
});
document.getElementById("browser-back").addEventListener("click", () => {
  if (localFrame) localFrame.contentWindow.history.back();
  else currentFrame?.back();
});
document.getElementById("browser-forward").addEventListener("click", () => {
  if (localFrame) localFrame.contentWindow.history.forward();
  else currentFrame?.forward();
});
document.getElementById("browser-reload").addEventListener("click", () => {
  if (localFrame) localFrame.contentWindow.location.reload();
  else currentFrame?.reload();
});
function privacyMessage() {
  showToast(location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "Local mode: the proxy egress is your own network. Remote hosting changes the server egress, but does not guarantee anonymity."
    : "Destination sites see the proxy server egress IP; browser WebRTC and fingerprinting can still reveal client-side data.");
}
document.getElementById("privacy-button").addEventListener("click", privacyMessage);
document.getElementById("footer-privacy").addEventListener("click", privacyMessage);
gameSearch.addEventListener("input", () => {
  visibleGames = gamesPerPage;
  renderGames();
});
document.getElementById("game-categories").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  visibleGames = gamesPerPage;
  document.querySelectorAll(".category-chip").forEach((chip) => {
    const selected = chip === button;
    chip.classList.toggle("active", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  renderGames();
});
loadMoreGames.addEventListener("click", () => {
  visibleGames += gamesPerPage;
  renderGames();
});

loadGames();

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat([], { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date());
}

updateClock();
setInterval(updateClock, 30000);

document.querySelector(".window-titlebar").addEventListener("dblclick", toggleMaximize);
