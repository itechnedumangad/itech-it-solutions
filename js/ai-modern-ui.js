
(function(){
'use strict';
const nav=[
 ['Dashboard','dashboard.html','Overview & control panel'],['Customers','customers.html','Customer management'],['Daily Work','daily-work.html','Quick entries'],['Payments','payments.html','Payments'],['Reports','reports.html','Reports & analytics'],['Services','services.html','Service management'],['Products','products.html','Products'],['Insurance','vehicle-insurance.html','Vehicle insurance'],['Staff','staff-management.html','Staff management'],['Enquiries','enquiries.html','Customer enquiries'],['AMC','amc.html','AMC'],['Offers','offers.html','Offers'],['Our Works','works.html','Works'],['Messages','messages.html','Messages']
];
function pageType(){let p=location.pathname.toLowerCase();if(p.includes('/admin/'))return'Admin';if(p.includes('/staff/'))return'Staff';if(p.includes('/customer/'))return'Customer';return'Website'}
function relFor(target){let depth=(location.pathname.match(/\//g)||[]).length;return location.pathname.includes('/admin/')||location.pathname.includes('/staff/')||location.pathname.includes('/customer/')||location.pathname.includes('/pages/')?'../admin/'+target:'admin/'+target}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function addFooter(){if(document.querySelector('.ai-modern-footer'))return;let f=document.createElement('footer');f.className='ai-modern-footer';f.innerHTML='<strong>iTech IT Solutions</strong> · <span>AI Enhanced UI</span>';document.body.appendChild(f)}
function palette(){if(document.querySelector('.ai-palette'))return;let o=document.createElement('div');o.className='ai-palette';o.innerHTML='<div class="ai-box"><div class="ai-head"><h3>✦ iTech Smart Assistant</h3><p>Search pages, open tools, or use a quick command.</p><input class="ai-input" id="aiCommand" placeholder="Try: customers, reports, daily work…" autocomplete="off"></div><div class="ai-results" id="aiResults"></div></div>';document.body.appendChild(o);let input=o.querySelector('#aiCommand');function render(q=''){let a=nav.filter(x=>(x[0]+' '+x[2]).toLowerCase().includes(q.toLowerCase()));o.querySelector('#aiResults').innerHTML=a.map(x=>`<a class="ai-result" href="${relFor(x[1])}"><div>✦</div><div><b>${esc(x[0])}</b><span>${esc(x[2])}</span></div></a>`).join('')||'<div class="ai-result"><div>⌁</div><div><b>No matching tool</b><span>Try another command.</span></div></div>'}input.addEventListener('input',()=>render(input.value));o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')});window.openAIAssistant=()=>{o.classList.add('open');input.value='';render();setTimeout(()=>input.focus(),30)};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();window.openAIAssistant()}if(e.key==='Escape')o.classList.remove('open')})}
function orb(){let b=document.createElement('button');b.className='ai-orb';b.type='button';b.title='Open iTech Smart Assistant';b.innerHTML='✦';b.onclick=()=>window.openAIAssistant&&window.openAIAssistant();document.body.appendChild(b)}
function toast(msg){let t=document.querySelector('.ai-toast')||document.createElement('div');t.className='ai-toast';t.textContent=msg;if(!t.parentNode)document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>t.classList.remove('show'),1800)}
function enhanceHeader(){let h=document.querySelector('header');if(!h)return;h.classList.add('ai-modern-header');let title=pageType();if(pageType()==='Website')return;if(!h.querySelector('.ai-context-title')){let x=document.createElement('div');x.className='ai-context-title';x.style.cssText='margin-left:auto;margin-right:12px;color:#8fa8c5;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase';x.textContent=title;h.appendChild(x)} }
function animateNumbers(){document.querySelectorAll('.admin-stat strong,[data-count]').forEach(el=>{let raw=(el.textContent||'').replace(/[^0-9.]/g,'');let n=parseFloat(raw);if(!Number.isFinite(n)||n===0)return;let start=0,d=650,t0=performance.now();function step(t){let p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3),v=n*e;el.textContent=(el.textContent||'').includes('₹')?'₹'+v.toLocaleString('en-IN',{maximumFractionDigits:2}):Math.round(v).toLocaleString('en-IN');if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)})}
async function pointsForPreviousDay(){
  try{
    if(!window.sb || !window.sb.auth) return;
    const u=await window.sb.auth.getUser(); const uid=u?.data?.user?.id; if(!uid)return;
    const now=new Date(); const y=new Date(now); y.setDate(y.getDate()-1);
    const key=y.toLocaleDateString('en-CA'); const seenKey='itech_points_seen_'+key;
    if(localStorage.getItem(seenKey))return;
    const r=await window.sb.from('staff_points').select('points,point_type,description').eq('staff_id',uid).eq('work_date',key);
    if(r.error || !r.data?.length)return;
    const total=r.data.reduce((a,x)=>a+Number(x.points||0),0); if(total<=0)return;
    localStorage.setItem(seenKey,'1'); showPreviousPoints(total,r.data,key);
  }catch(e){}
}
function showPointsReward(points,type){
  const old=document.querySelector('.itech-points-overlay'); if(old)old.remove();
  const o=document.createElement('div');o.className='itech-points-overlay';o.innerHTML=`<div class="points-burst">✦</div><div class="points-kicker">WORK COMPLETED</div><div class="points-type">${esc(type||'Work')}</div><div class="points-plus">+${Number(points).toLocaleString('en-IN',{maximumFractionDigits:2})}</div><div class="points-label">POINTS EARNED</div>`;document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add('show'));setTimeout(()=>{o.classList.remove('show');setTimeout(()=>o.remove(),450)},2600);
}
function showPreviousPoints(total,rows,date){
  const o=document.createElement('div');o.className='itech-points-overlay previous';const items=rows.map(x=>`<span>${esc(x.point_type)} <b>+${Number(x.points).toLocaleString('en-IN',{maximumFractionDigits:2})}</b></span>`).join('');o.innerHTML=`<div class="points-burst">🏆</div><div class="points-kicker">YESTERDAY'S EARNINGS</div><div class="points-plus">${Number(total).toLocaleString('en-IN',{maximumFractionDigits:2})}</div><div class="points-label">TOTAL POINTS</div><div class="points-breakdown">${items}</div><button type="button" class="points-close">CONTINUE</button>`;document.body.appendChild(o);requestAnimationFrame(()=>o.classList.add('show'));o.querySelector('.points-close').onclick=()=>{o.classList.remove('show');setTimeout(()=>o.remove(),350)};setTimeout(()=>{if(o.isConnected){o.classList.remove('show');setTimeout(()=>o.remove(),350)}},6500);
}

async function addStaffPointsCard(){
  try{
    if(!location.pathname.toLowerCase().includes('/staff/') || !/dashboard\.html$/i.test(location.pathname)) return;
    if(!window.sb?.auth) return;
    const u=await window.sb.auth.getUser(), uid=u?.data?.user?.id; if(!uid)return;
    const today=new Date().toLocaleDateString('en-CA');
    const startMonth=today.slice(0,8)+'01';
    const r=await window.sb.from('staff_points').select('points,work_date').eq('staff_id',uid);
    if(r.error)return;
    const rows=r.data||[];
    const sum=a=>rows.reduce((n,x)=>n+Number(x.points||0),0);
    const todayPts=rows.filter(x=>x.work_date===today).reduce((n,x)=>n+Number(x.points||0),0);
    const monthPts=rows.filter(x=>x.work_date>=startMonth && x.work_date<=today).reduce((n,x)=>n+Number(x.points||0),0);
    const card=document.createElement('section'); card.className='dashboard-card itech-points-card';
    card.innerHTML=`<div class="itech-points-card-head"><div><div class="itech-points-mini">⭐ STAFF REWARDS</div><h2>My Points</h2><p>Points earned from eligible work and insurance updates.</p></div><div class="itech-points-total">${sum(rows).toLocaleString('en-IN',{maximumFractionDigits:2})}<small>Total</small></div></div><div class="itech-points-stats"><div><b>${todayPts.toLocaleString('en-IN',{maximumFractionDigits:2})}</b><span>Today</span></div><div><b>${monthPts.toLocaleString('en-IN',{maximumFractionDigits:2})}</b><span>This month</span></div><div><b>${rows.length}</b><span>Rewards</span></div></div>`;
    const main=document.querySelector('main'); const first=main?.querySelector('.kpis'); if(first) first.insertAdjacentElement('afterend',card); else main?.prepend(card);
  }catch(e){console.warn('Points card:',e)}
}

window.itechShowPointsReward=showPointsReward;
window.addEventListener('itech-points-updated',()=>{document.querySelector('.itech-points-card')?.remove(); addStaffPointsCard();});
setTimeout(pointsForPreviousDay,1100);

function init(){document.body.classList.add('ai-modern');enhanceHeader();if(pageType()!=='Website'){addFooter();palette();orb();}animateNumbers();addStaffPointsCard();document.querySelectorAll('main,section,.section-card').forEach((x,i)=>{x.style.animationDelay=Math.min(i*35,300)+'ms'});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
