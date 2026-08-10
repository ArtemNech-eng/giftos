// ==UserScript==
// @name         MAX Автоотклик на заявки
// @namespace    local.max-autootklik
// @version      2.7.0
// @description  Автоотклик «Я» на сообщения с ключевыми словами в чате курьеров MAX (web.max.ru). Вкл/выкл: кнопка на панели, F9 или «вкл»/«выкл» в чат «Избранное» с телефона.
// @author       you
// @match        https://web.max.ru/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==

const CONFIG = {
  // Ключевые слова (если в новом сообщении есть хотя бы одно — откликаемся)
  TRIGGER_KEYWORDS: ["оплачен", "готово", "наличные", "оплачено"],
  // Текст отклика
  REPLY_TEXT: "Я",
  // Кусочек названия чата курьеров
  CHAT_NAME_HINTS: ["пешеходы"],
  // Как часто проверять чат (мс)
  POLL_MS: 150,
  // Пауза между отправками (мс)
  SEND_COOLDOWN_MS: 2000,
  // Максимум отправок в минуту
  MAX_SENDS_PER_MINUTE: 10,
  // ТЕСТОВЫЙ РЕЖИМ: false = БОЕВОЙ (скрипт реально отправляет «Я»).
  // Если хотите снова проверить без отправки — поменяйте на true и обновите.
  TEST_MODE: false,
  // Горячая клавиша вкл/выкл
  TOGGLE_HOTKEY: "F9",
  // Управление с телефона: «вкл»/«выкл» в чат «Избранное»
  MAX_CONTROL: {
    ENABLED: true,
    CHAT_HINTS: ["избранное"],
    ON_WORDS: ["вкл", "включи", "включить"],
    OFF_WORDS: ["выкл", "выключи", "выключить"],
    POLL_MS: 2000
  }
};

