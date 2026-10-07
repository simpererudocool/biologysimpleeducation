"use strict";

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  if (location.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(location.hostname)) {
    throw new Error("Service workers require HTTPS outside localhost.");
  }

  const workerUrl = new URL("/sw.js?v=2", location.href);
  const registration = await navigator.serviceWorker.register(workerUrl, { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;

  const activeController = () => {
    const controller = navigator.serviceWorker.controller;
    return controller && new URL(controller.scriptURL).href === workerUrl.href ? controller : undefined;
  };

  if (!activeController()) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        reject(new Error("The updated proxy service worker did not take control. Reload the page and try again."));
      }, 15000);
      const onControllerChange = () => {
        const controller = activeController();
        if (!controller) return;
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        resolve(controller);
      };
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      onControllerChange();
    });
  }

  return registration;
}
