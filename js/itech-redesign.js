/* iTech Console theme v2: dark/light toggle, adaptive logo, reveal motion, mobile nav. Touches no data or auth code. */
(function(){
"use strict";
var root=document.documentElement,KEY="itech-theme";
function stored(){try{return localStorage.getItem(KEY)}catch(e){return null}}
function sysDark(){return !!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)}
function current(){return stored()||(sysDark()?"dark":"light")}
function apply(t){root.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#0c1630":"#edf0f7")}
apply(current());
var LIGHT_LOGO="itech-logo-color.png",DARK_LOGO="itech-logo.png";
function lum(r,g,b){var a=[r,g,b].map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function parseColors(s){var out=[],re=/rgba?\(([^)]+)\)/g,m;while((m=re.exec(s))){var p=m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);out.push({r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1})}return out}
function ownLum(el){var cs=getComputedStyle(el),cols=[];
 if(cs.backgroundImage&&cs.backgroundImage!=="none")cols=parseColors(cs.backgroundImage).filter(function(c){return c.a>.5});
 if(!cols.length){var c=parseColors(cs.backgroundColor)[0];if(c&&c.a>.5)cols=[c]}
 if(!cols.length)return null;var t=0;cols.forEach(function(c){t+=lum(c.r,c.g,c.b)});return t/cols.length}
function surfaceLum(el){for(var n=el;n;n=n.parentElement){var l=ownLum(n);if(l!==null)return l}return 1}
/* Logo: choose by the ORIGINAL surface colour. The dark filter then flips light-surface logos correctly. */
function fixLogos(){document.querySelectorAll("img").forEach(function(img){
 var m=(img.getAttribute("src")||"").match(/^(.*?)(itech-logo(?:-color)?\.png)(.*)$/);if(!m)return;
 img.setAttribute("data-rd-logo","1");
 var want=surfaceLum(img)<.38?DARK_LOGO:LIGHT_LOGO;
 if(m[2]!==want)img.setAttribute("src",m[1]+want+m[3])})}
/* Surfaces that are dark by design (headers, heroes, footers, active chips) keep their look in dark mode. */
var KEEP="header,footer,aside,.hero,[class*=hero],.btn,.badge,.eyebrow,.user-chip,.icon-btn,.metric-icon,.qicon,.activity-icon,.toast,.rd-bnav,.rd-bnav a.on,.mobile-nav a.active,.mobile-nav a.on,.sidebar a.active,.nav-link.active,.dash-header,.topbar,.top,.site-footer,.unified-site-footer,.footer,section,.card,.panel";
function markKeep(){document.querySelectorAll(KEEP).forEach(function(el){
 if(el.classList.contains("rd-keep")||el.parentElement&&el.parentElement.closest(".rd-keep"))return;
 var l=ownLum(el);if(l!==null&&l<.28)el.classList.add("rd-keep")})}
function reveal(){var sel=".metric,.stat-card,.quick-action,.panel,.card,.shortcut,.workflow-steps a,.detail-box";
 var els=[].slice.call(document.querySelectorAll(sel)).filter(function(e){return e.getBoundingClientRect().top>innerHeight*.9});
 if(!("IntersectionObserver"in window)||!els.length)return;
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("rd-show");io.unobserve(e.target)}})},{rootMargin:"0px 0px -6% 0px"});
 els.forEach(function(e,i){e.style.setProperty("--rd-i",i%6);e.classList.add("rd-pre");io.observe(e)});
 setTimeout(function(){els.forEach(function(e){e.classList.add("rd-show")})},700)}
function wrapTables(){document.querySelectorAll("table").forEach(function(t){var p=t.parentElement;
 if(!p||p.classList.contains("rd-scroll")||/(auto|scroll)/.test(getComputedStyle(p).overflowX))return;
 var w=document.createElement("div");w.className="rd-scroll";p.insertBefore(w,t);w.appendChild(t)})}