(function () {
  "use strict";

  // защита от дублей
  try {
    if (window.__maoRunning) return;
    window.__maoRunning = true;
  } catch (e) {}

  // защита от зацикливания
  let loopOk = true;
  try {
    const KEY = "mao_reload_count";
    const prev = parseInt(sessionStorage.getItem(KEY) || "0", 10) || 0;
    sessionStorage.setItem(KEY, String(prev + 1));
    if (prev > 3) loopOk = false;
  } catch (e) {}

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const state = {
    on: loopOk && !!GM_getValue("maxOtklikOn", false),
    lastSend: 0, sentMin: 0, minStart: Date.now(),
    seenMs: {}, ctrlSeen: {}, ctrlInit: false, ctrlOk: null,
    lastDbg: "", targetClicked: false,
    ctrlLearnText: GM_getValue("mao_ctrlText", "")
  };
  let logEl, btnEl, dbgEl, btnCtrlEl;
  let ctrlLearnMode = false;
  const observedRoots = new Set();

  /* ================= ДОКУМЕНТЫ + SHADOW DOM ================= */

  function docs() {
    const list = [document];
    try {
      $$("iframe").forEach(function (f) {
        try {
          const d = f.contentDocument;
          if (d && d !== document && d.body) list.push(d);
        } catch (e) {}
      });
    } catch (e) {}
    return list;
  }

  // все "корни" страницы, включая теневые (Shadow DOM) и iframe
  function allRoots() {
    const roots = [];
    docs().forEach(function (d) {
      roots.push(d);
      try {
        const walk = function (root) {
          Array.from(root.querySelectorAll("*")).forEach(function (el) {
            if (el.shadowRoot) {
              roots.push(el.shadowRoot);
              walk(el.shadowRoot);
            }
          });
        };
        walk(d);
      } catch (e) {}
    });
    return roots;
  }

  function findInAll(sel) {
    for (const r of allRoots()) {
      try {
        const el = r.querySelector(sel);
        if (el) return el;
      } catch (e) {}
    }
    return null;
  }

  function findAllInAll(sel) {
    const out = [];
    for (const r of allRoots()) {
      try {
        Array.from(r.querySelectorAll(sel)).forEach(function (el) { out.push(el); });
      } catch (e) {}
    }
    return out;
  }

  function isVisible(el) {
    try { return !!(el && el.offsetParent !== null); } catch (e) { return true; }
  }

  /* ================= ПОИСК ЭЛЕМЕНТОВ ================= */

  function msgBox() {
    const sels = [
      '[role="log"]', '[data-testid*="message-list"]', '[data-testid*="MessageList"]',
      '[class*="message-list"]', '[class*="MessageList"]', '[class*="mess-stack"]',
      '[class*="im-mess"]', '[class*="messages"]', '[class*="Messages"]',
      '[class*="message"]', '[class*="Message"]'
    ];
    for (const s of sels) {
      const el = findInAll(s);
      if (!el) continue;
      const t = (el.innerText || "").trim();
      if (t.length > 1 && t.length <= 300000) return el;
    }
    // эвристика: самый большой прокручиваемый блок с текстом
    let best = null, bestScore = 0;
    findAllInAll("div").forEach(function (el) {
      if (el === document.body || el === document.documentElement) return;
      const t = (el.innerText || "").trim();
      if (t.length < 80 || t.length > 400000) return;
      let score = t.length;
      try { if (el.scrollHeight > el.clientHeight + 80) score += 5000; } catch (e) {}
      if (el.children.length > 5) score += 1000;
      if (!isVisible(el)) score -= 10000;
      if (score > bestScore) { bestScore = score; best = el; }
    });
    return best;
  }

  function input() {
    const els = findAllInAll("textarea, [contenteditable='true'], [contenteditable=''], [role='textbox'], input[type='text']");
    let best = null, bestArea = 0;
    els.forEach(function (el) {
      if (!isVisible(el)) return;
      const r = el.getBoundingClientRect();
      const area = (r.width || 0) * (r.height || 0);
      if (area > bestArea) { bestArea = area; best = el; }
    });
    return best;
  }

  function sendBtn() {
    const sels = [
      'button[aria-label*="тправ"]', 'button[aria-label*="Send"]', 'button[aria-label*="send"]',
      '[data-testid*="send"]', '[data-testid*="Send"]', 'button[title*="тправ"]', 'button[title*="Send"]'
    ];
    for (const s of sels) {
      const b = findInAll(s);
      if (b && isVisible(b)) return b;
    }
    // кнопка рядом с полем ввода
    const i = input();
    if (i) {
      let p = i.parentElement;
      for (let k = 0; p && k < 5; k++, p = p.parentElement) {
        const btns = Array.from(p.querySelectorAll("button"));
        for (const b of btns) {
          const t = (b.getAttribute("aria-label") || b.title || b.textContent || "").toLowerCase();
          if (/отправ|send/.test(t)) return b;
        }
      }
      const btns = Array.from(i.parentElement.querySelectorAll("button"));
      if (btns.length) return btns[btns.length - 1];
    }
    // последняя видимая кнопка на странице — как крайняя мера
    const all = findAllInAll("button").filter(isVisible);
    return all[all.length - 1] || null;
  }

  function chatOpen() {
    const c = msgBox();
    return !!(c && (c.innerText || "").trim().length > 1);
  }

  // Открыт ли целевой чат «Пешеходы»?
  function isTargetChatOpen() {
    const c = msgBox();
    if (!c) return false;
    // 1) пользователь кликал по элементу с названием чата
    if (state.targetClicked) return true;
    // 2) заголовок с названием рядом с областью сообщений
    const hl = findAllInAll("div, span, h1, h2, h3, header").filter(function (el) {
      const t = (el.innerText || "").trim();
      if (!t || t.length === 0 || t.length > 80) return false;
      return CONFIG.CHAT_NAME_HINTS.some(function (h) { return t.toLowerCase().includes(h.toLowerCase()); });
    });
    for (const h of hl) {
      try {
        if (c.contains(h) || h.contains(c)) return true;
        let p = c.parentElement;
        for (let i = 0; i < 8 && p; i++) {
          if (p.contains(h)) return true;
          p = p.parentElement;
        }
      } catch (e) {}
    }
    return false;
  }

  function findChat(hints) {
    const hs = hints.map(function (h) { return h.toLowerCase(); });
    const c = msgBox();
    return findAllInAll("div, li, a").filter(function (el) {
      if (el.children.length > 6) return false;
      const t = (el.innerText || "").trim();
      if (!t || t.length === 0 || t.length > 250) return false;
      if (c && c.contains(el)) return false;
      const tl = t.toLowerCase();
      return hs.some(function (h) { return tl.includes(h); });
    })[0] || null;
  }

  function isLoginPage() {
    if (findAllInAll("button").length >= 5) return false;
    if (msgBox()) return false;
    if (findChat(CONFIG.CHAT_NAME_HINTS)) return false;
    const body = (document.body ? document.body.innerText : "").slice(0, 2000).toLowerCase();
    return /отсканируй|сканируйте|qr-код|qr код|наведите камеру/i.test(body);
  }

  /* ================= ОТПРАВКА ================= */

  function setVal(i, v) {
    if (i.tagName === "TEXTAREA" || i.tagName === "INPUT") {
      const p = i.tagName === "TEXTAREA" ? HTMLTextAreaElement : HTMLInputElement;
      Object.getOwnPropertyDescriptor(p.prototype, "value").set.call(i, v);
      i.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (i.isContentEditable) {
      i.focus(); i.textContent = v;
      i.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: v }));
    }
  }

  function sendReply() {
    const i = input();
    if (!i) { log("Нет поля ввода!", "e"); return false; }
    setVal(i, CONFIG.REPLY_TEXT);
    const b = sendBtn();
    if (b) b.click();
    else {
      i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
      i.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
    }
    return true;
  }

  function canSend() {
    const n = Date.now();
    if (n - state.minStart > 60000) { state.minStart = n; state.sentMin = 0; }
    return n - state.lastSend >= CONFIG.SEND_COOLDOWN_MS && state.sentMin < CONFIG.MAX_SENDS_PER_MINUTE;
  }

  /* ================= ЛОГИКА ================= */

  function proc(node) {
    if (!node || node.nodeType !== 1) return;
    if (!isTargetChatOpen()) return;
    const t = (node.innerText || node.textContent || "").trim();
    if (!t || t.length === 0) return;
    const sig = t.trim().toLowerCase().replace(/\s+/g, " ");
    if (sig === CONFIG.REPLY_TEXT.toLowerCase()) return;
    if (!CONFIG.TRIGGER_KEYWORDS.some(function (k) { return k && sig.includes(k.toLowerCase()); })) return;
    const last = state.seenMs[sig];
    if (last && Date.now() - last < 20000) return;
    state.seenMs[sig] = Date.now();
    if (CONFIG.TEST_MODE) {
      log("ТЕСТ: «" + t.slice(0, 60) + "…» → отправил бы «" + CONFIG.REPLY_TEXT + "»", "h");
      return;
    }
    if (!canSend()) { log("Слишком часто, пропуск", "w"); return; }
    const ok = sendReply();
    state.lastSend = Date.now(); state.sentMin++;
    log(ok ? "ОТКЛИК: отправлено «" + CONFIG.REPLY_TEXT + "»" : "Не удалось отправить", ok ? "o" : "e");
    if (ok) { flash(); notif("MAX Автоотклик", "Отправлено: " + CONFIG.REPLY_TEXT); }
  }

  function scan() {
    if (!isTargetChatOpen()) return;
    const c = msgBox();
    if (!c) return;
    Array.from(c.children).slice(-30).forEach(proc);
    findAllInAll("[role='listitem'],[data-testid*='message'],[class*='message']").slice(-30).forEach(proc);
  }

  let lastWarn = 0;
  function ensureOpen() {
    if (chatOpen()) return;
    if (isLoginPage()) {
      if (state.on && Date.now() - lastWarn > 20000) {
        lastWarn = Date.now();
        log("Похоже, вы на странице входа (QR-код). Отсканируйте его с телефона.", "w");
      }
      return;
    }
    const it = findChat(CONFIG.CHAT_NAME_HINTS);
    if (it) { it.click(); log("Открываю чат «" + (it.innerText || "").trim().slice(0, 30) + "»", "w"); return; }
    if (state.on) log("Не вижу чат «" + CONFIG.CHAT_NAME_HINTS.join("/") + "». Откройте его вручную: список чатов слева → «Пешеходы».", "w");
  }

  /* ================= УПРАВЛЕНИЕ С ТЕЛЕФОНА ================= */

  // Название чата (часть до «:») — чтобы находить пульт, даже когда превью меняется
  function ctrlTitleOf(t) {
    const i = t.indexOf(":");
    return (i >= 0 ? t.slice(0, i) : t).trim().toLowerCase();
  }

  // Поиск чата-пульта: сначала по CHAT_HINTS, потом по сохранённому (кликом)
  function findCtrlChats() {
    const all = findAllInAll("div, li, a").filter(function (el) {
      const t = (el.innerText || "").trim();
      if (!t || t.length > 300 || el.children.length > 6) return false;
      const tl = t.toLowerCase();
      return CONFIG.MAX_CONTROL.CHAT_HINTS.some(function (h) { return tl.includes(h.toLowerCase()); });
    });
    if (all.length) return all;
    if (state.ctrlLearnText) {
      const saved = ctrlTitleOf(state.ctrlLearnText);
      if (saved) {
        return findAllInAll("div, li, a").filter(function (el) {
          const t = (el.innerText || "").trim();
          if (!t || t.length > 300 || el.children.length > 6) return false;
          const title = ctrlTitleOf(t);
          return title === saved || title.indexOf(saved) === 0 || saved.indexOf(title) === 0;
        });
      }
    }
    return [];
  }

  // «Обучение»: пользователь кликает по чату-пульту в списке — запоминаем его
  function learnCtrl(el) {
    let node = el;
    for (let i = 0; node && i < 8; i++, node = node.parentElement) {
      const t = (node.innerText || "").trim();
      if (!t || t.length === 0 || t.length > 200) continue;
      const title = ctrlTitleOf(t);
      if (!title || title.length === 0 || title.length > 60) continue;
      if (node.children.length <= 6) {
        state.ctrlLearnText = t;
        try { GM_setValue("mao_ctrlText", t); } catch (e) {}
        state.ctrlOk = true;
        log("Пульт указан: «" + t.slice(0, 60) + "». Теперь пишите «вкл»/«выкл» в этот чат с телефона.", "o");
        return true;
      }
    }
    log("Не получилось определить чат-пульт — кликните по названию чата в списке слева.", "w");
    return false;
  }

  function pollCtrl() {
    if (!CONFIG.MAX_CONTROL.ENABLED) return;
    const items = findCtrlChats();
    if (!items.length) {
      state.ctrlOk = false;
      if (!state.ctrlLearnText) {
        log("Пульт не указан: нажмите «Указать пульт» на панели и кликните по чату-пульту в списке слева.", "w");
      }
      return;
    }
    state.ctrlOk = true;
    const now = Date.now();
    items.forEach(function (el) {
      const full = (el.innerText || "").trim();
      const idx = full.indexOf(":");
      const prev = (idx >= 0 ? full.slice(idx + 1) : full).trim();
      if (!prev || prev.length > 30) return;
      const pl = prev.toLowerCase();
      let cmd = null;
      if (CONFIG.MAX_CONTROL.OFF_WORDS.some(function (w) { return w && pl.includes(w.toLowerCase()); })) cmd = false;
      else if (CONFIG.MAX_CONTROL.ON_WORDS.some(function (w) { return w && pl.includes(w.toLowerCase()); })) cmd = true;
      if (cmd === null) return;
      const sig = "c|" + prev.trim().toLowerCase();
      if (state.ctrlSeen[sig] && now - state.ctrlSeen[sig] < 60000) return;
      state.ctrlSeen[sig] = now;
      if (!state.ctrlInit) return;
      log("С телефона «" + prev + "» → " + (cmd ? "ВКЛ" : "ВЫКЛ"), "w");
      if (cmd !== state.on) {
        state.on = cmd;
        upd();
        log(cmd ? "Автоотклик ВКЛЮЧЁН" : "Автоотклик ВЫКЛЮЧЕН", cmd ? "o" : "w");
        if (cmd) ensureOpen();
      }
    });
    state.ctrlInit = true;
  }

  /* ================= ПАНЕЛЬ ================= */

  function log(m, k) {
    if (!logEl) return;
    const d = document.createElement("div");
    d.className = "l" + (k ? " " + k : "");
    d.textContent = "[" + new Date().toLocaleTimeString("ru-RU", { hour12: false }) + "] " + m;
    logEl.appendChild(d);
    while (logEl.children.length > 100) logEl.removeChild(logEl.firstChild);
  }
  function notif(t, b) { try { GM_notification({ title: t, text: b, timeout: 4000 }); } catch (e) {} }
  function flash() {
    const o = document.title;
    document.title = "⚡ОТКЛИК! " + o;
    setTimeout(function () { document.title = o; }, 2500);
  }

  function dbg() {
    if (!dbgEl) return;
    const c = msgBox(), i = input(), b = sendBtn();
    let ctrl = "пульт…";
    if (!CONFIG.MAX_CONTROL.ENABLED) ctrl = "пульт выкл";
    else if (state.ctrlOk !== null) ctrl = state.ctrlOk ? "пульт ✅" : "пульт ❌";
    const s =
      "цель «Пешеходы»: " + (isTargetChatOpen() ? "✅" : "❌") +
      " · чат: " + (chatOpen() ? "✅" : "❌") +
      "<br>поле: " + (i ? "✅" : "❌") +
      " · кнопка: " + (b ? "✅" : "❌") +
      " · " + ctrl +
      "<br>полей: " + findAllInAll("textarea,[contenteditable='true'],[role='textbox']").filter(isVisible).length +
      " · кнопок: " + findAllInAll("button").filter(isVisible).length +
      " · iframes: " + document.querySelectorAll("iframe").length +
      "<br>режим: " + (CONFIG.TEST_MODE ? "ТЕСТ" : "БОЕВОЙ") +
      " · статус: " + (state.on ? "ВКЛ" : "ВЫКЛ");
    if (s === state.lastDbg) return;
    state.lastDbg = s;
    dbgEl.innerHTML = s;
  }

  function upd() {
    if (!btnEl) return;
    btnEl.textContent = state.on ? "⚡ ВКЛ" : "⚡ ВЫКЛ";
    btnEl.className = state.on ? "on" : "off";
    GM_setValue("maxOtklikOn", state.on);
    dbg();
  }

  function toggle() {
    state.on = !state.on;
    log(state.on ? "Автоотклик ВКЛЮЧЁН" + (CONFIG.TEST_MODE ? " (ТЕСТ)" : "") : "Автоотклик ВЫКЛЮЧЕН", state.on ? "o" : "w");
    upd();
    if (state.on) ensureOpen();
  }

  function build() {
    const st = document.createElement("style");
    st.textContent =
      "#mao-panel{position:fixed;top:10px;right:10px;z-index:2147483647;width:310px;background:#1c1e26;color:#eee;border:2px solid #ffd166;border-radius:10px;font:13px Segoe UI,Arial,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.6);user-select:none}" +
      "#mao-panel .hd{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#ffd166;border-radius:8px 8px 0 0;font-weight:800;color:#1c1e26}" +
      "#mao-panel .hd .t{flex:1}" +
      "#mao-toggle{border:0;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer;color:#fff;font-size:13px}" +
      "#mao-toggle.on{background:#1f9d55}#mao-toggle.off{background:#d64545}" +
      "#mao-panel .log{max-height:190px;overflow:auto;padding:6px 10px;font:11px Consolas,monospace;color:#9aa0b5;white-space:pre-wrap;word-break:break-all}" +
      "#mao-panel .log .h{color:#ffd166}#mao-panel .log .o{color:#5fd68a}#mao-panel .log .e{color:#ff7b7b}#mao-panel .log .w{color:#ffb454}" +
      "#mao-panel .dbg{padding:4px 10px 6px;font-size:11px;color:#8a90a6;border-top:1px solid #3a3f52}" +
      "#mao-panel .f{display:flex;gap:6px;padding:0 10px 8px}" +
      "#mao-panel .f button{flex:1;border:1px solid #3a3f52;background:#262a38;color:#cfd3e6;border-radius:6px;padding:4px;cursor:pointer;font-size:11px}";
    document.head.appendChild(st);
    const p = document.createElement("div");
    p.id = "mao-panel";
    p.innerHTML =
      '<div class="hd"><span class="t">⚡ MAX Автоотклик</span><button id="mao-toggle" class="off">⚡ ВЫКЛ</button></div>' +
      '<div class="log"></div><div class="dbg"></div>' +
      '<div class="f"><button data-a="ctrl">Указать пульт</button><button data-a="scan">Проверить</button><button data-a="diag">Диагностика</button><button data-a="cls">Очистить</button><button data-a="hid">Свернуть</button></div>';
    document.body.appendChild(p);
    logEl = p.querySelector(".log");
    dbgEl = p.querySelector(".dbg");
    btnEl = p.querySelector("#mao-toggle");
    btnEl.addEventListener("click", toggle);
    btnCtrlEl = p.querySelector('[data-a="ctrl"]');
    btnCtrlEl.addEventListener("click", function () {
      ctrlLearnMode = !ctrlLearnMode;
      btnCtrlEl.textContent = ctrlLearnMode ? "Кликни по чату…" : "Указать пульт";
      log(ctrlLearnMode ? "Режим указания: кликните по чату-пульту в списке слева (например, «Избранное» или ваш канал)." : "Указание отменено", "w");
      if (ctrlLearnMode) {
        setTimeout(function () {
          ctrlLearnMode = false;
          btnCtrlEl.textContent = "Указать пульт";
        }, 15000);
      }
    });
    p.querySelector('[data-a="scan"]').addEventListener("click", function () { scan(); dbg(); });
    p.querySelector('[data-a="diag"]').addEventListener("click", diag);
    p.querySelector('[data-a="cls"]').addEventListener("click", function () { logEl.innerHTML = ""; });
    p.querySelector('[data-a="hid"]').addEventListener("click", function () {
      p.querySelector(".log").style.display = p.querySelector(".log").style.display === "none" ? "" : "none";
    });
    log("Скрипт загружен. Слова: " + CONFIG.TRIGGER_KEYWORDS.join(", "));
    log("Отклик: «" + CONFIG.REPLY_TEXT + "»" + (CONFIG.TEST_MODE ? "  ⚠ ТЕСТ" : ""));
    if (CONFIG.MAX_CONTROL.ENABLED) {
      if (state.ctrlLearnText) log("Пульт: сохранён чат «" + state.ctrlLearnText.slice(0, 40) + "»", "o");
      else log("Пульт: не указан. Нажмите «Указать пульт» и кликните по чату-пульту в списке слева.", "w");
    }
    upd();
  }

  function diag() {
    const out = [];
    out.push("URL: " + location.href);
    out.push("title: " + document.title);
    out.push("вход: " + (isLoginPage() ? "QR-страница" : "нет"));
    out.push("iframes: " + document.querySelectorAll("iframe").length);
    document.querySelectorAll("iframe").forEach(function (f, i) {
      let acc = "закрыт";
      try { acc = f.contentDocument && f.contentDocument.body ? "доступен" : "пусто"; } catch (e) { acc = "закрыт"; }
      out.push("  iframe[" + i + "] " + (f.src || "-") + " [" + acc + "]");
    });
    ["log", "list", "listitem", "textbox", "main", "complementary", "region", "dialog", "button", "textbox"].forEach(function (r) {
      out.push("role=" + r + ": " + findAllInAll('[role="' + r + '"]').length);
    });
    out.push("textarea: " + findAllInAll("textarea").length);
    out.push("contenteditable: " + findAllInAll('[contenteditable]').length);
    out.push("button всего: " + findAllInAll("button").length);
    out.push("input: " + findAllInAll("input").length);
    out.push("shadowRoot: " + allRoots().length);
    const counts = {};
    findAllInAll("div").forEach(function (el) {
      String(el.className || "").split(/\s+/).forEach(function (cl) {
        if (cl) counts[cl] = (counts[cl] || 0) + 1;
      });
    });
    const top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 45);
    out.push("classes top45: " + top.map(function (c) { return c + "(" + counts[c] + ")"; }).join(" "));
    out.push("эл. с «Пешеход»: " + findAllInAll("div,li,a,span").filter(function (el) {
      return (el.innerText || "").indexOf("Пешеход") >= 0;
    }).length);
    const text = out.join("\n");
    log("ДИАГНОСТИКА: " + text, "w");
    try {
      navigator.clipboard.writeText(text);
      log("✅ Диагностика скопирована — вставьте её сюда (Ctrl+V)", "o");
    } catch (e) {
      let ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand("copy"); log("✅ Диагностика скопирована — вставьте сюда (Ctrl+V)", "o"); }
      catch (e2) { log("Не удалось скопировать — перепишите текст выше", "w"); }
      document.body.removeChild(ta);
    }
  }

  /* ================= НАБЛЮДАТЕЛИ ================= */

  function ensureObservers() {
    allRoots().forEach(function (root) {
      if (observedRoots.has(root)) return;
      observedRoots.add(root);
      try {
        new MutationObserver(function (muts) {
          if (!state.on) return;
          muts.forEach(function (m) { m.addedNodes.forEach(function (n) { proc(n); }); });
        }).observe(root, { childList: true, subtree: true });
      } catch (e) {}
    });
  }

  /* ================= ЗАПУСК ================= */

  function start() {
    try { document.title = "⚡MAX " + document.title; } catch (e) {}
    build();
    ensureObservers();

    // запоминаем, в какой чат кликнул пользователь
    document.addEventListener("click", function (e) {
      try {
        if (e.target && e.target.closest && e.target.closest("#mao-panel")) return;
        // режим «Указать пульт»: клик по чату в списке = назначаем его пультом
        if (ctrlLearnMode) {
          ctrlLearnMode = false;
          if (btnCtrlEl) btnCtrlEl.textContent = "Указать пульт";
          learnCtrl(e.target);
          return;
        }
        let el = e.target;
        for (let i = 0; el && i < 8; i++, el = el.parentElement) {
          if (!el.innerText) continue;
          const t = (el.innerText || "").trim();
          if (!t || t.length === 0 || t.length > 200) continue;
          const tl = t.toLowerCase();
          if (CONFIG.CHAT_NAME_HINTS.some(function (h) { return tl.includes(h.toLowerCase()); })) {
            state.targetClicked = true;
            return;
          }
          if (el.children.length <= 6 && t.length < 150) {
            state.targetClicked = false;
          }
        }
      } catch (err) {}
    }, true);

    document.addEventListener("keydown", function (e) {
      if (e.key === CONFIG.TOGGLE_HOTKEY && !e.repeat) { e.preventDefault(); toggle(); }
    });

    setInterval(function () {
      ensureObservers();
      if (state.on) { ensureOpen(); scan(); }
    }, CONFIG.POLL_MS);

    if (CONFIG.MAX_CONTROL.ENABLED) { setTimeout(pollCtrl, 2000); setInterval(pollCtrl, CONFIG.MAX_CONTROL.POLL_MS); }
    setInterval(dbg, 2000);

    if (!loopOk) {
      log("⚠ Обнаружено зацикливание: скрипт сам себя ВЫКЛЮЧИЛ, чтобы страница не перезагружалась.", "w");
      GM_setValue("maxOtklikOn", false);
      upd();
      return;
    }
    if (state.on) { log("Старт: ВКЛ"); ensureOpen(); }
    if (CONFIG.TEST_MODE) log("⚠ ТЕСТОВЫЙ РЕЖИМ — ничего не отправляется!", "w");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
