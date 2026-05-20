/**
 * Topdee Web Chat Widget
 *
 * Drop-in chat bubble for any website. Paste before </body>:
 *
 *   <script src="https://YOUR_DOMAIN/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
 *
 * Optional attributes on the <script> tag:
 *   data-widget-id   — required; the UUID from Topdee Channels → Website
 *   data-api-base    — override the API base URL (default: same origin as the script src)
 *
 * The widget stores the conversation_id in sessionStorage so the thread
 * persists across page navigations within the same browser tab but starts
 * fresh on a new session.
 */
(function () {
  'use strict';

  // ── Bootstrap ────────────────────────────────────────────────────────────

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var widgetId = script.getAttribute('data-widget-id');
  if (!widgetId) {
    console.warn('[Topdee Widget] Missing data-widget-id attribute.');
    return;
  }

  // API base: strip everything after the last "/" of the script src so we
  // point back to the same server regardless of how the script is loaded.
  var scriptSrc = script.src || '';
  var apiBase = script.getAttribute('data-api-base') ||
    scriptSrc.replace(/\/[^/]*$/, '');

  var STORAGE_KEY = 'topdee_conv_' + widgetId;
  var conversationId = sessionStorage.getItem(STORAGE_KEY) || null;
  var visitorId = localStorage.getItem('topdee_visitor') || null;
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('topdee_visitor', visitorId);
  }

  // ── Config fetch ─────────────────────────────────────────────────────────

  var config = {
    botName: 'AI Assistant',
    greetingMessage: 'Hi! How can I help you today?',
    accentColor: '#6366f1',
    locale: 'auto',
  };

  fetch(apiBase + '/widget/' + widgetId + '/config')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      if (data.bot_name) config.botName = data.bot_name;
      if (data.greeting_message) config.greetingMessage = data.greeting_message;
      if (data.accent_color) config.accentColor = data.accent_color;
      if (data.locale) config.locale = data.locale;
      applyAccent(data.accent_color || config.accentColor);
    })
    .catch(function () {});

  // ── Styles ───────────────────────────────────────────────────────────────

  var css = `
    #tdw-root * { box-sizing: border-box; font-family: inherit; }
    #tdw-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 99998;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--tdw-accent, #6366f1);
      border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,.25);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #tdw-btn:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,.3); }
    #tdw-btn svg { width: 26px; height: 26px; fill: #fff; }
    #tdw-unread {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
      border-radius: 999px; min-width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px; display: none;
    }
    #tdw-box {
      position: fixed; bottom: 92px; right: 24px; z-index: 99999;
      width: 360px; max-width: calc(100vw - 32px);
      height: 520px; max-height: calc(100vh - 120px);
      background: #fff; border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transform-origin: bottom right;
      transition: opacity .2s, transform .2s;
      opacity: 0; transform: scale(.95) translateY(8px); pointer-events: none;
    }
    #tdw-box.open { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
    #tdw-head {
      background: var(--tdw-accent, #6366f1); color: #fff;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    #tdw-head-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    #tdw-head-avatar svg { width: 18px; height: 18px; fill: #fff; }
    #tdw-head-name { font-weight: 700; font-size: 14px; line-height: 1.2; }
    #tdw-head-sub { font-size: 11px; opacity: .8; }
    #tdw-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: #fff; opacity: .8; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    #tdw-close:hover { opacity: 1; background: rgba(255,255,255,.15); }
    #tdw-close svg { width: 18px; height: 18px; stroke: #fff; fill: none; }
    #tdw-msgs {
      flex: 1; overflow-y: auto; padding: 14px 12px;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    .tdw-msg { display: flex; gap: 8px; max-width: 88%; }
    .tdw-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .tdw-msg.bot { align-self: flex-start; }
    .tdw-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--tdw-accent, #6366f1);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; align-self: flex-end;
    }
    .tdw-avatar svg { width: 14px; height: 14px; fill: #fff; }
    .tdw-bubble {
      padding: 9px 13px; border-radius: 16px;
      font-size: 13.5px; line-height: 1.5; word-break: break-word;
      white-space: pre-wrap;
    }
    .tdw-msg.user .tdw-bubble {
      background: var(--tdw-accent, #6366f1); color: #fff;
      border-bottom-right-radius: 4px;
    }
    .tdw-msg.bot .tdw-bubble {
      background: #f3f4f6; color: #111;
      border-bottom-left-radius: 4px;
    }
    .tdw-typing { display: flex; gap: 4px; align-items: center; padding: 4px 2px; }
    .tdw-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #9ca3af; animation: tdwBounce 1.2s infinite;
    }
    .tdw-dot:nth-child(2) { animation-delay: .2s; }
    .tdw-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes tdwBounce {
      0%,80%,100% { transform: translateY(0); }
      40%         { transform: translateY(-6px); }
    }
    #tdw-form {
      border-top: 1px solid #e5e7eb; padding: 10px 12px;
      display: flex; gap: 8px; flex-shrink: 0; background: #fff;
    }
    #tdw-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 10px;
      padding: 9px 12px; font-size: 13.5px; outline: none;
      transition: border-color .15s; color: #111; background: #fff;
      resize: none; height: 40px; overflow: hidden;
    }
    #tdw-input:focus { border-color: var(--tdw-accent, #6366f1); }
    #tdw-input::placeholder { color: #9ca3af; }
    #tdw-send {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: var(--tdw-accent, #6366f1); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity .15s;
    }
    #tdw-send:disabled { opacity: .5; cursor: not-allowed; }
    #tdw-send svg { width: 18px; height: 18px; fill: #fff; }
    #tdw-powered {
      text-align: center; font-size: 10px; color: #9ca3af;
      padding: 4px 0 8px; flex-shrink: 0;
    }
  `;

  function applyAccent(color) {
    if (!color) return;
    document.documentElement.style.setProperty('--tdw-accent', color);
  }

  // ── DOM build ────────────────────────────────────────────────────────────

  var root = document.createElement('div');
  root.id = 'tdw-root';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  root.appendChild(styleEl);

  // Toggle button
  var btn = document.createElement('button');
  btn.id = 'tdw-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
    </svg>
    <span id="tdw-unread"></span>
  `;

  // Chat box
  var box = document.createElement('div');
  box.id = 'tdw-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Chat');
  box.innerHTML = `
    <div id="tdw-head">
      <div id="tdw-head-avatar">
        <svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/></svg>
      </div>
      <div>
        <div id="tdw-head-name">${config.botName}</div>
        <div id="tdw-head-sub">Online</div>
      </div>
      <button id="tdw-close" aria-label="Close chat">
        <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div id="tdw-msgs" role="log" aria-live="polite"></div>
    <form id="tdw-form" autocomplete="off">
      <input id="tdw-input" type="text" placeholder="Type a message…" maxlength="2000" autocomplete="off" />
      <button id="tdw-send" type="submit" disabled aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </form>
    <div id="tdw-powered">Powered by <strong>Topdee</strong></div>
  `;

  root.appendChild(btn);
  root.appendChild(box);
  document.body.appendChild(root);

  // ── Refs ─────────────────────────────────────────────────────────────────

  var msgs = document.getElementById('tdw-msgs');
  var input = document.getElementById('tdw-input');
  var sendBtn = document.getElementById('tdw-send');
  var closeBtn = document.getElementById('tdw-close');
  var unreadBadge = document.getElementById('tdw-unread');
  var headName = document.getElementById('tdw-head-name');
  var isOpen = false;
  var isBusy = false;
  var unreadCount = 0;
  var greetingShown = false;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function setOpen(open) {
    isOpen = open;
    if (open) {
      box.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      unreadCount = 0;
      unreadBadge.style.display = 'none';
      unreadBadge.textContent = '';
      input.focus();
      if (!greetingShown) showGreeting();
    } else {
      box.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function showGreeting() {
    greetingShown = true;
    // Re-fetch config in case it loaded after init
    var greeting = config.greetingMessage;
    if (heading) headName.textContent = config.botName;
    appendMsg('bot', greeting);
    // Try to load history if there is a saved conversation
    if (conversationId) loadHistory();
  }

  function appendMsg(role, text) {
    var isBot = role !== 'user';
    var wrap = document.createElement('div');
    wrap.className = 'tdw-msg ' + (isBot ? 'bot' : 'user');

    if (isBot) {
      var av = document.createElement('div');
      av.className = 'tdw-avatar';
      av.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/></svg>';
      wrap.appendChild(av);
    }

    var bubble = document.createElement('div');
    bubble.className = 'tdw-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);

    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function showTyping() {
    var wrap = document.createElement('div');
    wrap.className = 'tdw-msg bot';
    wrap.id = 'tdw-typing';
    var av = document.createElement('div');
    av.className = 'tdw-avatar';
    av.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/></svg>';
    wrap.appendChild(av);
    var bubble = document.createElement('div');
    bubble.className = 'tdw-bubble';
    bubble.innerHTML = '<div class="tdw-typing"><div class="tdw-dot"></div><div class="tdw-dot"></div><div class="tdw-dot"></div></div>';
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function removeTyping() {
    var el = document.getElementById('tdw-typing');
    if (el) el.remove();
  }

  function incrementUnread() {
    if (isOpen) return;
    unreadCount++;
    unreadBadge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    unreadBadge.style.display = 'flex';
  }

  function setBusyState(busy) {
    isBusy = busy;
    sendBtn.disabled = busy || input.value.trim() === '';
    input.disabled = busy;
  }

  // ── History load ─────────────────────────────────────────────────────────

  function loadHistory() {
    if (!conversationId) return;
    fetch(apiBase + '/widget/' + widgetId + '/history?conversation_id=' + encodeURIComponent(conversationId) + '&limit=40')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.messages || data.messages.length === 0) return;
        // Clear the greeting and render history
        msgs.innerHTML = '';
        data.messages.forEach(function (m) {
          appendMsg(m.role === 'user' ? 'user' : 'bot', m.content);
        });
      })
      .catch(function () {});
  }

  // ── Send ─────────────────────────────────────────────────────────────────

  function sendMessage(text) {
    text = text.trim();
    if (!text || isBusy) return;

    appendMsg('user', text);
    setBusyState(true);
    var typing = showTyping();

    fetch(apiBase + '/widget/' + widgetId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        conversation_id: conversationId || undefined,
        visitor_id: visitorId,
      }),
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (data) {
        removeTyping();
        if (data.conversation_id) {
          conversationId = data.conversation_id;
          sessionStorage.setItem(STORAGE_KEY, conversationId);
        }
        var reply = data.reply || '';
        if (reply) {
          appendMsg('bot', reply);
          incrementUnread();
        }
      })
      .catch(function () {
        removeTyping();
        appendMsg('bot', 'Sorry, something went wrong. Please try again.');
        incrementUnread();
      })
      .finally(function () {
        setBusyState(false);
        input.focus();
      });
  }

  // ── Events ───────────────────────────────────────────────────────────────

  btn.addEventListener('click', function () { setOpen(!isOpen); });
  closeBtn.addEventListener('click', function () { setOpen(false); });

  document.getElementById('tdw-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value;
    input.value = '';
    sendBtn.disabled = true;
    sendMessage(text);
  });

  input.addEventListener('input', function () {
    sendBtn.disabled = isBusy || input.value.trim() === '';
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        var text = input.value;
        input.value = '';
        sendBtn.disabled = true;
        sendMessage(text);
      }
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) setOpen(false);
  });

  // Re-apply accent once config resolves (called from fetch above)
  var heading = true;
  applyAccent(config.accentColor);

})();
