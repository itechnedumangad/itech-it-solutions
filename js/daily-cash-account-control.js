/* iTech Daily Cash / Account Control — additive module
   Existing daily_work_entries, payments and customer records are not modified/deleted. */
(function(){
  const sb = window.sb || window.supabaseClient;
  if(!sb) return;
  const $ = id => document.getElementById(id);
  const money = n => '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc = v => String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const today = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  // Existing entries for 28-09-2026 must remain fully usable. The new day-control
  // enforcement starts from 29-09-2026 (the next day after the current setup).
  const CONTROL_START_DATE = '2026-09-29';
  const isControlActive = (date=today()) => date >= CONTROL_START_DATE;
  window.itechQuickPaymentMethod = () => document.querySelector('input[name="itechPaidMode"]:checked')?.value || document.getElementById('itechPaidToggle')?.dataset?.mode || 'Cash';
  const userId = async()=>{ try{return (await sb.auth.getUser()).data?.user?.id||null}catch(_){return null} };

  async function rpcAutoClose(){ try{ await sb.rpc('itech_auto_close_stale_days'); }catch(e){ console.warn('Daily auto-close:',e?.message||e); } }

  function injectStyles(){
    if(document.getElementById('itech-day-control-style')) return;
    const s=document.createElement('style'); s.id='itech-day-control-style'; s.textContent=`
      .itech-day-control{margin:0 0 16px;padding:18px;border:1px solid #dbe7f5;border-radius:16px;background:linear-gradient(135deg,#f7fbff,#fff);box-shadow:0 8px 24px rgba(16,40,75,.06)}
      .itech-day-control h3{margin:0 0 5px;color:#10284b;font-size:18px}.itech-day-control p{margin:0 0 14px;color:#687a91;font-size:12px}
      .itech-day-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.itech-day-field label{display:block;font-size:11px;font-weight:800;color:#53677f;margin-bottom:6px}.itech-day-field input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cfdbeb;border-radius:10px;font-weight:700;font-size:15px}
      .itech-day-actions{margin-top:13px;display:flex;gap:9px;flex-wrap:wrap}.itech-day-btn{border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.itech-day-start{background:#175cd3;color:#fff}.itech-day-close{background:#0b7a4b;color:#fff}.itech-day-disabled{opacity:.65}
      .itech-day-status{margin-top:10px;font-size:12px;font-weight:700}.itech-day-open{color:#087443}.itech-day-closed{color:#b42318}.itech-day-auto{color:#9a6700}
      .itech-cash-management{margin:14px 0 0;padding:14px;border:1px solid #e2e9f2;border-radius:14px;background:#fbfdff}.itech-cash-title{font-size:13px;font-weight:900;color:#10284b;margin-bottom:10px}.itech-cash-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.itech-cash-box{border:1px solid #dbe4ef;border-radius:11px;padding:10px;background:#fff}.itech-cash-box label{display:block;font-size:10px;font-weight:900;color:#61748c;margin-bottom:6px}.itech-cash-box input,.itech-cash-box select{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d4deea;border-radius:8px}.itech-cash-box button{width:100%;margin-top:7px;border:0;border-radius:8px;padding:9px;font-weight:800;cursor:pointer;background:#edf4ff;color:#174ea6}.itech-day-locked{display:none}
      .itech-paid-inline{display:flex;align-items:center;gap:8px;width:100%}.itech-paid-inline #paidAmount{flex:1;min-width:0}.itech-payment-mode{position:relative;display:inline-flex;align-items:center;flex:0 0 auto;height:40px;padding:3px;border:1px solid #cbd8e8;border-radius:999px;background:#f4f7fb;box-sizing:border-box;box-shadow:inset 0 1px 2px rgba(16,40,75,.05)}.itech-payment-mode input{position:absolute;opacity:0;pointer-events:none}.itech-payment-mode button{position:relative;z-index:2;border:0;background:transparent;color:#687a91;font-size:10px;font-weight:900;padding:0 10px;height:32px;border-radius:999px;cursor:pointer;min-width:50px}.itech-payment-mode button.active{color:#fff}.itech-payment-mode .itech-pay-slider{position:absolute;z-index:1;top:3px;left:3px;width:50%;height:32px;border-radius:999px;background:#175cd3;transition:transform .22s ease;box-shadow:0 3px 8px rgba(23,92,211,.22)}.itech-payment-mode[data-mode="GPay"] .itech-pay-slider{transform:translateX(100%)}.itech-payment-mode[data-mode="Cash"] button[data-mode="Cash"],.itech-payment-mode[data-mode="GPay"] button[data-mode="GPay"]{color:#fff}.itech-payment-mode[data-mode="Cash"] button[data-mode="GPay"],.itech-payment-mode[data-mode="GPay"] button[data-mode="Cash"]{color:#687a91}@media(max-width:560px){.itech-paid-inline{gap:6px}.itech-payment-mode button{padding:0 8px;min-width:45px}.itech-payment-mode{height:38px}.itech-payment-mode .itech-pay-slider{height:30px}.itech-payment-mode button{height:30px}}
      .itech-day-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.itech-day-summary div{background:#f5f8fc;border-radius:9px;padding:9px}.itech-day-summary small{display:block;color:#71839a;font-size:9px}.itech-day-summary b{display:block;margin-top:3px;color:#10284b;font-size:14px}
      .itech-account-report{margin:14px 0;padding:14px;border:1px solid #dbe7f5;border-radius:14px;background:#fff}.itech-account-report h3{margin:0 0 10px;color:#10284b;font-size:15px}.itech-account-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.itech-account-grid div{padding:9px;border-radius:9px;background:#f7f9fc}.itech-account-grid small{display:block;color:#71839a;font-size:9px}.itech-account-grid b{display:block;margin-top:3px;font-size:13px;color:#10284b}.itech-account-note{margin-top:9px;font-size:10px;color:#687a91}
      @media(max-width:700px){.itech-day-grid,.itech-cash-grid,.itech-day-summary,.itech-account-grid{grid-template-columns:1fr 1fr}} @media(max-width:460px){.itech-day-grid,.itech-cash-grid,.itech-day-summary,.itech-account-grid{grid-template-columns:1fr}}
    `; document.head.appendChild(s);
  }

  function addDayControl(){
    if(document.getElementById('itechDayControl')) return;
    const q=document.querySelector('section.quick-entry'); if(!q) return;
    const box=document.createElement('section'); box.id='itechDayControl'; box.className='itech-day-control';
    box.innerHTML=`<h3>📅 Daily Cash & Account</h3><p>Opening balance must be entered before today's Quick Daily Work entries can be started.</p>
      <div class="itech-day-grid"><div class="itech-day-field"><label>Opening Cash in Hand</label><input id="itechOpeningCash" type="number" min="0" step="0.01" placeholder="₹ 0.00"></div><div class="itech-day-field"><label>Opening Account Balance</label><input id="itechOpeningAccount" type="number" min="0" step="0.01" placeholder="₹ 0.00"></div></div>
      <div class="itech-day-actions"><button id="itechStartDay" class="itech-day-btn itech-day-start">▶ Start Day</button><button id="itechCloseDay" class="itech-day-btn itech-day-close" style="display:none">🔒 Close Day</button></div><div id="itechDayStatus" class="itech-day-status"></div>
      <div id="itechDaySummary" class="itech-day-summary" style="display:none"></div>`;
    q.parentNode.insertBefore(box,q);

    const pay=document.getElementById('paidAmount');
    if(pay && !document.getElementById('itechPaymentMode')){
      const parent=pay.parentNode;
      const wrap=document.createElement('div');
      wrap.className='itech-paid-inline';
      parent.insertBefore(wrap,pay);
      wrap.appendChild(pay);
      const m=document.createElement('div');
      m.id='itechPaymentMode';
      m.className='itech-payment-mode';
      m.dataset.mode='Cash';
      m.innerHTML=`<span class="itech-pay-slider"></span><input type="radio" name="itechPaidMode" value="Cash" checked><input type="radio" name="itechPaidMode" value="GPay"><button type="button" data-mode="Cash" class="active">Cash</button><button type="button" data-mode="GPay">GPay</button>`;
      wrap.appendChild(m);
      m.querySelectorAll('button[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{
        const mode=btn.dataset.mode;
        m.dataset.mode=mode;
        const radio=m.querySelector(`input[value="${mode}"]`);
        if(radio) radio.checked=true;
        m.querySelectorAll('button[data-mode]').forEach(b=>b.classList.toggle('active',b===btn));
      }));
    }
    const bottom=document.querySelector('.bottom-row');
    if(bottom && !document.getElementById('itechCashManagement')){
      const cm=document.createElement('div');cm.id='itechCashManagement';cm.className='itech-cash-management';cm.innerHTML=`<div class="itech-cash-title">💰 Cash / Account Management</div><div class="itech-cash-grid">
        <div class="itech-cash-box"><label>Expense</label><input id="itechExpenseAmount" type="number" min="0" step="0.01" placeholder="₹ Amount"><select id="itechExpenseMethod"><option>Cash</option><option>GPay</option><option>Account</option></select><input id="itechExpenseNote" type="text" placeholder="Note / reference" style="margin-top:6px"><button id="itechSaveExpense">Save Expense</button></div>
        <div class="itech-cash-box"><label>Cash → Account</label><input id="itechCashToAccount" type="number" min="0" step="0.01" placeholder="₹ Amount"><button id="itechSaveCashToAccount">Transfer</button></div>
        <div class="itech-cash-box"><label>Account → Cash</label><input id="itechAccountToCash" type="number" min="0" step="0.01" placeholder="₹ Amount"><button id="itechSaveAccountToCash">Transfer</button></div>
      </div><div id="itechCashStatus" class="itech-day-status"></div>`; bottom.parentNode.insertBefore(cm,bottom.nextSibling);
    }
  }

  function setLocked(locked){
    const q=document.querySelector('section.quick-entry'); if(q) q.style.display=locked?'none':'';
    const close=$('itechCloseDay'),start=$('itechStartDay'); if(close)close.style.display=locked?'none':'inline-block'; if(start)start.style.display=locked?'inline-block':'none';
    if($('itechOpeningCash')) $('itechOpeningCash').disabled=!locked;
    if($('itechOpeningAccount')) $('itechOpeningAccount').disabled=!locked;
  }
  function status(msg,cls=''){const e=$('itechDayStatus');if(e){e.textContent=msg||'';e.className='itech-day-status '+cls}}

  async function loadDay(){
    const d=today();
    // Do not lock today's existing work. The new Opening/Closing workflow starts
    // only after tonight's 12:00 AM boundary.
    if(!isControlActive(d)){
      setLocked(false);
      if($('itechOpeningCash')) $('itechOpeningCash').disabled=true;
      if($('itechOpeningAccount')) $('itechOpeningAccount').disabled=true;
      if($('itechStartDay')) $('itechStartDay').style.display='none';
      if($('itechCloseDay')) $('itechCloseDay').style.display='none';
      status("Today's existing Quick Daily Work entries are unlocked. Daily Cash/Account control starts from 29-09-2026.",'itech-day-open');
      if($('itechDaySummary')) { $('itechDaySummary').style.display='grid'; $('itechDaySummary').innerHTML='<div><small>Mode</small><b>EXISTING DAY</b></div><div><small>Start</small><b>29-09-2026</b></div><div><small>Opening</small><b>From tomorrow</b></div><div><small>Status</small><b>UNLOCKED</b></div>'; }
      return {legacy_unlocked:true,status:'open',work_date:d};
    }
    await rpcAutoClose();
    const {data,error}=await sb.from('itech_daily_accounting_days').select('*').eq('work_date',d).maybeSingle();
    if(error){status('Please run the new Daily Cash/Account SQL migration first: '+error.message,'itech-day-closed');setLocked(true);return null;}
    if(!data){status('Enter Opening Cash and Opening Account Balance to start today.');setLocked(true);return null;}
    if(data.status==='open'){
      $('itechOpeningCash').value=data.opening_cash??0;$('itechOpeningAccount').value=data.opening_account??0;setLocked(false);status('Day is OPEN — Quick Daily Work is ready.','itech-day-open');
      $('itechDaySummary').style.display='grid';$('itechDaySummary').innerHTML=`<div><small>Opening Cash</small><b>${money(data.opening_cash)}</b></div><div><small>Opening Account</small><b>${money(data.opening_account)}</b></div><div><small>Status</small><b>OPEN</b></div><div><small>Date</small><b>${d}</b></div>`;
      return data;
    }
    setLocked(true);$('itechOpeningCash').value=data.opening_cash??0;$('itechOpeningAccount').value=data.opening_account??0;
    status(data.status==='auto_closed'?'Day was automatically closed at midnight.':'Day is closed.','itech-day-'+(data.status==='auto_closed'?'auto':'closed'));
    $('itechDaySummary').style.display='grid';$('itechDaySummary').innerHTML=`<div><small>Opening Cash</small><b>${money(data.opening_cash)}</b></div><div><small>Opening Account</small><b>${money(data.opening_account)}</b></div><div><small>Status</small><b>${data.status==='auto_closed'?'AUTO CLOSED':'CLOSED'}</b></div><div><small>Closing Cash</small><b>${data.closing_cash==null?'Not entered':money(data.closing_cash)}</b></div>`;
    return data;
  }

  async function startDay(){
    const oc=Number($('itechOpeningCash').value||0),oa=Number($('itechOpeningAccount').value||0); if(oc<0||oa<0){status('Enter valid opening balances.','itech-day-closed');return;}
    const d=today(),uid=await userId();$('itechStartDay').disabled=true;
    try{const {error}=await sb.from('itech_daily_accounting_days').insert({work_date:d,opening_cash:oc,opening_account:oa,started_by:uid,status:'open'});if(error)throw error;await loadDay();}
    catch(e){status(e.message||'Unable to start day.','itech-day-closed');}
    finally{$('itechStartDay').disabled=false;}
  }
  async function closeDay(){
    const cc=Number(prompt('Enter Closing Cash in Hand:', '0')); if(!Number.isFinite(cc)||cc<0)return;
    const ca=Number(prompt('Enter Closing Account Balance:', '0')); if(!Number.isFinite(ca)||ca<0)return;
    if(!confirm('First confirmation: Close today\'s work and lock new entries?'))return;
    if(!confirm('Second confirmation: Confirm DAY CLOSED?'))return;
    const uid=await userId();const {error}=await sb.from('itech_daily_accounting_days').update({closing_cash:cc,closing_account:ca,status:'closed',closed_by:uid,closed_at:new Date().toISOString(),auto_closed:false}).eq('work_date',today()).eq('status','open');
    if(error){status(error.message,'itech-day-closed');return;} await loadDay();
  }
  async function saveMovement(type,amount,note){
    if(!amount||amount<=0){$('itechCashStatus').textContent='Enter a valid amount.';return;}
    if(!isControlActive()){ $('itechCashStatus').textContent='Cash/Account control starts from 29-09-2026.';return; }
    const d=today(),day=await loadDay(); if(!day||day.status!=='open'){ $('itechCashStatus').textContent='Start the day first.';return; }
    const uid=await userId();const {error}=await sb.from('itech_daily_cash_movements').insert({work_date:d,movement_type:type,amount,note:note||null,entered_by:uid});
    if(error){$('itechCashStatus').textContent=error.message;return;}$('itechCashStatus').textContent='Transfer saved.'; if(type==='cash_to_account')$('itechCashToAccount').value='';else $('itechAccountToCash').value='';
  }
  async function saveExpense(){
    const amount=Number($('itechExpenseAmount').value||0),method=$('itechExpenseMethod').value,note=$('itechExpenseNote').value.trim(); if(!amount||amount<=0){$('itechCashStatus').textContent='Enter a valid expense amount.';return;}
    if(!isControlActive()){ $('itechCashStatus').textContent='Expense/Cash control starts from 29-09-2026.';return; }
    const day=await loadDay();if(!day||day.status!=='open'){$('itechCashStatus').textContent='Start the day first.';return;} const uid=await userId();
    const {error}=await sb.from('expenses').insert({expense_date:today(),category:'Other',amount,payment_method:method,reference_number:note||null,entered_by:uid});
    if(error){$('itechCashStatus').textContent=error.message;return;} $('itechCashStatus').textContent='Expense saved.';$('itechExpenseAmount').value='';$('itechExpenseNote').value='';
  }

  async function init(){
    injectStyles();addDayControl();
    $('itechStartDay')?.addEventListener('click',startDay);$('itechCloseDay')?.addEventListener('click',closeDay);
    $('itechSaveCashToAccount')?.addEventListener('click',()=>saveMovement('cash_to_account',Number($('itechCashToAccount').value||0),'Cash transferred to account'));
    $('itechSaveAccountToCash')?.addEventListener('click',()=>saveMovement('account_to_cash',Number($('itechAccountToCash').value||0),'Account cash withdrawal'));
    $('itechSaveExpense')?.addEventListener('click',saveExpense);
    await loadDay();
    // Local midnight fallback. On the next page load rpcAutoClose() closes any missed stale day.
    const now=new Date(),next=new Date(now);next.setHours(24,0,0,50);setTimeout(async()=>{await rpcAutoClose();await loadDay();},Math.max(1000,next-now));
    // Capture phase blocks the existing Save button handler when the day is not open.
    const save=$('saveBtn');if(save)save.addEventListener('click',async e=>{
      if(!isControlActive()) return;
      const day=await loadDay();
      if(!day||day.status!=='open'){e.preventDefault();e.stopImmediatePropagation();alert('Start today\'s Day first.');}
    },true);
  }

  function addReportCard(container, prefix){
    if(!container||document.getElementById(prefix+'Accounting'))return;
    const c=document.createElement('div');c.id=prefix+'Accounting';c.className='itech-account-report';c.innerHTML=`<h3>💰 Complete Cash & Account Report</h3><div class="itech-account-grid"><div><small>Opening Cash</small><b id="${prefix}OpenCash">₹0.00</b></div><div><small>Opening Account</small><b id="${prefix}OpenAccount">₹0.00</b></div><div><small>Customer Cash Received</small><b id="${prefix}CashIn">₹0.00</b></div><div><small>Customer GPay Received</small><b id="${prefix}GpayIn">₹0.00</b></div><div><small>Expense – Cash</small><b id="${prefix}CashExp">₹0.00</b></div><div><small>Expense – Account</small><b id="${prefix}AccountExp">₹0.00</b></div><div><small>Cash → Account</small><b id="${prefix}CashToAccount">₹0.00</b></div><div><small>Account → Cash</small><b id="${prefix}AccountToCash">₹0.00</b></div><div><small>Company E-Payment</small><b id="${prefix}EPayOut">₹0.00</b></div><div><small>Expected Closing Cash</small><b id="${prefix}ExpectedCash">₹0.00</b></div><div><small>Expected Closing Account</small><b id="${prefix}ExpectedAccount">₹0.00</b></div><div><small>Actual Closing (Cash / Account)</small><b id="${prefix}ActualClose">—</b></div><div><small>Cash Difference</small><b id="${prefix}CashDiff">—</b></div><div><small>Account Difference</small><b id="${prefix}AccountDiff">—</b></div><div><small>Day Status</small><b id="${prefix}DayStatus">—</b></div></div><div class="itech-account-note" id="${prefix}AccountingNote">Customer Cash/GPay is incoming; Expense is outgoing; Cash ↔ Account transfers are internal; Company E-Payment is treated as Account outgoing.</div>`;
    container.prepend(c);
  }
  async function renderReport(prefix,fromDate,toDate=fromDate){
    const card=document.getElementById(prefix==='today'?'todayCard':'rangeCard');if(!card)return;
    addReportCard(card,prefix);
    try{
      const [daysQ,pQ,wQ,eQ,mQ]=await Promise.all([
        sb.from('itech_daily_accounting_days').select('*').gte('work_date',fromDate).lte('work_date',toDate).order('work_date',{ascending:true}),
        sb.from('payments').select('amount,payment_method,payment_date').gte('payment_date',fromDate).lte('payment_date',toDate),
        sb.from('daily_work_entries').select('e_payment,work_date').gte('work_date',fromDate).lte('work_date',toDate),
        sb.from('expenses').select('amount,payment_method,expense_date').gte('expense_date',fromDate).lte('expense_date',toDate),
        sb.from('itech_daily_cash_movements').select('movement_type,amount,work_date').gte('work_date',fromDate).lte('work_date',toDate)
      ]);
      const err=daysQ.error||pQ.error||wQ.error||eQ.error||mQ.error;if(err)throw err;
      const days=daysQ.data||[],pays=pQ.data||[],works=wQ.data||[],exps=eQ.data||[],mov=mQ.data||[];
      const firstDay=days[0]||{};
      const lastDay=days[days.length-1]||{};
      const cashIn=pays.filter(x=>String(x.payment_method||'').toLowerCase()==='cash').reduce((s,x)=>s+Number(x.amount||0),0);
      const accountIn=pays.filter(x=>String(x.payment_method||'').toLowerCase()!=='cash').reduce((s,x)=>s+Number(x.amount||0),0);
      const cashExp=exps.filter(x=>String(x.payment_method||'').toLowerCase()==='cash').reduce((s,x)=>s+Number(x.amount||0),0);
      const accountExp=exps.filter(x=>String(x.payment_method||'').toLowerCase()!=='cash').reduce((s,x)=>s+Number(x.amount||0),0);
      const cashToAccount=mov.filter(x=>x.movement_type==='cash_to_account').reduce((s,x)=>s+Number(x.amount||0),0);
      const accountToCash=mov.filter(x=>x.movement_type==='account_to_cash').reduce((s,x)=>s+Number(x.amount||0),0);
      const ePaymentOut=works.reduce((s,x)=>s+Number(x.e_payment||0),0);
      const openingCash=Number(firstDay.opening_cash||0),openingAccount=Number(firstDay.opening_account||0);
      // E-Payment is the company's outgoing amount and, as defined for this system,
      // is paid from the Account side. Customer Paid Cash/GPay remains separate.
      const expectedCash=openingCash+cashIn-cashExp-cashToAccount+accountToCash;
      const expectedAccount=openingAccount+accountIn-accountExp+cashToAccount-accountToCash-ePaymentOut;
      const actualCash=lastDay.closing_cash==null?null:Number(lastDay.closing_cash);
      const actualAccount=lastDay.closing_account==null?null:Number(lastDay.closing_account);
      const cashDiff=actualCash==null?null:actualCash-expectedCash;
      const accountDiff=actualAccount==null?null:actualAccount-expectedAccount;
      const set=(id,v)=>{const x=document.getElementById(prefix+id);if(x)x.textContent=money(v)};
      set('OpenCash',openingCash);set('OpenAccount',openingAccount);set('CashIn',cashIn);set('GpayIn',accountIn);
      set('CashExp',cashExp);set('AccountExp',accountExp);set('CashToAccount',cashToAccount);set('AccountToCash',accountToCash);
      set('EPayOut',ePaymentOut);set('ExpectedCash',expectedCash);set('ExpectedAccount',expectedAccount);
      const ac=document.getElementById(prefix+'ActualClose');
      if(ac) ac.textContent=actualCash==null&&actualAccount==null?'Not entered':money(actualCash)+' / '+money(actualAccount);
      const cd=document.getElementById(prefix+'CashDiff'),ad=document.getElementById(prefix+'AccountDiff'),st=document.getElementById(prefix+'DayStatus');
      if(cd)cd.textContent=cashDiff==null?'—':money(cashDiff);
      if(ad)ad.textContent=accountDiff==null?'—':money(accountDiff);
      if(st)st.textContent=days.length?`${days.length} accounting day(s) • ${String(lastDay.status||'').replace('_',' ').toUpperCase()}`:'No Daily Cash/Account record';
      const note=document.getElementById(prefix+'AccountingNote');
      if(note)note.textContent=`${fromDate===toDate?'Date':'Period'}: ${fromDate}${fromDate===toDate?'':' to '+toDate}. Customer Cash/GPay is incoming; Expense is outgoing; Cash ↔ Account transfers are internal; Company E-Payment is treated as Account outgoing. Actual Closing − Expected Closing is shown as difference.`;
    }catch(e){console.warn('Daily accounting report:',e?.message||e)}
  }
  function reportInit(){
    const r=document.getElementById('todayCard');if(!r)return;
    renderReport('today',today(),today());
    const gen=document.getElementById('generateRange');
    if(gen)gen.addEventListener('click',()=>{
      setTimeout(()=>{
        const mode=document.getElementById('modeText')?.value||'Daily';
        if(mode==='Weekly'){
          const base=document.getElementById('weekDate')?.value||today();
          const d=new Date(base+'T00:00:00');const day=d.getDay(),diff=(day+6)%7;
          d.setDate(d.getDate()-diff);const from=d.toISOString().slice(0,10);d.setDate(d.getDate()+6);const to=d.toISOString().slice(0,10);
          renderReport('range',from,to);
        }else{const d=document.getElementById('reportDate')?.value||today();renderReport('range',d,d)}
      },120);
    });
    const ref=document.getElementById('refreshReport');
    if(ref)ref.addEventListener('click',()=>{setTimeout(()=>{
      renderReport('today',today(),today());
      const mode=document.getElementById('modeText')?.value||'Daily';
      if(mode==='Weekly'){
        const base=document.getElementById('weekDate')?.value||today();const d=new Date(base+'T00:00:00');const day=d.getDay(),diff=(day+6)%7;d.setDate(d.getDate()-diff);const from=d.toISOString().slice(0,10);d.setDate(d.getDate()+6);renderReport('range',from,d.toISOString().slice(0,10));
      }else{const d=document.getElementById('reportDate')?.value||today();renderReport('range',d,d)}
    },100)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();reportInit()});else{init();reportInit()}
})();
