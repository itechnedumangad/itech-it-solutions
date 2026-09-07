/* iTech Quick Daily Work enhancements */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));

  function injectStyle(){
    if($("qw-enhance-style")) return;
    const st=document.createElement("style"); st.id="qw-enhance-style";
    st.textContent=`
      .qw-inline-add-customer{width:100%;border:0;border-top:1px solid #e4ebf3;background:#fff;color:#d76700;padding:11px 12px;text-align:left;font-weight:850;cursor:pointer;font-size:13px}
      .qw-inline-add-customer:hover{background:#fff7ed}
      .qw-inline-add-customer small{display:block;color:#7890a8;font-weight:600;margin-top:2px}
      .qw-cash-sale-option{width:100%;border:0;border-top:1px solid #e4ebf3;background:#fff8ef;color:#0b3a68;padding:12px;text-align:left;font-weight:900;cursor:pointer;font-size:14px}
      .qw-cash-sale-option:hover{background:#fff1dc}
      .qw-modal-backdrop{position:fixed!important;inset:0!important;z-index:99999!important;display:none!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(4,21,45,.58)!important;backdrop-filter:blur(4px)!important}
      .qw-modal-backdrop.show{display:flex!important}
      .qw-modal{width:min(680px,100%);max-height:min(88vh,760px);overflow:auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25)}
      .qw-entry-stack{display:grid;gap:10px;margin-top:10px}
      .qw-extra-entry .amount-grid{margin-top:0!important}
      .qw-entry-plus{display:flex;justify-content:center;margin-top:9px}
      .qw-entry-plus button{width:40px;height:40px;border-radius:50%;border:1px dashed #4b8dcc;background:#f6fbff;color:#0b5ea8;font-size:26px;line-height:1;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center}
      .qw-entry-plus button:hover{background:#eaf5ff;transform:translateY(-1px)}
      .qw-last-five{margin-top:14px;border:1px solid #dbe6f2;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 8px 22px rgba(15,49,88,.06)}
      .qw-last-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:#f7fbff;border-bottom:1px solid #e1eaf3}
      .qw-last-head h3{margin:0;color:#0b2f57;font-size:17px}.qw-last-head p{margin:3px 0 0;color:#71849c;font-size:12px}
      .qw-last-head button{border:1px solid #cfe0ef;background:#fff;border-radius:9px;padding:8px 12px;color:#0b5ea8;font-weight:800;cursor:pointer}
      .qw-last-list{display:grid}.qw-last-row{padding:12px 18px;border-bottom:1px solid #edf2f7}.qw-last-row:last-child{border-bottom:0}
      .qw-last-main{display:flex;justify-content:space-between;gap:10px}.qw-last-main strong{color:#17385e;font-size:14px}.qw-last-main span{color:#8292a7;font-size:11px;white-space:nowrap}
      .qw-last-values{display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;color:#70839b;font-size:12px}.qw-last-values b{color:#163e68}
      .qw-last-loading,.qw-last-empty{padding:18px;color:#7b8da4;font-size:13px}
      @media(max-width:700px){.qw-last-main{display:block}.qw-last-main span{display:block;margin-top:3px}.qw-last-values{gap:10px}.qw-entry-plus button{width:38px;height:38px}}
    `;
    document.head.appendChild(st);
  }

  function ensureCustomerModal(){
    if($("qwCustomerModal")) return;
    const b=document.createElement("div"); b.id="qwCustomerModal"; b.className="qw-modal-backdrop";
    b.innerHTML=`<div class="qw-modal"><h2 style="margin:0 0 5px">Add New Customer</h2><p class="muted">Add the customer here without leaving Quick Daily Work.</p><div class="qw-modal-grid"><label class="field">Full Name *<input id="qwNewName"></label><label class="field">Mobile *<input id="qwNewMobile" inputmode="tel"></label><label class="field">WhatsApp<input id="qwNewWhatsapp"></label><label class="field">Email<input id="qwNewEmail" type="email"></label><label class="field wide">Address<textarea id="qwNewAddress" rows="2"></textarea></label></div><div class="qw-modal-actions"><button class="btn secondary" id="qwCancel" type="button">Cancel</button><button class="btn primary" id="qwSave" type="button">Save Customer</button></div><div id="qwMsg" class="status"></div></div>`;
    document.body.appendChild(b);
    $("qwCancel").onclick=()=>b.classList.remove("show");
    b.addEventListener("click",e=>{if(e.target===b)b.classList.remove("show")});
    $("qwSave").onclick=async()=>{
      const name=$("qwNewName").value.trim(), mobile=$("qwNewMobile").value.trim();
      if(!name||!mobile){$("qwMsg").textContent="Name and mobile are required.";return;}
      $("qwSave").disabled=true; $("qwMsg").textContent="Saving…";
      try{
        const optional={whatsapp:$("qwNewWhatsapp").value.trim()||null,email:$("qwNewEmail").value.trim()||null,address:$("qwNewAddress").value.trim()||null,status:"active",created_from_insurance:false};
        let r=await sb.from("customers").insert({full_name:name,mobile,...optional}).select("id,full_name,mobile,whatsapp,email,address,created_from_insurance").single();
        if(r.error) r=await sb.from("customers").insert({full_name:name,mobile,status:"active"}).select("id,full_name,mobile").single();
        if(r.error) throw r.error;
        window.dispatchEvent(new CustomEvent("itech:customer-created",{detail:r.data}));
        b.classList.remove("show");
        ["qwNewName","qwNewMobile","qwNewWhatsapp","qwNewEmail","qwNewAddress"].forEach(id=>{if($(id))$(id).value=""});
        $("qwMsg").textContent="";
      }catch(e){$("qwMsg").textContent=e.message||"Unable to create customer.";}
      finally{$("qwSave").disabled=false;}
    };
  }

  function openAddCustomer(prefill){
    ensureCustomerModal();
    if(prefill && $("qwNewName")) $("qwNewName").value=prefill.trim();
    $("qwCustomerModal")?.classList.add("show");
    setTimeout(()=>$("qwNewMobile")?.focus(),80);
  }
  window.itechOpenQuickAddCustomer=openAddCustomer;

  function selectCashSale(){
    const search=$("customerSearch"), hidden=$("customer"), box=$("customerSuggestions");
    if(!search||!hidden)return;
    hidden.value="";
    search.value="Cash Sale";
    search.dataset.cashSale="1";
    if($("customerClear")) $("customerClear").style.display="block";
    box?.classList.remove("show");
    document.dispatchEvent(new Event("input",{bubbles:true}));
    ["e_filing","e_payment","print_amount","scanning","other_works","paidAmount"].forEach(id=>$(id)?.dispatchEvent(new Event("input",{bubbles:true})));
  }
  window.itechSelectQuickCashSale=selectCashSale;

  function hookCustomerSearch(){
    const search=$("customerSearch"), box=$("customerSuggestions"), hidden=$("customer");
    if(!search||!box||!hidden||search.dataset.qwHooked) return;
    search.dataset.qwHooked="1";
    const observer=new MutationObserver(()=>{
      const q=search.value.trim();
      if(!box.querySelector(".qw-cash-sale-option")){
        const cash=document.createElement("button");
        cash.type="button"; cash.className="qw-cash-sale-option";
        cash.innerHTML='💵 Cash Sale';
        cash.onclick=selectCashSale;
        box.prepend(cash);
      }
      const empty=box.querySelector(".customer-empty");
      if(empty && !box.querySelector(".qw-inline-add-customer")){
        const btn=document.createElement("button");
        btn.type="button"; btn.className="qw-inline-add-customer";
        btn.innerHTML=`＋ Add New Customer${q?`<small>“${esc(q)}” is not in the customer list</small>`:"<small>Add without leaving this screen</small>"}`;
        btn.onclick=()=>openAddCustomer(q);
        box.appendChild(btn);
      }
    });
    observer.observe(box,{childList:true,subtree:true});
    window.__qwCustomerObserver=observer;
  }

  const fieldDefs=[["e_filing","E-Filing"],["e_payment","E-Payment"],["print_amount","Print"],["scanning","Scanning"],["other_works","Other Works"]];

  function makeAmountGrid(){
    const grid=document.createElement("div"); grid.className="amount-grid"; grid.dataset.qwExtra="1";
    fieldDefs.forEach(([key,label])=>{
      const box=document.createElement("div"); box.className="amount-box";
      box.innerHTML=`<label>${label}</label><input min="0" placeholder="₹ Amount" step="0.01" type="number" data-qw-field="${key}" value="">`;
      grid.appendChild(box);
    });
    return grid;
  }

  function setupRepeatEntries(){
    const firstGrid=document.querySelector(".quick-entry .amount-grid") || $("e_filing")?.closest(".amount-grid");
    if(!firstGrid || $("qwEntryStack") || !$("other_works")) return;
    const stack=document.createElement("div"); stack.id="qwEntryStack"; stack.className="qw-entry-stack";
    const plusWrap=document.createElement("div"); plusWrap.className="qw-entry-plus";
    plusWrap.innerHTML=`<button id="qwAddEntry" type="button" title="Add another work entry" aria-label="Add another work entry">＋</button>`;
    firstGrid.insertAdjacentElement("afterend",stack); stack.insertAdjacentElement("afterend",plusWrap);
    function triggerTotals(){
      $("e_filing")?.dispatchEvent(new Event("input",{bubbles:true}));
    }
    function addRow(){
      const row=document.createElement("div"); row.className="qw-extra-entry";
      row.appendChild(makeAmountGrid());
      stack.appendChild(row);
      row.querySelectorAll("input").forEach(i=>i.addEventListener("input",triggerTotals));
    }
    $("qwAddEntry").onclick=()=>{addRow();triggerTotals();};
    window.itechGetExtraWorkEntries=()=>[...stack.querySelectorAll(".qw-extra-entry")].map(row=>{
      const out={}; row.querySelectorAll("[data-qw-field]").forEach(i=>out[i.dataset.qwField]=Math.max(Number(i.value||0),0)); return out;
    });
    window.itechClearExtraWorkEntries=()=>{stack.innerHTML="";};
  }

  async function loadLastFiveTransactions(){
    const host=$("qwLastFive"); if(!host) return;
    host.innerHTML='<div class="qw-last-loading">Loading recent transactions…</div>';
    try{
      const r=await sb.from("daily_work_entries")
        .select("id,customer_id,e_filing,e_payment,print_amount,scanning,other_works,discount,paid_amount,balance_amount,entry_type,description,created_at,customers(full_name,mobile)")
        .order("created_at",{ascending:false}).limit(5);
      if(r.error) throw r.error;
      const rows=r.data||[];
      if(!rows.length){host.innerHTML='<div class="qw-last-empty">No transactions recorded yet.</div>';return;}
      host.innerHTML=rows.map(x=>{
        const c=x.customers||{};
        const name=x.entry_type==="cash_sale"?"Cash Sale":(c.full_name||"Customer");
        const work=Number(x.e_filing||0)+Number(x.e_payment||0)+Number(x.print_amount||0)+Number(x.scanning||0)+Number(x.other_works||0);
        const net=Math.max(work-Number(x.discount||0),0);
        const paid=Number(x.paid_amount||0);
        const bal=Number(x.balance_amount??Math.max(net-paid,0));
        const dt=x.created_at?new Date(x.created_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"";
        return `<div class="qw-last-row"><div class="qw-last-main"><strong>${esc(name)}</strong><span>${dt}</span></div><div class="qw-last-values"><span>Work <b>₹${net.toFixed(2)}</b></span><span>Paid <b>₹${paid.toFixed(2)}</b></span><span>Balance <b>₹${bal.toFixed(2)}</b></span></div></div>`;
      }).join("");
    }catch(e){host.innerHTML='<div class="qw-last-empty">Unable to load recent transactions.</div>';}
  }

  function injectLastFiveTransactions(){
    if($("qwLastFive")) return;
    const quick=document.querySelector(".quick-entry"); if(!quick) return;
    const sec=document.createElement("div"); sec.className="qw-last-five";
    sec.innerHTML=`<div class="qw-last-head"><div><h3>🧾 Last 5 Transactions</h3><p>Most recent Quick Daily Work entries</p></div><button type="button" id="qwLastRefresh">↻ Refresh</button></div><div id="qwLastFive" class="qw-last-list"></div>`;
    const bottom=quick.querySelector(".bottom-row");
    if(bottom) bottom.insertAdjacentElement("afterend",sec); else quick.appendChild(sec);
    $("qwLastRefresh").onclick=loadLastFiveTransactions;
    loadLastFiveTransactions();
  }

  function init(){
    injectStyle(); ensureCustomerModal(); hookCustomerSearch(); setupRepeatEntries(); injectLastFiveTransactions();
    window.addEventListener("itech:work-saved",loadLastFiveTransactions);
    window.addEventListener("itech:customer-created",e=>{
      const c=e.detail;
      if(c && $("customerSearch") && $("customer")){
        $("customer").value=c.id;
        $("customerSearch").value=`${c.full_name||"Customer"} — ${c.mobile||""}`;
        $("customerSearch").dataset.cashSale="0";
        $("customerSuggestions")?.classList.remove("show");
        if($("customerClear"))$("customerClear").style.display="block";
      }
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
