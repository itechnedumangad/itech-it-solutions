/* iTech Admin/Staff inactivity PIN lock. PIN is stored as a SHA-256 digest per signed-in user in this browser. */
(function () {
  'use strict';
  if (window.__itechIdlePinLockStarted) return;
  window.__itechIdlePinLockStarted = true;

  const IDLE_MS = 30 * 60 * 1000;
  const LOGIN_URL = '../pages/login.html';
  const KEY_PREFIX = 'itech_admin_staff_pin_v1:';
  let userId = null;
  let lastActivity = Date.now();
  let locked = false;
  let attempts = 0;
  let overlay, titleEl, noteEl, pinInput, confirmInput, confirmWrap, errorEl, submitBtn;
  let mode = 'setup';

  function digest(pin) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin)).then(buf =>
        Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
    }
    // Compatibility fallback for older browsers; the value is still not stored as plain text.
    let h = 2166136261;
    for (let i = 0; i < pin.length; i++) { h ^= pin.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Promise.resolve('fallback-' + (h >>> 0).toString(16));
  }

  function pinKey() { return KEY_PREFIX + userId; }
  function storedHash() { try { return localStorage.getItem(pinKey()); } catch (_) { return null; } }
  function saveHash(hash) { try { localStorage.setItem(pinKey(), hash); return true; } catch (_) { return false; } }

  function createUI() {
    if (overlay) return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes itechPinFade{from{opacity:0}to{opacity:1}}
      @keyframes itechPinRise{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes itechPinGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,142,35,.22)}50%{box-shadow:0 0 0 10px rgba(255,142,35,0)}}
      @keyframes itechPinSpin{to{transform:rotate(360deg)}}
      #itechPinOverlay{position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at 15% 10%,rgba(35,87,153,.35),transparent 36%),rgba(5,15,35,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:Inter,Segoe UI,Arial,sans-serif;animation:itechPinFade .22s ease-out}
      #itechPinCard{position:relative;overflow:hidden;width:min(430px,100%);background:linear-gradient(145deg,#fff 0%,#f7faff 100%);color:#102448;border:1px solid rgba(255,255,255,.7);border-radius:26px;padding:30px 28px 26px;box-sizing:border-box;box-shadow:0 28px 90px rgba(0,0,0,.38);animation:itechPinRise .35s cubic-bezier(.2,.8,.2,1)}
      #itechPinCard:before{content:'';position:absolute;top:-85px;right:-65px;width:190px;height:190px;border:1px solid rgba(255,143,31,.24);border-radius:50%;box-shadow:0 0 0 18px rgba(255,143,31,.045),0 0 0 38px rgba(255,143,31,.03);pointer-events:none}
      #itechPinCard .itechPinMark{width:52px;height:52px;border-radius:17px;background:linear-gradient(145deg,#163e79,#071a39);display:flex;align-items:center;justify-content:center;color:#fff;font-size:25px;box-shadow:0 9px 22px rgba(15,49,99,.24);margin-bottom:17px;position:relative}
      #itechPinCard .itechPinMark:after{content:'';position:absolute;inset:-5px;border:1px solid rgba(255,145,35,.65);border-radius:20px;animation:itechPinGlow 2.2s infinite}
      #itechPinCard .itechPinBrand{font-weight:800;color:#163e79;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;position:relative}
      #itechPinCard h2{margin:0 0 8px;font-size:27px;letter-spacing:-.6px;color:#102448;position:relative}
      #itechPinCard p{margin:8px 0 20px;line-height:1.55;color:#64748b;font-size:14px;position:relative}
      #itechPinCard .itechPinRule{display:flex;gap:7px;align-items:center;margin:0 0 12px;color:#6b7a91;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      #itechPinCard .itechPinRule:before{content:'';width:22px;height:3px;border-radius:5px;background:#ff922b}
      #itechPinCard input{display:block;width:100%;box-sizing:border-box;border:1.5px solid #dbe4f0;border-radius:13px;padding:15px 14px;font-size:18px;letter-spacing:5px;margin:10px 0;background:#fff;color:#14284b;outline:none;transition:border-color .18s,box-shadow .18s;position:relative}
      #itechPinCard input:focus{border-color:#3979c7;box-shadow:0 0 0 4px rgba(57,121,199,.12)}
      #itechPinCard input::placeholder{font-size:13px;letter-spacing:2px;color:#9aa8bb}
      #itechPinCard button{width:100%;border:0;border-radius:13px;background:linear-gradient(100deg,#173f7a,#0b2450);color:#fff;font-weight:800;font-size:15px;padding:15px;margin-top:9px;cursor:pointer;box-shadow:0 8px 18px rgba(20,57,111,.2);transition:transform .18s,filter .18s;position:relative}
      #itechPinCard button:hover{filter:brightness(1.1);transform:translateY(-1px)}#itechPinCard button:active{transform:translateY(0)}#itechPinCard button:disabled{opacity:.65;cursor:wait}
      #itechPinError{color:#b42318;min-height:20px;font-size:13px;margin:9px 0 2px;line-height:1.4}
      #itechPinCard .itechPinFoot{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:16px;color:#7b8799;font-size:11px}
      #itechPinCard .itechPinFoot span{color:#ff922b;font-size:14px}
      @media(max-width:420px){#itechPinCard{padding:25px 20px 21px;border-radius:22px}#itechPinCard h2{font-size:24px}}
    `
    document.head.appendChild(style);
    overlay = document.createElement('div');
    overlay.id = 'itechPinOverlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `<section id="itechPinCard" role="dialog" aria-modal="true" aria-labelledby="itechPinTitle"><div class="itechPinMark" aria-hidden="true">🔐</div><div class="itechPinBrand">iTech IT Solutions</div><div class="itechPinRule">Secure access</div><h2 id="itechPinTitle"></h2><p id="itechPinNote"></p><form id="itechPinForm" autocomplete="off"><input id="itechPinInput" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="Enter 4-digit PIN" aria-label="PIN" required><div id="itechPinConfirmWrap"><input id="itechPinConfirm" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="Confirm 4-digit PIN" aria-label="Confirm PIN" required></div><div id="itechPinError" role="alert"></div><button id="itechPinSubmit" type="submit">Set PIN</button></form><div class="itechPinFoot"><span>●</span> Your workspace stays protected</div></section>`;
    document.body.appendChild(overlay);
    titleEl = overlay.querySelector('#itechPinTitle');
    noteEl = overlay.querySelector('#itechPinNote');
    pinInput = overlay.querySelector('#itechPinInput');
    confirmInput = overlay.querySelector('#itechPinConfirm');
    confirmWrap = overlay.querySelector('#itechPinConfirmWrap');
    errorEl = overlay.querySelector('#itechPinError');
    submitBtn = overlay.querySelector('#itechPinSubmit');
    overlay.querySelector('#itechPinForm').addEventListener('submit', submitPin);
    // Prevent Escape from dismissing the lock dialog.
    document.addEventListener('keydown', function (e) {
      if (locked && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  function show(modeName, message) {
    createUI();
    mode = modeName;
    locked = modeName === 'unlock';
    overlay.style.display = 'flex';
    confirmWrap.style.display = modeName === 'setup' ? 'block' : 'none';
    confirmInput.required = modeName === 'setup';
    titleEl.textContent = modeName === 'setup' ? 'Set Your PIN' : 'PIN Required';
    noteEl.textContent = modeName === 'setup'
      ? 'Create a 4-digit PIN. You will only need to set it once on this browser.'
      : 'This page was inactive for 30 minutes. Enter your PIN to continue.';
    submitBtn.textContent = modeName === 'setup' ? 'Set PIN' : 'Unlock Website';
    errorEl.textContent = message || '';
    pinInput.value = '';
    confirmInput.value = '';
    pinInput.autocomplete = 'new-password';
    confirmInput.autocomplete = 'new-password';
    setTimeout(() => pinInput.focus(), 50);
  }

  function hide() {
    if (overlay) overlay.style.display = 'none';
    locked = false;
    attempts = 0;
    lastActivity = Date.now();
  }

  async function submitPin(e) {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (!/^\d{4,8}$/.test(pin)) { errorEl.textContent = 'PIN must contain 4 to 8 digits.'; pinInput.focus(); return; }
    submitBtn.disabled = true;
    try {
      if (mode === 'setup') {
        if (pin !== confirmInput.value.trim()) { errorEl.textContent = 'PINs do not match. Please enter again.'; confirmInput.value = ''; confirmInput.focus(); return; }
        const hash = await digest(pin);
        if (!saveHash(hash)) { errorEl.textContent = 'Could not save PIN in this browser. Please enable site storage and try again.'; return; }
        hide();
        return;
      }
      const hash = await digest(pin);
      if (hash === storedHash()) { hide(); return; }
      attempts += 1;
      pinInput.value = '';
      if (attempts >= 2) {
        noteEl.textContent = 'PIN was entered incorrectly twice. Returning to Login Page…';
        errorEl.textContent = '';
        setTimeout(() => { window.location.replace(LOGIN_URL); }, 650);
      } else {
        errorEl.textContent = 'Incorrect PIN. Please enter it one more time.';
        pinInput.focus();
      }
    } catch (err) {
      errorEl.textContent = 'Unable to verify PIN. Please try again.';
    } finally {
      submitBtn.disabled = false;
    }
  }

  function activity() {
    if (!locked && overlay && overlay.style.display === 'none') lastActivity = Date.now();
  }

  async function start() {
    // Wait briefly for Supabase initialization on pages where scripts are loaded late.
    for (let i = 0; i < 50; i++) {
      if (window.sb && sb.auth && typeof sb.auth.getUser === 'function') break;
      await new Promise(r => setTimeout(r, 100));
    }
    if (!window.sb || !sb.auth || typeof sb.auth.getUser !== 'function') return;
    let result;
    try { result = await sb.auth.getUser(); } catch (_) { return; }
    const user = result && result.data && result.data.user;
    if (!user) return;
    let role = null;
    try {
      const profileResult = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
      role = profileResult && profileResult.data && profileResult.data.role;
    } catch (_) {}
    if (role !== 'admin' && role !== 'staff') return;
    userId = user.id;
    createUI();
    if (!storedHash()) show('setup');
    else hide();

    ['pointerdown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click'].forEach(evt =>
      document.addEventListener(evt, activity, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !locked && Date.now() - lastActivity >= IDLE_MS) show('unlock');
    });
    window.addEventListener('focus', () => {
      if (!locked && Date.now() - lastActivity >= IDLE_MS) show('unlock');
    });
    setInterval(() => {
      if (!locked && Date.now() - lastActivity >= IDLE_MS) show('unlock');
    }, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
