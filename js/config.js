window.APP_CONFIG = {
  SUPABASE_URL: "https://qllprfglsnkpvgqilhze.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_BjgtqhMLpDYTLMLjmQWflg_KxTiH_dW"
};
// Alias: permission code (auth.js, module-access-guard.js, staff-management.html) reads SUPABASE_ANON_KEY.
window.APP_CONFIG.SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY || window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY;
