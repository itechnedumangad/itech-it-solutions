/* Central CCTV module permission guard.
   Staff permissions are verified server-side by the staff-management Edge Function.
   Admins retain access. This client guard protects page navigation/UI; database RLS
   must separately protect write operations on underlying business tables. */
(function () {
  "use strict";
  const script = document.currentScript || Array.from(document.scripts).find(s => /module-access-guard\.js/.test(s.src));
  const base = script && script.src ? script.src.replace(/js\/module-access-guard\.js.*$/, "") : "/";
  const login = base + "pages/login.html";
  const root = document.documentElement;
  root.style.visibility = "hidden";
  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) location.replace(login);
  }, 12000);

  function showDenied(message) {
    finished = true;
    clearTimeout(timeout);
    root.style.visibility = "";
    document.body.innerHTML = `<main style="font:16px system-ui;padding:30px"><h2>Access restricted</h2><p>${message}</p><a href="${base}staff/dashboard.html">Return to Staff Dashboard</a></main>`;
  }

  function applyReadOnly() {
    const banner = document.createElement("div");
    banner.textContent = "View Only access — editing controls are disabled.";
    banner.style.cssText = "margin:12px;padding:11px 14px;border:1px solid #f4d7a5;background:#fff8eb;color:#8a4a00;border-radius:10px;font:700 13px system-ui";
    document.body.prepend(banner);
    const words = /^(add|create|save|submit|update|edit|delete|remove|approve|reject|assign|pay|record|upload|send|confirm|close|disable|enable)\b/i;
    const allow = /(refresh|reload|print|export|search|filter|clear filters|back|logout|close|cancel|view|details|download)/i;
    const apply = node => {
      if (!(node instanceof Element)) return;
      node.querySelectorAll("button,input[type=submit],input[type=button]").forEach(el => {
        const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim();
        const normalizedLabel = label.replace(/^[^\p{L}\p{N}]+/u, "");
        if (!allow.test(normalizedLabel) && (words.test(normalizedLabel) || el.type === "submit")) {
          el.disabled = true; el.title = "Disabled: View Only permission.";
        }
      });
      node.querySelectorAll("form input:not([type=hidden]),form select,form textarea").forEach(el => el.disabled = true);
    };
    apply(document);
    new MutationObserver(rs => rs.forEach(r => r.addedNodes.forEach(apply))).observe(document.body, {childList:true,subtree:true});
  }

  async function check() {
    try {
      if (!window.sb || !window.APP_CONFIG) throw new Error("Supabase configuration is unavailable.");
      const { data: { session } } = await window.sb.auth.getSession();
      if (!session) { location.replace(login); return; }
      const { data: profile, error } = await window.sb.from("profiles").select("role,status").eq("id", session.user.id).single();
      if (error || !profile) { location.replace(login); return; }
      if (profile.role === "admin") {
        finished = true; clearTimeout(timeout); root.style.visibility = ""; return;
      }
      if (profile.role !== "staff" || profile.status === "disabled") {
        showDenied("This account is not permitted to access CCTV."); return;
      }
      const cfg = window.APP_CONFIG;
      const response = await fetch(`${cfg.SUPABASE_URL}/functions/v1/staff-management`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}`, "apikey": cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "my_permissions" })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to verify permissions.");
      const level = result.permissions?.cctv || "no_access";
      if (level === "no_access") { showDenied("Your administrator has not granted CCTV access."); return; }
      finished = true; clearTimeout(timeout); root.style.visibility = "";
      if (level === "view_only") applyReadOnly();
    } catch (e) {
      console.error("CCTV permission check failed", e);
      showDenied(e.message || "Permission verification failed. Please contact the administrator.");
    }
  }
  check();
})();
