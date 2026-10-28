/* Module access guard (CCTV + Computer Sales).
   The original file was missing from the project, so these pages were open to anyone.
   This version fails closed: only a signed-in admin or staff account may view the page.
   It uses the same session and profiles.role check as js/auth.js.
   Replace it with your original file if you have one with finer per-staff permissions. */
(function(){
  "use strict";
  var el=document.currentScript||[].slice.call(document.scripts).filter(function(s){return /module-access-guard\.js/.test(s.src)})[0];
  var base=el&&el.src?el.src.replace(/js\/module-access-guard\.js.*$/,""):"/";
  var login=base+"pages/login.html";
  var root=document.documentElement;
  root.style.visibility="hidden";
  function deny(){location.replace(login)}
  var timer=setTimeout(deny,10000);
  function check(){
    if(!window.sb){deny();return}
    window.sb.auth.getSession().then(function(r){
      var session=r&&r.data&&r.data.session;
      if(!session){deny();return}
      return window.sb.from("profiles").select("role").eq("id",session.user.id).single().then(function(p){
        var role=p&&p.data&&p.data.role;
        if(role==="admin"||role==="staff"){clearTimeout(timer);root.style.visibility=""}
        else if(role==="customer")location.replace(base+"customer/dashboard.html");
        else deny();
      });
    }).catch(deny);
  }
  check();
})();
