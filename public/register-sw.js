"use strict";

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  if (location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Service workers require HTTPS outside localhost.");
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
