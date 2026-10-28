/* iTech public service tracking. Uses the existing Supabase config and a restricted RPC. */
(function(){
  const form=document.getElementById('serviceTrackForm'); if(!form)return;
  const input=document.getElementById('serviceTrackJobId');
  const button=document.getElementById('serviceTrackButton');
  const message=document.getElementById('serviceTrackMessage');
  const result=document.getElementById('serviceTrackResult');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function date(v){if(!v)return 'Not available';const d=new Date(v);return isNaN(d)?String(v):d.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});}
  function client(){
    const configs=[window.APP_CONFIG,window.SUPABASE_CONFIG,window.supabaseConfig,window.config].filter(Boolean);
    let url=window.SUPABASE_URL||'',key=window.SUPABASE_ANON_KEY||window.SUPABASE_PUBLISHABLE_KEY||'';
    configs.forEach(c=>{url=url||c.SUPABASE_URL||c.supabaseUrl||c.url||'';key=key||c.SUPABASE_ANON_KEY||c.SUPABASE_PUBLISHABLE_KEY||c.supabaseKey||c.anonKey||'';});
    if(!url||!key||!window.supabase)throw Error('Supabase config ലഭ്യമല്ല. js/config.js പരിശോധിക്കുക.');
    return window.supabase.createClient(url,key);
  }
  function render(j){
    const hist=Array.isArray(j.status_history)?j.status_history:[];
    const history=hist.length?hist.map(h=>`<li><strong>${esc(h.status||h.new_status||'Status update')}</strong>${h.at||h.created_at?`<br><small>${esc(date(h.at||h.created_at))}</small>`:''}${h.note||h.notes?`<p>${esc(h.note||h.notes)}</p>`:''}</li>`).join(''):'<li>No additional history recorded.</li>';
    result.innerHTML=`<h3>Service Details</h3><p>Job ID: <strong>${esc(j.job_number)}</strong></p><p>Current Status: <span class="service-track-status">${esc(j.status||'Received')}</span></p><div class="service-track-grid"><div class="service-track-item"><small>Device</small><strong>${esc(j.device_type||'Not specified')}</strong></div><div class="service-track-item"><small>Brand / Model</small><strong>${esc([j.brand,j.model].filter(Boolean).join(' ')||'Not specified')}</strong></div><div class="service-track-item"><small>Received</small><strong>${esc(date(j.created_at))}</strong></div><div class="service-track-item"><small>Last Updated</small><strong>${esc(date(j.updated_at))}</strong></div></div><h3>Status History</h3><ol class="service-track-history">${history}</ol>`;
    result.hidden=false;
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();const id=input.value.trim();if(!id)return;
    button.disabled=true;button.textContent='Searching...';result.hidden=true;message.classList.remove('error');message.textContent='Checking service details...';
    try{const {data,error}=await client().rpc('public_track_service_job',{p_job_number:id});if(error)throw error;
      if(!data||!data.job_number){message.textContent='ഈ Job ID കണ്ടെത്താനായില്ല. ID പരിശോധിക്കുക.';message.classList.add('error');return;}
      render(data);message.textContent='Service details ലഭിച്ചു.';
    }catch(err){console.error('Service tracking:',err);message.textContent='വിവരങ്ങൾ ലഭിച്ചില്ല. Supabase SQL function, config, permissions പരിശോധിക്കുക.';message.classList.add('error');}
    finally{button.disabled=false;button.textContent='Track Service';}
  });
})();
