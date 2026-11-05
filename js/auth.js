async function getCurrentProfile() {
  if (!window.sb) {
    showStatus("Supabase is not configured. Add the Publishable Key in js/config.js.", true);
    return null;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "../pages/login.html";
    return null;
  }
  const { data: profile, error } = await sb.from("profiles")
    .select("id, full_name, mobile, role")
    .eq("id", session.user.id)
    .single();
  if (error || !profile) {
    await sb.auth.signOut();
    location.href = "../pages/login.html";
    return null;
  }
  document.querySelectorAll("[data-admin-name]").forEach(el => {
    el.textContent = profile.full_name || session.user.email;
  });
  return { session, profile };
}

// Admin-only pages
async function requireAdmin() {
  const auth = await getCurrentProfile();
  if (!auth) return null;
  if (auth.profile.role !== "admin") {
    if (auth.profile.role === "staff") location.href = "../staff/dashboard.html";
    else { await sb.auth.signOut(); location.href = "../pages/login.html"; }
    return null;
  }
  return auth;
}

// ------------------------------------------------------------
// Per-staff module permissions (server-resolved through Edge Function)
// ------------------------------------------------------------
const STAFF_MODULE_ROUTES = {
  "dashboard.html": "dashboard",
  "points.html": "points",
  "customers.html": "customers",
  "customer-profile.html": "customers",
  "add-customer.html": "add-customer",
  "daily-work.html": "daily-work",
  "court-copy.html": "court-copy",
  "payments.html": "payments",
  "reports.html": "reports",
  "customer-reports.html": "reports",
  "customer-bill.html": "customer-bill",
  "services.html": "services",
  "products.html": "products",
  "vehicle-insurance.html": "vehicle-insurance",
  "enquiries.html": "enquiries",
  "amc.html": "amc",
  "offers.html": "offers",
  "works.html": "works",
  "messages.html": "messages"
};

async function getStaffPermissionSnapshot(session, profile) {
  if (profile.role === "admin") {
    const full = {};
    Object.values(STAFF_MODULE_ROUTES).forEach(k => full[k] = "full_access");
    full.cctv = "full_access";
    return { permissions: full, isAdmin: true };
  }
  const cfg = window.APP_CONFIG || {};
  const apiKey = cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_PUBLISHABLE_KEY;
  if (!cfg.SUPABASE_URL || !apiKey) {
    throw new Error("Supabase configuration is missing.");
  }
  const response = await fetch(`${cfg.SUPABASE_URL}/functions/v1/staff-management`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action: "my_permissions" })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.error || result.message || "Unable to verify staff permissions.");
  }
  return { permissions: result.permissions || {}, isAdmin: false };
}

function currentStaffModuleKey() {
  const path = (location.pathname || "").toLowerCase();
  const file = path.split("/").pop() || "dashboard.html";
  if (path.includes("/cctv/")) return "cctv";
  return STAFF_MODULE_ROUTES[file] || "dashboard";
}

function applyStaffNavigationPermissions(permissions) {
  document.querySelectorAll(".sidebar nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const file = href.split("?")[0].split("#")[0].split("/").pop();
    let key = STAFF_MODULE_ROUTES[file];
    if (href.includes("/cctv/") || file === "index.html" && href.includes("cctv")) key = "cctv";
    if (key && (permissions[key] || "no_access") === "no_access") {
      a.hidden = true;
      a.setAttribute("aria-hidden", "true");
    }
  });
}

function applyStaffViewOnlyMode() {
  if (window.STAFF_ACCESS_LEVEL !== "view_only") return;
  if (!document.getElementById("staffViewOnlyNotice")) {
    const notice = document.createElement("div");
    notice.id = "staffViewOnlyNotice";
    notice.textContent = "View Only access — editing and submission controls are disabled for this module.";
    notice.style.cssText = "margin:12px 0;padding:11px 14px;border:1px solid #f4d7a5;background:#fff8eb;color:#8a4a00;border-radius:10px;font:700 13px system-ui";
    const main = document.querySelector("main");
    if (main) main.prepend(notice);
  }
  const mutationWords = /^(add|create|save|submit|update|edit|delete|remove|approve|reject|assign|award|pay|record|upload|send|confirm|renew|close|disable|enable)\b/i;
  const allowedWords = /(refresh|reload|print|export|search|filter|clear filters|back|logout|close|cancel|view|details|download|next|previous|page \d+)/i;
  const inspect = node => {
    if (!(node instanceof Element)) return;
    node.querySelectorAll("button,input[type=submit],input[type=button]").forEach(el => {
      const label = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim();
      const normalizedLabel = label.replace(/^[^\p{L}\p{N}]+/u, "");
      if (allowedWords.test(normalizedLabel)) return;
      if (mutationWords.test(normalizedLabel) || el.type === "submit") {
        el.disabled = true;
        el.setAttribute("aria-disabled", "true");
        el.title = "Disabled: this module is View Only.";
      }
    });
    node.querySelectorAll("form").forEach(form => {
      form.querySelectorAll("input:not([type=hidden]),select,textarea").forEach(el => {
        if (el.dataset.allowViewOnly === "true") return;
        el.disabled = true;
      });
    });
  };
  inspect(document);
  if (!window.__staffViewOnlyObserver) {
    window.__staffViewOnlyObserver = new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(n => inspect(n))));
    window.__staffViewOnlyObserver.observe(document.body, { childList: true, subtree: true });
  }
}

