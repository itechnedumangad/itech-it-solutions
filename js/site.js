(() => {
  const C = window.APP_CONFIG || {};
  const key = C.SUPABASE_PUBLISHABLE_KEY || C.SUPABASE_ANON_KEY;
  const ready =
    C.SUPABASE_URL &&
    !C.SUPABASE_URL.startsWith("YOUR_") &&
    key &&
    !key.startsWith("YOUR_");

  const sb =
    ready && window.supabase
      ? window.supabase.createClient(C.SUPABASE_URL, key)
      : null;

  const $ = (s) => document.querySelector(s);

  // Single public-site mobile menu.
  // Reuses the existing #menu button so mobile never shows two menu buttons.
  const menuBtn = $("#menu");
  const nav = $("#nav");

  if (menuBtn && nav) {
    menuBtn.setAttribute("aria-expanded", "false");

    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("ui-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menuBtn.textContent = open ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("ui-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
        menuBtn.textContent = "☰";
      });
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("ui-open")) return;
      if (nav.contains(event.target) || menuBtn.contains(event.target)) return;
      nav.classList.remove("ui-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      menuBtn.textContent = "☰";
    });
  }

  $("#enquiryForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const o = $("#formStatus");

    if (!sb) {
      o.textContent = "Configure Supabase in js/config.js";
      return;
    }

    const d = Object.fromEntries(new FormData(e.target));
    const {
      data: { user }
    } = await sb.auth.getUser();

    if (user) {
      const { data: c } = await sb
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (c) d.customer_id = c.id;
    }

    const { error } = await sb.from("enquiries").insert(d);

    o.textContent = error
      ? "Error: " + error.message
      : "Enquiry submitted successfully.";

    if (!error) e.target.reset();
  });
})();
