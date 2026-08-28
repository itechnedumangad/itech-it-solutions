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


/* iTech public-site responsive navigation polish */
document.addEventListener("DOMContentLoaded",function(){
  const header=document.querySelector("header");
  if(!header) return;
  const nav=header.querySelector("nav");
  if(!nav || document.getElementById("itechPublicMenu")) return;

  const links=nav.querySelectorAll("a");
  if(!links.length) return;

  const btn=document.createElement("button");
  btn.id="itechPublicMenu";
  btn.type="button";
  btn.setAttribute("aria-label","Open navigation");
  btn.innerHTML="☰";
  btn.style.cssText="display:none;border:0;background:transparent;font-size:24px;color:inherit;cursor:pointer;padding:8px";

  header.appendChild(btn);

  const css=document.createElement("style");
  css.textContent=`
    @media(max-width:760px){
      header{position:relative}
      #itechPublicMenu{display:block!important}
      header nav{display:none!important;position:absolute!important;left:12px!important;right:12px!important;top:calc(100% + 8px)!important;z-index:1000!important;padding:10px!important;border-radius:14px!important;background:#fff!important;box-shadow:0 18px 40px rgba(7,28,59,.16)!important}
      header nav.ui-open{display:flex!important;flex-direction:column!important}
      header nav a{width:100%!important;padding:11px 12px!important}
    }
  `;
  document.head.appendChild(css);

  btn.addEventListener("click",function(){
    nav.classList.toggle("ui-open");
    btn.innerHTML=nav.classList.contains("ui-open")?"×":"☰";
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("ui-open")));
});
