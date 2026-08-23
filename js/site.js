(() => {
  const C = window.APP_CONFIG || {};
  const key = C.SUPABASE_PUBLISHABLE_KEY || C.SUPABASE_ANON_KEY;
  const ready = C.SUPABASE_URL && !C.SUPABASE_URL.startsWith("YOUR_") && key && !key.startsWith("YOUR_");
  const sb = ready && window.supabase ? window.supabase.createClient(C.SUPABASE_URL, key) : null;
  const $ = s => document.querySelector(s);
  $("#menu")?.addEventListener("click", () => { const n=$("#nav"); if(n) n.style.display=n.style.display==="flex"?"none":"flex"; });
  $("#enquiryForm")?.addEventListener("submit", async e => {
    e.preventDefault(); const o=$("#formStatus");
    if(!sb){ o.textContent="Configure Supabase in js/config.js"; return; }
    const d=Object.fromEntries(new FormData(e.target));
    const {data:{user}}=await sb.auth.getUser();
    if(user){
      const {data:c}=await sb.from("customers").select("id").eq("auth_user_id",user.id).maybeSingle();
      if(c) d.customer_id=c.id;
    }
    const {error}=await sb.from("enquiries").insert(d);
    o.textContent=error?"Error: "+error.message:"Enquiry submitted successfully.";
    if(!error)e.target.reset();
  });
})();
