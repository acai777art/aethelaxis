/* =========================================================
   AETHEL AXIS — app.js (front skeleton)
   - bottom nav routing
   - simple state store
   - chat stub -> backend /api/chat/{cid}
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  page: "home",
  cid: localStorage.getItem("ax_cid") || "default",
  token: getToken(),
  apiBase: getApiBase(),
};

function getToken() {
  // token can be passed as ?token=... from backend /auth/refresh
  const url = new URL(window.location.href);
  const t = url.searchParams.get("token");
  if (t) {
    localStorage.setItem("ax_token", t);
    url.searchParams.delete("token");
    history.replaceState({}, "", url.toString());
    return t;
  }
  return localStorage.getItem("ax_token") || "";
}

function getApiBase() {
  // If your backend and frontend are different domains, set it in localStorage:
  // localStorage.setItem("ax_api", "https://acai-backend.onrender.com/")
  // Otherwise it will use same origin.
  return localStorage.getItem("ax_api") || "";
}

function apiUrl(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return state.apiBase ? (state.apiBase.replace(/\/$/, "") + path) : path;
}

function setActivePage(id) {
  state.page = id;
  $$(".page").forEach(p => p.classList.remove("page--active"));
  const page = $(`.page[data-page="${id}"]`);
  if (page) page.classList.add("page--active");

  $$(".nav__item").forEach(b => b.classList.remove("nav__item--active"));
  const btn = $(`.nav__item[data-go="${id}"]`);
  if (btn) btn.classList.add("nav__item--active");
}

function initNav() {
  $$(".nav__item").forEach(btn => {
    btn.addEventListener("click", () => {
      const go = btn.getAttribute("data-go");
      if (go) setActivePage(go);
    });
  });
}

function addBubble(role, text) {
  const thread = $(".chat__thread");
  if (!thread) return;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.justifyContent = role === "user" ? "flex-end" : "flex-start";

  const bubble = document.createElement("div");
  bubble.className = "card";
  bubble.style.maxWidth = "82%";
  bubble.style.padding = "12px 14px";
  bubble.style.borderRadius = "18px";
  bubble.style.background =
    role === "user"
      ? "linear-gradient(135deg, rgba(91,188,255,0.75), rgba(124,242,194,0.65))"
      : "rgba(255,255,255,0.12)";
  bubble.style.border = "1px solid rgba(255,255,255,0.16)";
  bubble.style.color = role === "user" ? "#071423" : "#f5f7fb";
  bubble.textContent = text;

  wrap.appendChild(bubble);
  thread.appendChild(wrap);
  thread.scrollTop = thread.scrollHeight;
}

async function chatSend(message) {
  const url = apiUrl(`/api/chat/${encodeURIComponent(state.cid)}`);

  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
    credentials: "include",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${t.slice(0, 200)}`);
  }
  return await res.json();
}

function initChat() {
  const input = $(".chat__input");
  const sendBtn = $(".chat__send");
  if (!input || !sendBtn) return;

  const send = async () => {
    const text = (input.value || "").trim();
    if (!text) return;
    input.value = "";

    addBubble("user", text);

    try {
      // small typing indicator
      addBubble("assistant", "…");
      const lastBubble = $(".chat__thread > div:last-child div");
      const data = await chatSend(text);

      if (lastBubble) lastBubble.textContent = data.reply || "(empty)";
      // optional: if backend returns force_text, we can later route voice/text UI
      console.log("[chat]", data);
    } catch (e) {
      console.error(e);
      addBubble("assistant", "⚠️ Backend error. Check token / API base / CORS.");
    }
  };

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
  });
}

function initApiHint() {
  // If token is missing, show a subtle hint
  const hint = $(".auth-hint");
  if (!hint) return;
  if (state.token) {
    hint.textContent = "✅ Authorized";
  } else {
    hint.textContent = "🔒 Not authorized. Open /login on backend and come back with token.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initChat();
  initApiHint();
  setActivePage("home");
});
