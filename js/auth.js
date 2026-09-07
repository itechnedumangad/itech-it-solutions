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

// Pages available to both Admin and Staff
async function requireStaff() {
  const auth = await getCurrentProfile();
  if (!auth) return null;
  if (!["admin", "staff"].includes(auth.profile.role)) {
    if (auth.profile.role === "customer") location.href = "../customer/dashboard.html";
    else { await sb.auth.signOut(); location.href = "../pages/login.html"; }
    return null;
  }
  return auth;
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