function bottomNav(){
 if(document.querySelector(".mobile-nav,.rd-bnav"))return;
 var side=document.querySelector(".sidebar,aside[data-nav]"),links=side?[].slice.call(side.querySelectorAll("a[href]")):[];
 if(links.length<3)return;
 var here=location.pathname.split("/").pop()||"index.html",DEF=["⌂","◎","✎","₹","▤"];
 var items=links.map(function(a){var raw=a.textContent.trim().replace(/\s+/g," "),m=raw.match(/^[^\w\s]+/u);
  return{href:a.getAttribute("href"),label:raw.replace(/^[^\w]+/u,"").replace(/^\+\s*/,""),ic:m?m[0]:null,on:(a.getAttribute("href")||"").split("/").pop().split("?")[0]===here}});
 var main=items.slice(0,4),cur=items.filter(function(i){return i.on})[0];if(cur&&main.indexOf(cur)<0)main[3]=cur;
 var nav=document.createElement("nav");nav.className="rd-bnav";nav.setAttribute("aria-label","Mobile navigation");
 main.forEach(function(i,k){var a=document.createElement("a");a.href=i.href;if(i.on)a.className="on";a.innerHTML="<span></span><i></i>";a.firstChild.textContent=i.ic||DEF[k];a.lastChild.textContent=i.label;nav.appendChild(a)});
 var more=document.createElement("button");more.type="button";more.setAttribute("aria-label","More pages");more.innerHTML="<span>☰</span><i>More</i>";nav.appendChild(more);
 var sheet=document.createElement("div");sheet.className="rd-more";
 sheet.innerHTML='<div class="scrim"></div><div class="sheet" role="dialog" aria-label="All pages"><div class="grab"></div><div class="grid"></div></div>';
 var grid=sheet.querySelector(".grid");
 items.forEach(function(i){var a=document.createElement("a");a.href=i.href;if(i.on)a.className="on";a.textContent=(i.ic?i.ic+" ":"")+i.label;grid.appendChild(a)});
 function tg(o){sheet.classList.toggle("open",o)}
 more.addEventListener("click",function(){tg(!sheet.classList.contains("open"))});
 sheet.querySelector(".scrim").addEventListener("click",function(){tg(false)});
 document.addEventListener("keydown",function(e){if(e.key==="Escape")tg(false)});
 document.body.appendChild(nav);document.body.appendChild(sheet);document.body.classList.add("rd-has-bnav")}
var SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><g class="sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g><path class="moon" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function setTheme(t,x,y){
 var go=function(){apply(t);try{localStorage.setItem(KEY,t)}catch(e){}};
 var calm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(!document.startViewTransition||calm){go();return}
 var tr=document.startViewTransition(go);
 tr.ready.then(function(){var r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  root.animate({clipPath:["circle(0px at "+x+"px "+y+"px)","circle("+r+"px at "+x+"px "+y+"px)"]},{duration:560,easing:"cubic-bezier(.4,0,.2,1)",pseudoElement:"::view-transition-new(root)"})}).catch(function(){})}
function themeButton(){
 var b=document.createElement("button");b.type="button";b.className="rd-theme";b.innerHTML=SVG;
 function label(){b.setAttribute("aria-label",current()==="dark"?"Switch to light theme":"Switch to dark theme")}label();
 b.addEventListener("click",function(){var r=b.getBoundingClientRect();setTheme(current()==="dark"?"light":"dark",r.left+r.width/2,r.top+r.height/2);setTimeout(label,50)});
 var host=document.querySelector(".header-actions,.top-actions")||document.querySelector("header.top,header.dash-header,header.topbar");
 if(host&&host.tagName!=="NAV"){host.insertBefore(b,host.firstChild)}else{b.classList.add("fab");document.body.appendChild(b)}}
function progress(){var p=document.createElement("div");p.className="rd-prog";document.body.appendChild(p);
 var tick=0;function upd(){tick=0;var h=document.documentElement.scrollHeight-innerHeight;p.style.transform="scaleX("+(h>0?Math.min(1,scrollY/h):0)+")";document.body.classList.toggle("rd-scrolled",scrollY>8)}
 addEventListener("scroll",function(){if(!tick)tick=requestAnimationFrame(upd)},{passive:true});upd()}
function ripple(){document.addEventListener("pointerdown",function(e){var b=e.target.closest&&e.target.closest(".btn");if(!b)return;
 var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),d=document.createElement("span");d.className="rd-ripple";
 d.style.cssText="width:"+s+"px;height:"+s+"px;left:"+(e.clientX-r.left-s/2)+"px;top:"+(e.clientY-r.top-s/2)+"px";
 b.appendChild(d);setTimeout(function(){d.remove()},650)})}
function init(){fixLogos();markKeep();wrapTables();bottomNav();themeButton();progress();ripple();reveal();markKeep();
 if(window.matchMedia){var mq=matchMedia("(prefers-color-scheme: dark)");var h=function(){if(!stored())apply(current())};if(mq.addEventListener)mq.addEventListener("change",h)}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
addEventListener("load",function(){fixLogos();markKeep()});
})();
