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
    const finalOptions = {
      ...options,
      headers,
      cache: "no-store"
      // Siempre pedir datos frescos
    };
    const finalUrl = `${API_BASE_URL}${endpoint}`;
    try {
      console.log(`[API Fetch LOG] Enviando petici\xF3n a: ${finalUrl}`);
      const response = await fetch(finalUrl, finalOptions);
      const responseText = await response.text();
      if (!response.ok) {
        console.error(`[API Fetch ERROR] Respuesta no-OK (${response.status}) para ${endpoint}. Texto:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(errorJson.message || `Error del servidor: ${response.status}`);
        } catch (e) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }
      try {
        if (responseText === "") {
          return { success: true };
        }
        return JSON.parse(responseText);
      } catch (e) {
        console.error(`[API Fetch ERROR] La respuesta para ${endpoint} no era un JSON v\xE1lido, aunque el estado era OK. Texto:`, responseText);
        throw new Error("La respuesta del servidor no ten\xEDa el formato esperado.");
      }
    } catch (error) {
      console.error(`[API Fetch NETWORK ERROR] Error de red para ${endpoint}:`, error);
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
  function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const secondsAgo = Math.round((now - date) / 1e3);
    const minutesAgo = Math.round(secondsAgo / 60);
    const hoursAgo = Math.round(minutesAgo / 60);
    if (secondsAgo < 60) return `Hace ${secondsAgo}s`;
    if (minutesAgo < 60) return `Hace ${minutesAgo}m`;
    if (hoursAgo < 24) return `Hace ${hoursAgo}h`;
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  }
  function formatMessageTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString(navigator.language, {
      hour: "numeric",
      minute: "2-digit"
    });
  }
  function formatDateSeparator(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((nowStart - dateStart) / (1e3 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays > 1 && diffDays < 7) {
      return new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
    }
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(date);
  }

  // web/js/modules/controllers/chatController.js
  async function initChatController(domElements, partnerId, currentUserId) {
    const elements = domElements;
    const otherUserId = partnerId;
    const loggedInUserId2 = currentUserId;
    let activeClone = null;
    let originalParent = null;
    let nextSibling = null;
    if (!otherUserId || !loggedInUserId2 || !elements.messagesContainer) {
      console.error("Faltan datos o elementos del DOM para inicializar el chat.");
      return null;
    }
    const chatState = {
      currentReplyToId: null,
      contextMenuTarget: null,
      socket: null,
      roomName: null
    };
    const appendMessage = (message) => {
      const isOwnMessage = message.sender_id === loggedInUserId2;
      const lastMessageEl = elements.messagesContainer.querySelector(".message-bubble:last-child");
      const messageDiv = document.createElement("div");
      messageDiv.id = `msg-${message.message_id}`;
      messageDiv.className = `message-bubble ${isOwnMessage ? "sent" : "received"}`;
      messageDiv.dataset.senderId = message.sender_id;
      messageDiv.dataset.timestamp = message.created_at;
      const content = message.content;
      const isImageSticker = content.startsWith("http") && (content.endsWith(".gif") || content.endsWith(".png") || content.endsWith(".webp"));
      const isVideoSticker = content.startsWith("http") && content.endsWith(".mp4");
      if (String(message.message_id).startsWith("temp-")) {
        messageDiv.classList.add("pending");
      }
      if (message.parent_message_id) {
        let parentUsername = message.parent_username;
        let parentContent = message.parent_content;
        if (isOwnMessage && !parentContent) {
          const parentMessageEl = elements.messagesContainer.querySelector(`#msg-${message.parent_message_id}`);
          if (parentMessageEl) {
            const parentP = parentMessageEl.querySelector("p");
            const parentImg = parentMessageEl.querySelector("img.sticker-render");
            parentContent = parentP ? parentP.textContent : parentImg ? "Sticker" : "Mensaje";
            parentUsername = parentMessageEl.classList.contains("sent") ? "T\xFA" : elements.userUsername.textContent;
          }
        }
        if (parentContent) {
          const repliedSnippetLink = document.createElement("a");
          repliedSnippetLink.className = "replied-to-snippet";
          repliedSnippetLink.href = "#";
          repliedSnippetLink.onclick = (e) => {
            e.preventDefault();
            scrollToMessage(`msg-${message.parent_message_id}`);
          };
          repliedSnippetLink.innerHTML = `<span class="replied-user">${parentUsername || "Usuario"}</span><span class="replied-text">${parentContent}</span>`;
          messageDiv.appendChild(repliedSnippetLink);
        }
      }
      const mainContentWrapper = document.createElement("div");
      mainContentWrapper.className = "message-main-content";
      if (isImageSticker) {
        messageDiv.style.backgroundColor = "transparent";
        messageDiv.style.boxShadow = "none";
        const stickerImg = document.createElement("img");
        stickerImg.src = content;
        stickerImg.className = "sticker-render";
        stickerImg.style.maxWidth = "150px";
        stickerImg.style.borderRadius = "8px";
        stickerImg.onload = () => {
          elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        };
        mainContentWrapper.appendChild(stickerImg);
      } else if (isVideoSticker) {
        messageDiv.style.backgroundColor = "transparent";
        messageDiv.style.boxShadow = "none";
        const videoEl = document.createElement("video");
        videoEl.src = content;
        videoEl.className = "sticker-render video-sticker";
        videoEl.style.maxWidth = "200px";
        videoEl.style.borderRadius = "16px";
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.addEventListener("click", () => {
          document.querySelectorAll("video.video-sticker").forEach((otherVideo) => {
            if (otherVideo !== videoEl) {
              otherVideo.muted = true;
            }
          });
          videoEl.muted = !videoEl.muted;
        });
        mainContentWrapper.appendChild(videoEl);
      } else {
        const contentP = document.createElement("p");
        contentP.textContent = content;
        mainContentWrapper.appendChild(contentP);
      }
      const timestampSpan = document.createElement("span");
      timestampSpan.className = "message-timestamp";
      timestampSpan.innerHTML = messageDiv.classList.contains("pending") ? "\u{1F552}" : formatMessageTime(message.created_at);
      mainContentWrapper.appendChild(timestampSpan);
      messageDiv.appendChild(mainContentWrapper);
      elements.messagesContainer.appendChild(messageDiv);
      if (lastMessageEl) {
        lastMessageEl.className = lastMessageEl.className.replace(/single|start-group|middle-group|end-group/g, "").trim() + " " + getGroupClassFor(lastMessageEl);
      }
      messageDiv.classList.add(getGroupClassFor(messageDiv));
      if (!messageDiv.classList.contains("pending")) {
        addInteractionHandlers(messageDiv);
      }
      elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    };
    const fetchChatHistory = async () => {
      try {
        const { data: user } = await apiFetch(`/api/user/profile/${otherUserId}`);
        elements.userAvatar.src = getFullImageUrl(user.profile_pic_url);
        elements.userUsername.textContent = user.username;
        const { messages } = await apiFetch(`/api/chat/history/${otherUserId}`);
        elements.messagesContainer.innerHTML = "";
        let lastDate = null;
        messages.forEach((message) => {
          const messageDate = new Date(message.created_at).toDateString();
          if (messageDate !== lastDate) {
            const separator = document.createElement("div");
            separator.className = "date-separator";
            separator.innerHTML = `<span>${formatDateSeparator(message.created_at)}</span>`;
            elements.messagesContainer.appendChild(separator);
            lastDate = messageDate;
          }
          appendMessage(message);
        });
        setTimeout(() => {
          elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }, 100);
      } catch (error) {
        elements.messagesContainer.innerHTML = `<p class="search-placeholder">Error loading history: ${error.message}</p>`;
      }
    };
    const removeMessageFromDOM = (messageId) => {
      const messageElement = elements.messagesContainer.querySelector(`#msg-${messageId}`);
      if (!messageElement) return;
      let prevMessageEl = messageElement.previousElementSibling;
      while (prevMessageEl && !prevMessageEl.classList.contains("message-bubble")) prevMessageEl = prevMessageEl.previousElementSibling;
      let nextMessageEl = messageElement.nextElementSibling;
      while (nextMessageEl && !nextMessageEl.classList.contains("message-bubble")) nextMessageEl = nextMessageEl.nextElementSibling;
      messageElement.style.transition = "opacity 0.3s ease, transform 0.3s ease, margin 0.3s ease, height 0.3s ease, padding 0.3s ease";
      messageElement.style.opacity = "0";
      messageElement.style.transform = "scale(0.8)";
      messageElement.style.marginTop = `-${messageElement.offsetHeight}px`;
      messageElement.style.padding = "0";
      messageElement.style.height = "0";
      setTimeout(() => {
        messageElement.remove();
        if (prevMessageEl) prevMessageEl.className = prevMessageEl.className.replace(/single|start-group|middle-group|end-group/g, "").trim() + " " + getGroupClassFor(prevMessageEl);
        if (nextMessageEl) nextMessageEl.className = nextMessageEl.className.replace(/single|start-group|middle-group|end-group/g, "").trim() + " " + getGroupClassFor(nextMessageEl);
      }, 300);
    };
    const enterReplyMode = (messageId, username, content) => {
      chatState.currentReplyToId = messageId;
      elements.replyToUser.textContent = username;
      elements.replySnippet.textContent = content;
      elements.replyContextBar.classList.add("visible");
      elements.chatInput.focus();
    };
    const cancelReplyMode = () => {
      chatState.currentReplyToId = null;
      elements.replyContextBar.classList.remove("visible");
    };
    const scrollToMessage = (messageId) => {
      const targetMessage = elements.messagesContainer.querySelector(`#${messageId}`);
      if (targetMessage) {
        targetMessage.scrollIntoView({ behavior: "smooth", block: "center" });
        targetMessage.classList.add("highlighted");
        setTimeout(() => targetMessage.classList.remove("highlighted"), 1500);
      }
    };
    async function deleteMessage(messageId) {
      const modal = elements.deleteConfirmModal;
      const cancelBtn = elements.cancelDeleteBtn;
      const confirmBtn = elements.confirmDeleteBtn;
      if (!modal || !cancelBtn || !confirmBtn) {
        console.error("Elementos del modal de eliminaci\xF3n no encontrados en el DOM. Usando confirm() como fallback.");
        if (confirm("\xBFSeguro que quieres eliminar este mensaje?")) {
          try {
            await apiFetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
          } catch (error) {
            alert(`Error al eliminar: ${error.message}`);
          }
        }
        return;
      }
      modal.style.display = "flex";
      const waitForUserInput = new Promise((resolve) => {
        cancelBtn.onclick = () => resolve(false);
        confirmBtn.onclick = () => resolve(true);
      });
      const shouldDelete = await waitForUserInput;
      modal.style.display = "none";
      if (shouldDelete) {
        try {
          await apiFetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
          console.log(`Solicitud de eliminaci\xF3n enviada para el mensaje ID: ${messageId}`);
        } catch (error) {
          alert(`Error al eliminar el mensaje: ${error.message}`);
        }
      }
    }
    function openContextMenu(messageElement) {
      if (!messageElement) return;
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
      messageElement.style.setProperty("--message-color", accentColor);
      activeClone = messageElement.cloneNode(true);
      const rect = messageElement.getBoundingClientRect();
      originalParent = messageElement.parentElement;
      nextSibling = messageElement.nextElementSibling;
      const isFloatingWindow = window.self !== window.top;
      if (isFloatingWindow) {
        activeClone.style.position = "fixed";
        activeClone.style.top = `${rect.top}px`;
      } else {
        activeClone.style.position = "fixed";
        activeClone.style.top = `${rect.top}px`;
        activeClone.style.left = `${rect.left}px`;
      }
      activeClone.style.zIndex = "100";
      activeClone.classList.add("context-active");
      messageElement.classList.add("context-hidden");
      document.body.appendChild(activeClone);
      const overlay = elements.contextMenuOverlay;
      const menu = elements.contextMenu;
      const replyBtn = elements.replyFromMenuBtn;
      const copyBtn = elements.copyBtn;
      const deleteBtn = elements.deleteBtn;
      if (!overlay || !menu) return;
      chatState.contextMenuTarget = messageElement;
      deleteBtn.style.display = messageElement.classList.contains("sent") ? "flex" : "none";
      overlay.classList.add("visible");
      const menuRect = menu.getBoundingClientRect();
      let menuTop = rect.bottom + 10;
      if (menuTop + menuRect.height > window.innerHeight) {
        menuTop = rect.top - menuRect.height - 10;
      }
      let menuLeft = rect.left + rect.width / 2 - menuRect.width / 2;
      if (menuLeft < 10) menuLeft = 10;
      if (menuLeft + menuRect.width > window.innerWidth - 10) {
        menuLeft = window.innerWidth - menuRect.width - 10;
      }
      menu.style.top = `${menuTop}px`;
      menu.style.left = `${menuLeft}px`;
      setTimeout(() => menu.classList.add("visible"), 0);
      replyBtn.onclick = () => {
        const username = messageElement.classList.contains("sent") ? "T\xFA" : elements.userUsername.textContent;
        const content = messageElement.querySelector("p").textContent;
        enterReplyMode(messageElement.id.replace("msg-", ""), username, content);
        closeContextMenu();
      };
      copyBtn.onclick = () => {
        copyMessageText(messageElement);
        closeContextMenu();
      };
      deleteBtn.onclick = () => {
        deleteMessage(messageElement.id.replace("msg-", ""));
        closeContextMenu();
      };
      overlay.onclick = closeContextMenu;
    }
    function closeContextMenu() {
      const overlay = elements.contextMenuOverlay;
      const menu = elements.contextMenu;
      if (!overlay || !menu) return;
      if (activeClone) {
        activeClone.remove();
        activeClone = null;
      }
      if (chatState.contextMenuTarget) {
        chatState.contextMenuTarget.classList.remove("context-hidden");
      }
      overlay.classList.remove("visible");
      menu.classList.remove("visible");
      chatState.contextMenuTarget = null;
      originalParent = null;
      nextSibling = null;
    }
    const addInteractionHandlers = (messageElement) => {
      let startX = 0, deltaX = 0, longPressTimer;
      const swipeThreshold = 80;
      messageElement.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        deltaX = 0;
        messageElement.style.transition = "transform 0.1s ease-out";
        longPressTimer = setTimeout(() => {
          e.preventDefault();
          openContextMenu(messageElement);
        }, 500);
      }, { passive: false });
      messageElement.addEventListener("touchmove", (e) => {
        clearTimeout(longPressTimer);
        deltaX = e.touches[0].clientX - startX;
        if (deltaX > 0) {
          const pullDistance = Math.min(deltaX, swipeThreshold + 40);
          messageElement.style.transform = `translateX(${pullDistance}px)`;
        }
      }, { passive: true });
      messageElement.addEventListener("touchend", () => {
        clearTimeout(longPressTimer);
        messageElement.style.transition = "transform 0.3s ease-out";
        if (deltaX > swipeThreshold) {
          const username = messageElement.classList.contains("sent") ? "T\xFA" : elements.userUsername.textContent;
          const content = messageElement.querySelector("p").textContent;
          enterReplyMode(messageElement.id.replace("msg-", ""), username, content);
          messageElement.style.transform = `translateX(60px)`;
          setTimeout(() => {
            messageElement.style.transform = "translateX(0)";
          }, 150);
        } else {
          messageElement.style.transform = "translateX(0)";
        }
      });
    };
    const getGroupClassFor = (messageEl) => {
      const timeThreshold = 60;
      const senderId = messageEl.dataset.senderId;
      const timestamp = new Date(messageEl.dataset.timestamp);
      let prevMessageEl = messageEl.previousElementSibling;
      while (prevMessageEl && !prevMessageEl.classList.contains("message-bubble")) prevMessageEl = prevMessageEl.previousElementSibling;
      let nextMessageEl = messageEl.nextElementSibling;
      while (nextMessageEl && !nextMessageEl.classList.contains("message-bubble")) nextMessageEl = nextMessageEl.nextElementSibling;
      const isStartOfGroup = !prevMessageEl || prevMessageEl.dataset.senderId !== senderId || (timestamp - new Date(prevMessageEl.dataset.timestamp)) / 1e3 > timeThreshold;
      const isEndOfGroup = !nextMessageEl || nextMessageEl.dataset.senderId !== senderId || (new Date(nextMessageEl.dataset.timestamp) - timestamp) / 1e3 > timeThreshold;
      if (isStartOfGroup && isEndOfGroup) return "single";
      if (isStartOfGroup) return "start-group";
      if (isEndOfGroup) return "end-group";
      return "middle-group";
    };
    const sendMessage = (messageData) => {
      if (!chatState.socket || !chatState.socket.connected) {
        console.error("No se puede enviar el mensaje, el socket no est\xE1 conectado.");
        return;
      }
      const fullMessageData = {
        ...messageData,
        receiver_id: parseInt(otherUserId),
        roomName: chatState.roomName,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        parent_message_id: chatState.currentReplyToId
      };
      chatState.socket.emit("send_message", fullMessageData);
      appendMessage(fullMessageData);
      if (elements.chatInput) elements.chatInput.value = "";
      cancelReplyMode();
    };
    try {
      const { default: io } = await import("https://cdn.socket.io/4.7.5/socket.io.esm.min.js");
      chatState.socket = io(API_BASE_URL.replace("/app", ""), { path: "/app/socket.io/" });
      chatState.roomName = [loggedInUserId2, parseInt(otherUserId)].sort().join("-");
      chatState.socket.on("connect", () => {
        console.log("Socket conectado:", chatState.socket.id);
        const token = localStorage.getItem("authToken");
        chatState.socket.emit("authenticate", token);
        chatState.socket.emit("join_room", chatState.roomName);
      });
      chatState.socket.on("receive_message", (message) => {
        if (message.sender_id === loggedInUserId2) return;
        appendMessage(message);
      });
      chatState.socket.on("message_confirmed", ({ tempId, realMessage }) => {
        const tempEl = document.getElementById(`msg-${tempId}`);
        if (tempEl) {
          tempEl.id = `msg-${realMessage.message_id}`;
          tempEl.classList.remove("pending");
          tempEl.querySelector(".message-timestamp").textContent = formatMessageTime(realMessage.created_at);
          addInteractionHandlers(tempEl);
        }
      });
      chatState.socket.on("message_deleted", ({ messageId }) => removeMessageFromDOM(messageId));
      if (elements.chatForm) {
        elements.chatForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const content = elements.chatInput.value.trim();
          if (content) {
            sendMessage({
              message_id: `temp-${Date.now()}`,
              sender_id: loggedInUserId2,
              content
            });
          }
        });
      }
      if (elements.cancelReplyBtn) {
        elements.cancelReplyBtn.addEventListener("click", cancelReplyMode);
      }
      if (elements.messagesContainer && elements.stickyHeader) {
        let hideHeaderTimeout;
        elements.messagesContainer.addEventListener("scroll", () => {
          const dateSeparators = Array.from(elements.messagesContainer.querySelectorAll(".date-separator"));
          if (dateSeparators.length === 0) return;
          let activeSeparatorText = null;
          const containerTop = elements.messagesContainer.getBoundingClientRect().top;
          for (let i = dateSeparators.length - 1; i >= 0; i--) {
            const separator = dateSeparators[i];
            if (separator.getBoundingClientRect().top < containerTop) {
              activeSeparatorText = separator.querySelector("span").textContent;
              break;
            }
          }
          if (activeSeparatorText) {
            elements.stickyHeaderText.textContent = activeSeparatorText;
            elements.stickyHeader.classList.add("visible");
          } else {
            elements.stickyHeader.classList.remove("visible");
          }
          clearTimeout(hideHeaderTimeout);
          hideHeaderTimeout = setTimeout(() => {
            elements.stickyHeader.classList.remove("visible");
          }, 1500);
        });
      }
      await fetchChatHistory();
      return {
        sendMessage
      };
    } catch (error) {
      console.error("No se pudo cargar la librer\xEDa Socket.IO o inicializar el chat.", error);
      if (elements.messagesContainer) {
        elements.messagesContainer.innerHTML = `<p class="search-placeholder">Error en la conexi\xF3n del chat.</p>`;
      }
      return null;
    }
  }

  // web/js/floating_content.js
  var loggedInUserId = null;
  var currentPackageName = null;
  var appDataCache = /* @__PURE__ */ new Map();
  async function getAppData(packageName) {
    if (!packageName) return null;
    if (appDataCache.has(packageName)) return appDataCache.get(packageName);
    try {
      const data = await apiFetch(`/api/apps/${packageName}`);
      console.log("Respuesta de la API para " + packageName + ":", data);
      if (data.found) {
        const appData = { name: data.app.app_name, icon: data.app.icon_url, is_game: data.app.is_game };
        appDataCache.set(packageName, appData);
        return appData;
      } else {
        appDataCache.set(packageName, null);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener datos de la app para ${packageName}:`, error);
      return null;
    }
  }
  function renderProfile(user) {
    const avatarEl = document.getElementById("user-avatar");
    const usernameEl = document.getElementById("user-username");
    if (avatarEl && usernameEl && user) {
      avatarEl.src = getFullImageUrl(user.profile_pic_url);
      usernameEl.textContent = user.username;
    }
  }
  document.addEventListener("DOMContentLoaded", async () => {
    const closeBtn = document.getElementById("close-button");
    const mainViewHeader = document.querySelector("body > header");
    const mainViewContent = document.querySelector("body > main");
    const chatView = document.getElementById("chat-view");
    const backToMainViewBtn = document.getElementById("back-to-main-view-btn");
    const tabs = document.querySelectorAll(".nav-tab");
    const pages = document.querySelectorAll(".page-content");
    const chatListContainer = document.getElementById("chat-list-container");
    const registerSection = document.getElementById("registration-section");
    const registerInitialView = document.getElementById("register-initial-view");
    const registerFormView = document.getElementById("register-form-view");
    const registerBtn = document.getElementById("register-btn");
    const appNameInput = document.getElementById("register-app-name-input");
    const saveAppBtn = document.getElementById("save-app-btn");
    let socket;
    let isInteractingWithForm = false;
    function resetRegistrationForm() {
      if (!registerInitialView || !registerFormView || !appNameInput || !saveAppBtn) return;
      registerFormView.style.display = "none";
      registerInitialView.style.display = "block";
      appNameInput.value = "";
      saveAppBtn.disabled = false;
      saveAppBtn.textContent = "Guardar";
      isInteractingWithForm = false;
    }
    async function updateGameStatus({ appName, packageName }) {
      console.log(`[JS LOG] updateGameStatus llamado con: ${packageName}`);
      if (socket && socket.connected && packageName) {
        console.log(`[JS LOG] Emitiendo 'update_current_app' al backend con paquete: ${packageName}`);
        socket.emit("update_current_app", { package: packageName, name: appName });
      }
      if (isInteractingWithForm) {
        console.log("[JS LOG] UI Bloqueada: Interacci\xF3n en progreso. Se ignora la actualizaci\xF3n de UI.");
        return;
      }
      const gameInfoSection = document.getElementById("game-info");
      if (!gameInfoSection) return;
      const gameNameEl = document.getElementById("game-name");
      const gameIconEl = document.getElementById("game-icon");
      const classificationSection = document.getElementById("classification-section");
      const titleEl = gameInfoSection.querySelector(".section-title");
      if (!gameNameEl || !gameIconEl || !registerSection || !classificationSection || !titleEl) return;
      registerSection.style.display = "none";
      classificationSection.style.display = "none";
      currentPackageName = packageName;
      const appData = await getAppData(packageName);
      console.log("Datos de la App recibidos en updateGameStatus:", appData);
      if (appData) {
        titleEl.textContent = "Jugando ahora:";
        gameNameEl.textContent = appData.name;
        gameIconEl.src = getFullImageUrl(appData.icon) || "";
        gameIconEl.style.display = "block";
        gameInfoSection.style.display = "block";
        if (appData.is_game === null) {
          classificationSection.style.display = "block";
        }
      } else if (packageName) {
        titleEl.textContent = "Juego no registrado:";
        gameNameEl.textContent = packageName;
        gameIconEl.style.display = "none";
        resetRegistrationForm();
        registerSection.style.display = "block";
        gameInfoSection.style.display = "block";
      } else {
        gameInfoSection.style.display = "none";
      }
    }
    function applyThemeUpdate(theme) {
      console.log("FLOATING: Aplicando actualizaci\xF3n de tema completa:", theme);
      const root = document.documentElement;
      if (theme.bgColor) root.style.setProperty("--color-bg", theme.bgColor);
      if (theme.textColor) root.style.setProperty("--color-text", theme.textColor);
      if (theme.secondaryTextColor) root.style.setProperty("--text-secondary-color", theme.secondaryTextColor);
      if (theme.surfaceColor) root.style.setProperty("--color-surface", theme.surfaceColor);
      if (theme.accentColor) root.style.setProperty("--color-accent", theme.accentColor);
      if (theme.uiColor) root.style.setProperty("--color-ui", theme.uiColor);
      if (theme.borderColor) root.style.setProperty("--color-border", theme.borderColor);
    }
    const updateFriendStatusInUI = async (data) => {
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
    const renderChatList = (conversations, container) => {
      if (!conversations || conversations.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">No tienes chats recientes.</p>';
        return;
      }
      container.innerHTML = conversations.map((convo) => {
        const snippet = convo.last_message_content.length > 25 ? convo.last_message_content.substring(0, 25) + "..." : convo.last_message_content;
        return `<div class="chat-list-item" data-user-id="${convo.user_id}"><img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar"><div class="chat-list-content"><div class="chat-list-header"><span class="chat-list-username">${convo.username}</span><span class="chat-list-time">${formatTimeAgo(convo.last_message_at)}</span></div><p class="chat-list-snippet">${snippet}</p></div></div>`;
      }).join("");
    };
    const renderFriends = async (friends, container) => {
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
        return `<div class="friend-item" data-user-id="${friend.id}"><div class="friend-avatar-container"><img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}"><div class="status-dot ${statusClass}">${statusIconHTML}</div></div><div class="friend-info"><div class="friend-username">${friend.username}</div><div class="friend-status">${statusText}</div></div></div>`;
      }));
      container.innerHTML = friendItemsHTML.join("");
    };
    const NativeBridge = {
      closeWindow: () => {
        NativeBridge.releaseWindowFocus();
        if (window.Android) Android.closeWindow();
        else window.parent.postMessage("closeWindow", "*");
      },
      reopenWindow: () => {
        if (window.Android) Android.reopenWindow();
        else location.reload();
      },
      requestWindowFocus: () => {
        if (window.Android) Android.requestWindowFocus();
        else console.log("DEBUG: Solicitando foco (simulado).");
      },
      releaseWindowFocus: () => {
        if (window.Android) Android.releaseWindowFocus();
        else console.log("DEBUG: Liberando foco (simulado).");
      },
      jsReady: () => {
        if (window.Android) Android.jsReady();
        else window.parent.postMessage("jsReady", "*");
      },
      getAuthToken: async () => {
        if (window.Android) return await Android.getAuthToken();
        else return localStorage.getItem("authToken");
      }
    };
    window.updateGameInfo = updateGameStatus;
    window.applyThemeUpdate = applyThemeUpdate;
    if (closeBtn) closeBtn.addEventListener("click", () => NativeBridge.closeWindow());
    NativeBridge.jsReady();
    async function openChatView(userId, username, avatarUrl) {
      mainViewHeader.style.display = "none";
      mainViewContent.style.display = "none";
      chatView.style.display = "flex";
      NativeBridge.requestWindowFocus();
      const domElements = {
        messagesContainer: document.getElementById("chat-messages-container"),
        userAvatar: document.getElementById("chat-partner-avatar"),
        userUsername: document.getElementById("chat-partner-username"),
        chatForm: document.getElementById("chat-form"),
        chatInput: document.getElementById("chat-message-input"),
        replyContextBar: document.getElementById("reply-context-bar"),
        replyToUser: document.getElementById("reply-to-user"),
        replySnippet: document.getElementById("reply-snippet"),
        cancelReplyBtn: document.getElementById("cancel-reply-btn"),
        contextMenuOverlay: document.getElementById("context-menu-overlay"),
        contextMenu: document.getElementById("context-menu"),
        replyFromMenuBtn: document.getElementById("reply-from-menu-btn"),
        copyBtn: document.getElementById("copy-btn"),
        deleteBtn: document.getElementById("delete-from-menu-btn"),
        stickyHeader: document.getElementById("sticky-date-header"),
        stickyHeaderText: document.getElementById("sticky-date-header")?.querySelector("span"),
        deleteConfirmModal: document.getElementById("delete-confirm-modal"),
        cancelDeleteBtn: document.getElementById("cancel-delete-btn"),
        confirmDeleteBtn: document.getElementById("confirm-delete-btn")
      };
      domElements.userAvatar.src = avatarUrl;
      domElements.userUsername.textContent = username;
      await initChatController(domElements, userId, loggedInUserId);
    }
    function closeChatView() {
      mainViewHeader.style.display = "flex";
      mainViewContent.style.display = "block";
      chatView.style.display = "none";
      NativeBridge.releaseWindowFocus();
    }
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      const { type, data } = event.data;
      if (type === "updateGameInfo" && window.updateGameInfo) {
        window.updateGameInfo(data);
      } else if (type === "applyThemeUpdate" && window.applyThemeUpdate) {
        window.applyThemeUpdate(data);
      }
    });
    try {
      const token = await NativeBridge.getAuthToken();
      if (!token) throw new Error("Error de Autenticaci\xF3n");
      localStorage.setItem("authToken", token);
      const userResponse = await apiFetch("/api/user/me");
      if (!userResponse.success) throw new Error("No se pudieron obtener los datos del usuario.");
      loggedInUserId = userResponse.data.userId;
      renderProfile(userResponse.data);
      const friendsContainer = document.getElementById("friends-container");
      const friendsResponse = await apiFetch("/api/user/friends");
      if (friendsResponse.success) await renderFriends(friendsResponse.friends, friendsContainer);
      const { default: io } = await import("https://cdn.socket.io/4.7.5/socket.io.esm.min.js");
      socket = io(API_BASE_URL.replace("/app", ""), { path: "/app/socket.io/" });
      socket.on("connect", () => {
        console.log("[JS LOG] Socket conectado. Autenticando...");
        socket.emit("authenticate", token);
        console.log("[JS LOG] Notificando a la capa nativa que el JS y el Socket est\xE1n listos.");
        NativeBridge.jsReady();
      });
      socket.on("friend_status_update", (data) => updateFriendStatusInUI(data));
      tabs.forEach((tab) => {
        tab.addEventListener("click", async () => {
          const tabName = tab.dataset.tab;
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          pages.forEach((p) => p.style.display = "none");
          const activePage = document.getElementById(`${tabName}-content`);
          if (activePage) activePage.style.display = "block";
          if (tabName === "chats" && !activePage.dataset.loaded) {
            chatListContainer.innerHTML = '<p class="friend-status" style="text-align: center;">Cargando chats...</p>';
            try {
              const chatResponse = await apiFetch("/api/chat/conversations");
              if (chatResponse.success) {
                renderChatList(chatResponse.conversations, chatListContainer);
                activePage.dataset.loaded = "true";
              }
            } catch (error) {
              chatListContainer.innerHTML = `<p class="friend-status" style="color: red;">${error.message}</p>`;
            }
          }
          resetRegistrationForm();
        });
      });
      chatListContainer.addEventListener("click", (e) => {
        const chatItem = e.target.closest(".chat-list-item");
        if (chatItem) {
          const userId = chatItem.dataset.userId;
          const username = chatItem.querySelector(".chat-list-username").textContent;
          const avatarUrl = chatItem.querySelector(".chat-list-avatar").src;
          openChatView(userId, username, avatarUrl);
        }
      });
      backToMainViewBtn.addEventListener("click", closeChatView);
      if (registerBtn) {
        registerBtn.addEventListener("click", () => {
          isInteractingWithForm = true;
          NativeBridge.requestWindowFocus();
          if (registerInitialView) registerInitialView.style.display = "none";
          if (registerFormView) registerFormView.style.display = "block";
          if (appNameInput) {
            setTimeout(() => appNameInput.focus(), 100);
          }
        });
      }
      if (saveAppBtn) {
        saveAppBtn.addEventListener("click", () => {
          const newAppName = appNameInput.value.trim();
          if (newAppName && currentPackageName) {
            saveAppBtn.disabled = true;
            saveAppBtn.textContent = "Guardando...";
            const appData = { packageName: currentPackageName, appName: newAppName };
            apiFetch("/api/apps/add", {
              method: "POST",
              body: JSON.stringify(appData)
            }).then((response) => {
              if (response.success) {
                NativeBridge.releaseWindowFocus();
                appDataCache.delete(currentPackageName);
                resetRegistrationForm();
                updateGameStatus({ packageName: currentPackageName, appName: newAppName });
              }
            }).catch((error) => {
              alert(`Error: ${error.message}`);
              NativeBridge.releaseWindowFocus();
              resetRegistrationForm();
            });
          }
        });
      }
      async function classifyApp(isGame) {
        if (!currentPackageName) return;
        const yesBtn = document.getElementById("classify-yes-btn");
        const noBtn = document.getElementById("classify-no-btn");
        if (yesBtn) yesBtn.disabled = true;
        if (noBtn) noBtn.disabled = true;
        try {
          await apiFetch("/api/apps/classify", {
            method: "POST",
            body: JSON.stringify({ packageName: currentPackageName, is_game: isGame })
          });
          appDataCache.delete(currentPackageName);
          await updateGameStatus({ packageName: currentPackageName, appName: "" });
        } catch (error) {
          alert(`Error al clasificar: ${error.message}`);
        } finally {
          if (yesBtn) yesBtn.disabled = false;
          if (noBtn) noBtn.disabled = false;
        }
      }
      const classifyYesBtn = document.getElementById("classify-yes-btn");
      const classifyNoBtn = document.getElementById("classify-no-btn");
      if (classifyYesBtn) classifyYesBtn.addEventListener("click", () => classifyApp(true));
      if (classifyNoBtn) classifyNoBtn.addEventListener("click", () => classifyApp(false));
    } catch (error) {
      document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
    NativeBridge.jsReady();
  });
})();
