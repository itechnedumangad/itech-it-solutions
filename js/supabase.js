(() => {
  const cfg = window.APP_CONFIG || {};
  if (!window.supabase) {
    console.error("Supabase JS library is not loaded.");
    return;
  }
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.startsWith("YOUR_") ||
      !cfg.SUPABASE_PUBLISHABLE_KEY || cfg.SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_")) {
    console.warn("Supabase is not configured. Add the Publishable Key in js/config.js.");
    return;
  }
  window.sb = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_PUBLISHABLE_KEY
  );
})();
