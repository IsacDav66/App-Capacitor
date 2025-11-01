(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // web/js/modules/api.js
  var API_BASE_URL = "https://davcenter.servequake.com/app";
  async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || `Error del servidor: ${response.status}`);
      }
      return responseData;
    } catch (error) {
      console.error(`Error en API Fetch (${endpoint}):`, error);
      throw error;
    }
  }

  // web/js/modules/utils.js
  function getFullImageUrl(pathOrUrl) {
    if (!pathOrUrl) {
      return "./assets/img/default-avatar.png";
    }
    if (pathOrUrl.startsWith("http")) {
      return pathOrUrl;
    }
    return `${API_BASE_URL}${pathOrUrl}`;
  }

  // web/js/floating_content.js
  var socket;
  var currentPackageName = null;
  var appDataCache = /* @__PURE__ */ new Map();
  async function getAppData(packageName) {
    if (!packageName) return null;
    if (appDataCache.has(packageName)) return appDataCache.get(packageName);
    try {
      const data = await apiFetch(`/api/apps/${packageName}`);
      if (data.found) {
        const appData = {
          name: data.app.app_name,
          icon: data.app.icon_url
        };
        appDataCache.set(packageName, appData);
        return appData;
      } else {
        appDataCache.set(packageName, null);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener datos de la app desde nuestra API para ${packageName}:`, error);
      return null;
    }
  }
  function renderProfile(user) {
    const profileTab = document.getElementById("profile-tab");
    if (profileTab && user) {
      profileTab.innerHTML = `
            <img src="${getFullImageUrl(user.profile_pic_url)}" alt="Avatar de ${user.username}">
            <span>${user.username}</span>
        `;
    }
  }
  var renderFriends = async (friends, container) => {
    if (!friends || friends.length === 0) {
      container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">A\xFAn no tienes amigos.</p>';
      return;
    }
    const friendItemsHTML = await Promise.all(friends.map(async (friend) => {
      let statusText = "Desconectado";
      let statusClass = "offline";
      let statusIconHTML = "";
      if (friend.is_online) {
        if (friend.current_app && friend.current_app_package) {
          const appData = await getAppData(friend.current_app_package);
          if (appData) {
            statusText = `Jugando a ${appData.name}`;
            statusClass = "playing";
            statusIconHTML = `<img src="${appData.icon}" class="status-app-icon" alt="${appData.name}">`;
          } else {
            statusText = `En ${friend.current_app}`;
            statusClass = "playing";
          }
        } else {
          statusText = "En l\xEDnea";
          statusClass = "online";
        }
      }
      return `
            <div class="friend-item" data-user-id="${friend.id}">
                <div class="friend-avatar-container">
                    <img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}">
                    <div class="status-dot ${statusClass}">${statusIconHTML}</div>
                </div>
                <div class="friend-info">
                    <div class="friend-username">${friend.username}</div>
                    <div class="friend-status">${statusText}</div>
                </div>
            </div>`;
    }));
    container.innerHTML = friendItemsHTML.join("");
  };
  var updateFriendStatusInUI = async (data) => {
    const { userId, isOnline, currentApp, currentAppPackage, currentAppIcon } = data;
    const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
    if (!friendItem) return;
    const statusDot = friendItem.querySelector(".status-dot");
    const statusText = friendItem.querySelector(".friend-status");
    let newStatusText = "Desconectado";
    let newStatusClass = "offline";
    let newStatusIconHTML = "";
    if (isOnline) {
      if (currentApp && currentAppPackage) {
        const appName = currentApp;
        const appIcon = currentAppIcon ? getFullImageUrl(currentAppIcon) : (await getAppData(currentAppPackage))?.icon;
        newStatusText = `Jugando a ${appName}`;
        newStatusClass = "playing";
        if (appIcon) {
          newStatusIconHTML = `<img src="${appIcon}" class="status-app-icon" alt="${appName}">`;
        }
      } else {
        newStatusText = "En l\xEDnea";
        newStatusClass = "online";
      }
    }
    statusDot.className = `status-dot ${newStatusClass}`;
    statusDot.innerHTML = newStatusIconHTML;
    statusText.textContent = newStatusText;
  };
  async function updateGameStatus({ appName, packageName }) {
    const gameInfoSection = document.getElementById("game-info");
    const gameNameEl = document.getElementById("game-name");
    const gameIconEl = document.getElementById("game-icon");
    const registerSection = document.getElementById("registration-section");
    const titleEl = gameInfoSection.querySelector(".section-title");
    if (!gameNameEl || !gameIconEl || !registerSection || !titleEl) return;
    currentPackageName = packageName;
    const appData = await getAppData(packageName);
    if (appData && appData.name) {
      titleEl.textContent = "Jugando ahora:";
      gameNameEl.textContent = appData.name;
      gameIconEl.src = getFullImageUrl(appData.icon) || "";
      gameIconEl.style.display = "block";
      registerSection.style.display = "none";
      gameInfoSection.style.display = "block";
    } else if (packageName) {
      titleEl.textContent = "Juego no registrado:";
      gameNameEl.textContent = packageName;
      gameIconEl.style.display = "none";
      registerSection.style.display = "block";
      gameInfoSection.style.display = "block";
    } else {
      gameInfoSection.style.display = "none";
    }
  }
  function applyThemeUpdate(theme) {
    console.log("\u{1F3A8} FLOATING-UI: \xA1Recibida llamada a applyThemeUpdate! Aplicando colores:", theme);
    const root = document.documentElement;
    if (theme.bgColor) root.style.setProperty("--color-bg", theme.bgColor);
    if (theme.textColor) root.style.setProperty("--color-text", theme.textColor);
    if (theme.secondaryTextColor) root.style.setProperty("--text-secondary-color", theme.secondaryTextColor);
    if (theme.surfaceColor) root.style.setProperty("--color-surface", theme.surfaceColor);
    if (theme.accentColor) root.style.setProperty("--color-accent", theme.accentColor);
  }
  document.addEventListener("DOMContentLoaded", async () => {
    window.updateGameInfo = (gameData) => {
      console.log("Datos del juego recibidos desde Java:", gameData);
      updateGameStatus(gameData);
    };
    window.applyThemeUpdate = applyThemeUpdate;
    const closeBtn = document.getElementById("close-button");
    if (closeBtn && window.Android) {
      closeBtn.addEventListener("click", () => Android.closeWindow());
    }
    if (window.Android) {
      Android.jsReady();
    }
    const registerBtn = document.getElementById("register-btn");
    const appNameInput = document.createElement("input");
    appNameInput.type = "text";
    appNameInput.placeholder = "Dale un nombre (ej. Minecraft)";
    appNameInput.className = "register-input";
    try {
      const token = window.Android ? await Android.getAuthToken() : localStorage.getItem("authToken_test");
      if (!token) throw new Error("Error de Autenticaci\xF3n");
      localStorage.setItem("authToken", token);
      const userResponse = await apiFetch("/api/user/me");
      if (userResponse.success) {
        renderProfile(userResponse.data);
      } else {
        throw new Error("No se pudieron obtener los datos del usuario.");
      }
      const friendsContainer = document.getElementById("friends-container");
      friendsContainer.innerHTML = '<p class="friend-status" style="text-align: center;">Cargando amigos...</p>';
      const friendsResponse = await apiFetch("/api/user/friends");
      if (friendsResponse.success) {
        await renderFriends(friendsResponse.friends, friendsContainer);
      }
      const { default: io } = await import("https://cdn.socket.io/4.7.5/socket.io.esm.min.js");
      socket = io(API_BASE_URL.replace("/app", ""), { path: "/app/socket.io/" });
      socket.on("connect", () => {
        socket.emit("authenticate", token);
      });
      socket.on("friend_status_update", (data) => {
        console.log('FLOATING: Evento "friend_status_update" RECIBIDO:', data);
        updateFriendStatusInUI(data);
      });
      registerBtn.addEventListener("click", () => {
        const registerSection = document.getElementById("registration-section");
        registerSection.innerHTML = "";
        registerSection.appendChild(appNameInput);
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Guardar";
        saveBtn.className = "register-btn";
        saveBtn.onclick = () => {
          const newAppName = appNameInput.value.trim();
          if (newAppName && currentPackageName) {
            saveBtn.disabled = true;
            saveBtn.textContent = "Guardando...";
            const appData = { packageName: currentPackageName, appName: newAppName };
            apiFetch("/api/apps/add", {
              method: "POST",
              body: JSON.stringify(appData)
            }).then((response) => {
              if (response.success) {
                if (window.Android) {
                  Android.reopenWindow();
                }
              }
            }).catch((error) => {
              alert(`Error: ${error.message}`);
              saveBtn.disabled = false;
              saveBtn.textContent = "Guardar";
            });
          }
        };
        registerSection.appendChild(saveBtn);
        appNameInput.focus();
      });
    } catch (error) {
      document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
  });
})();