// Pages available to both Admin and Staff
async function requireStaff() {
  const auth = await getCurrentProfile();
  if (!auth) return null;
  if (!["admin", "staff"].includes(auth.profile.role)) {
    if (auth.profile.role === "customer") location.href = "../customer/dashboard.html";
    else { await sb.auth.signOut(); location.href = "../pages/login.html"; }
    return null;
  }
  try {
    const snapshot = await getStaffPermissionSnapshot(auth.session, auth.profile);
    const key = currentStaffModuleKey();
    const level = snapshot.isAdmin ? "full_access" : (snapshot.permissions[key] || "no_access");
    if (level === "no_access") {
      const target = location.pathname.includes("/staff/") ? "dashboard.html" : "../staff/dashboard.html";
      if (!location.pathname.toLowerCase().endsWith("/dashboard.html")) {
        location.replace(target);
      } else {
        document.body.innerHTML = '<main style="font:16px system-ui;padding:30px"><h2>Access restricted</h2><p>You do not have permission to open this module. Contact your administrator.</p><a href="dashboard.html">Return to Dashboard</a></main>';
      }
      return null;
    }
    window.STAFF_PERMISSIONS = snapshot.permissions;
    window.STAFF_ACCESS_LEVEL = level;
    window.STAFF_CURRENT_MODULE = key;
    applyStaffNavigationPermissions(snapshot.permissions);
    if (level === "view_only") {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyStaffViewOnlyMode, { once: true });
      else applyStaffViewOnlyMode();
    }
    return auth;
  } catch (error) {
    console.error("Staff permission verification failed:", error);
    showStatus(error.message || "Unable to verify staff permissions.", true);
    return null; // fail closed
  }
}

async function requireCustomer() {
  if (!window.sb) {
    showStatus("Supabase is not configured. Add the Publishable Key in js/config.js.", true);
    return null;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "../pages/login.html";
    return null;
  }
  const { data: profile, error } = await sb.from("profiles")
    .select("id, full_name, mobile, role")
    .eq("id", session.user.id)
    .single();

  if (error || !profile || profile.role !== "customer") {
    if (profile && profile.role === "admin") {
      location.href = "../admin/dashboard.html";
    } else if (profile && profile.role === "staff") {
      location.href = "../staff/dashboard.html";
    } else {
      await sb.auth.signOut();
      location.href = "../pages/login.html";
    }
    return null;
  }
  return { session, profile };
}

async function logout() {
  if (window.sb) await sb.auth.signOut();
  location.href = "../pages/login.html";
}

function showStatus(text, isError = false) {
  const el = document.querySelector("[data-status]");
  if (el) {
    el.textContent = text;
    el.className = "status " + (isError ? "error" : "success");
  }
}

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-logout]");
  if (btn) {
    e.preventDefault();
    logout();
  }
});


/* iTech idle PIN lock: centrally loaded for admin/staff pages. */
(function loadItechIdlePinLockOnce() {
  if (window.__itechIdlePinLockLoaderStarted) return;
  window.__itechIdlePinLockLoaderStarted = true;
  const path = window.location.pathname || '';
  if (!/(^|\/)\b(admin|staff)\//i.test(path)) return;
  const current = document.currentScript;
  const base = current && current.src ? new URL('.', current.src).href : new URL('../js/', window.location.href).href;
  const script = document.createElement('script');
  script.src = new URL('idle-pin-lock.js?v=20261013-2', base).href;
  script.defer = true;
  document.head.appendChild(script);
})();
