
(function(){
  function ensureOverlay(){
    let o=document.getElementById('itechPointsRewardOverlay');
    if(o) return o;
    o=document.createElement('div');
    o.id='itechPointsRewardOverlay';
    o.setAttribute('role','dialog');
    o.setAttribute('aria-modal','true');
    o.innerHTML='<div class="ipr-card"><div class="ipr-star">⭐</div><div class="ipr-title">Points Earned!</div><div class="ipr-points" id="itechRewardPoints">+0</div><div class="ipr-sub" id="itechRewardType">Great work!</div></div>';
    document.body.appendChild(o);
    return o;
  }
  window.itechShowPointsReward=function(points,type){
    const o=ensureOverlay();
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    document.getElementById('itechRewardPoints').textContent='+'+Number(points||0).toFixed(2).replace(/\.00$/,'')+' pts';
    document.getElementById('itechRewardType').textContent=type||'Great work!';
    o.classList.add('is-open');
    clearTimeout(window.__itechRewardTimer);
    window.__itechRewardTimer=setTimeout(function(){
      o.classList.remove('is-open');
      document.documentElement.style.overflow='';
      document.body.style.overflow='';
    },2500);
  };
})();
