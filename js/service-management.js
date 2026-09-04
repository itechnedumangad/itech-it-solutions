/* iTech Service Job Cards - admin/staff
   New job -> existing customer OR create/register a new customer.
   Estimate, payment, work-complete, delete and printable job-card actions are available after creation.
*/
(function(){
  "use strict";
  const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const today=()=>new Date().toISOString().slice(0,10);
  const statuses=["Received","Diagnosis","Estimate Sent","Approved","Repairing","Testing","Waiting Parts","Ready for Delivery","Work Completed","Delivered","Cancelled"];
  function mount(){
    const main=document.querySelector("main.dash-main");
    if(!main||document.getElementById("itechServiceJobs"))return;
    const sec=document.createElement("section");
    sec.className="panel";sec.id="itechServiceJobs";sec.style.marginTop="20px";
    sec.innerHTML=`
      <div class="toolbar"><div><p class="eyebrow">JOB CARDS</p><h2>Service Job Cards</h2><p class="muted">Create and manage service job cards from this screen.</p></div><button class="btn primary" id="smNew">＋ New Job Card</button></div>
      <div id="smForm" style="display:none" class="form">
        <div class="grid">
          <label class="field">Customer Mobile<input id="smMobile" inputmode="tel" maxlength="10" placeholder="10 digit mobile"></label>
          <label class="field">Customer<select id="smCustomer"><option value="">Select existing customer</option><option value="__new__">＋ New Customer — enter name below</option></select></label>
          <label class="field wide" id="smNewNameWrap" style="display:none">New Customer Name<input id="smNewName" placeholder="Enter customer name"></label>
          <label class="field">Device Type<input id="smDevice" placeholder="Desktop / Laptop / Printer"></label>
          <label class="field">Brand<input id="smBrand"></label>
          <label class="field">Model<input id="smModel"></label>
          <label class="field">Serial Number<input id="smSerial"></label>
          <label class="field">Technician ID<input id="smTech"></label>
          <label class="field">Priority<select id="smPriority"><option>Normal</option><option>Low</option><option>High</option><option>Urgent</option></select></label>
          <label class="field wide">Complaint<textarea id="smComplaint" rows="3" placeholder="Customer complaint / problem"></textarea></label>
          <label class="field wide">Notes<textarea id="smNotes" rows="2"></textarea></label>
        </div>
        <div class="action-row"><button class="btn primary" id="smSave">Create Job Card</button><button class="btn secondary" id="smCancel">Cancel</button></div>
        <div class="status" id="smStatus"></div>
      </div>
      <div class="table-scroll"><table class="data-table"><thead><tr><th>Job Card</th><th>Customer</th><th>Device</th><th>Status</th><th>Estimate</th><th>Paid</th><th>Balance</th><th>Actions</th></tr></thead><tbody id="smRows"><tr><td colspan="8">Loading…</td></tr></tbody></table></div>`;
    const catalog=main.querySelector("#serviceCatalog"); if(catalog)main.insertBefore(sec,catalog);else main.appendChild(sec);

    const customer=document.getElementById("smCustomer"), mobile=document.getElementById("smMobile"), newWrap=document.getElementById("smNewNameWrap"), newName=document.getElementById("smNewName"), statusEl=document.getElementById("smStatus");
    let customers=[];

    function msg(t,error=false){statusEl.textContent=t;statusEl.style.color=error?"#b42318":"#087a42";}
    async function loadCustomers(){
      const r=await sb.from("customers").select("id,full_name,mobile").eq("status","active").order("full_name");
      if(r.error){msg(r.error.message,true);return;}
      customers=r.data||[];
      customer.innerHTML='<option value="">Select existing customer</option><option value="__new__">＋ New Customer — enter name below</option>'+
        customers.map(c=>`<option value="${esc(c.id)}" data-mobile="${esc(c.mobile||"")}">${esc(c.full_name||"Customer")} — ${esc(c.mobile||"")}</option>`).join("");
    }
    customer.onchange=()=>{
      const isNew=customer.value==="__new__";newWrap.style.display=isNew?"block":"none";
      if(isNew){mobile.value="";newName.value="";mobile.focus();return;}
      const opt=customer.selectedOptions[0];if(opt?.dataset.mobile)mobile.value=opt.dataset.mobile;
    };
    mobile.addEventListener("input",()=>{mobile.value=mobile.value.replace(/\D/g,"").slice(0,10);const v=mobile.value;const c=customers.find(x=>String(x.mobile||"").replace(/\D/g,"")===v);if(c&&customer.value!==c.id){customer.value=c.id;newWrap.style.display="none";}});

    async function getOrCreateCustomer(){
      const selected=customer.value;
      const mob=mobile.value.trim();
      if(!mob||mob.length!==10)throw new Error("Enter a valid 10-digit customer mobile number.");
      if(selected && selected!=="__new__")return selected;
      const name=newName.value.trim();
      if(!name)throw new Error("Enter the new customer name.");
      const existing=await sb.from("customers").select("id,full_name,mobile").eq("mobile",mob).maybeSingle();
      if(existing.error)throw existing.error;
      if(existing.data){
        const up=await sb.from("customers").update({full_name:name,status:"active"}).eq("id",existing.data.id);
        if(up.error)throw up.error;
        return existing.data.id;
      }
      let ins=await sb.from("customers").insert({full_name:name,mobile:mob,status:"active"}).select("id").single();
      if(ins.error)throw ins.error;
      return ins.data.id;
    }

    function resetForm(){
      ["smMobile","smNewName","smDevice","smBrand","smModel","smSerial","smTech","smComplaint","smNotes"].forEach(id=>document.getElementById(id).value="");
      document.getElementById("smPriority").value="Normal";customer.value="";newWrap.style.display="none";statusEl.textContent="";
    }

    function printJob(j,c){
      const w=window.open("","_blank","width=900,height=1000");if(!w){alert("Please allow pop-ups to print the job card.");return;}
      const now=new Date(j.created_at||Date.now()).toLocaleString("en-IN");
      w.document.write(`<!doctype html><html><head><title>${esc(j.job_number)} - Job Card</title><style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#13294b;margin:0}.head{display:flex;justify-content:space-between;border-bottom:3px solid #123f72;padding-bottom:12px}.logo{font-size:24px;font-weight:800}.orange{color:#f58220}.muted{color:#667085}.box{border:1px solid #d8e1ec;border-radius:8px;padding:12px;margin-top:14px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.label{font-size:11px;color:#667085;text-transform:uppercase}.value{font-weight:700;margin-top:3px}.title{font-size:20px;font-weight:800}.total{font-size:18px;font-weight:800}.sign{height:70px;border-bottom:1px solid #999}.foot{margin-top:22px;text-align:center;font-size:11px;color:#667085}@media print{button{display:none}}</style></head><body>
      <div class="head"><div><div class="logo">iTech <span class="orange">IT Solutions</span></div><div class="muted">Govt. Sub Treasury Road, Nedumangad</div><div>7736929233 · 8943165951 · itnedumangad@gmail.com</div></div><div style="text-align:right"><div class="title">SERVICE JOB CARD</div><div><b>${esc(j.job_number)}</b></div><div class="muted">Created: ${esc(now)}</div></div></div>
      <div class="box grid"><div><div class="label">Customer</div><div class="value">${esc(c?.full_name||"Customer")}</div></div><div><div class="label">Mobile</div><div class="value">${esc(c?.mobile||"")}</div></div><div><div class="label">Device</div><div class="value">${esc(j.device_type||"—")}</div></div><div><div class="label">Brand / Model</div><div class="value">${esc([j.brand,j.model].filter(Boolean).join(" / ")||"—")}</div></div><div><div class="label">Serial Number</div><div class="value">${esc(j.serial_number||"—")}</div></div><div><div class="label">Priority</div><div class="value">${esc(j.priority||"Normal")}</div></div><div><div class="label">Status</div><div class="value">${esc(j.status||"Received")}</div></div></div>
      <div class="box"><div class="label">Complaint</div><div style="margin-top:6px;white-space:pre-wrap">${esc(j.complaint||"—")}</div></div><div class="box"><div class="label">Notes</div><div style="margin-top:6px;white-space:pre-wrap">${esc(j.notes||"—")}</div></div>
      <div class="box grid"><div><div class="label">Estimate</div><div class="total">${money(j.estimate_amount)}</div></div><div><div class="label">Paid</div><div class="total">${money(j.advance_amount)}</div></div><div><div class="label">Balance</div><div class="total">${money(j.balance_amount)}</div></div></div>
      <div class="box grid"><div><div class="label">Customer Signature</div><div class="sign"></div></div><div><div class="label">Authorized Signature</div><div class="sign"></div></div></div><div class="foot">Your Trust Our Service · @itechndd</div><script>setTimeout(()=>window.print(),250);</script></body></html>`);w.document.close();
    }

    async function loadJobs(){
      const r=await sb.from("service_jobs").select("*,customers(full_name,mobile)").order("created_at",{ascending:false}).limit(100);
      if(r.error){document.getElementById("smRows").innerHTML=`<tr><td colspan="8">${esc(r.error.message)}</td></tr>`;return;}
      const rows=r.data||[];
      document.getElementById("smRows").innerHTML=rows.map(j=>`<tr>
        <td><b>${esc(j.job_number)}</b><small style="display:block;color:#667085">${esc((j.created_at||"").slice(0,10))}</small></td>
        <td>${esc(j.customers?.full_name||"Customer")}<small style="display:block;color:#667085">${esc(j.customers?.mobile||"")}</small></td>
        <td>${esc([j.brand,j.model,j.device_type].filter(Boolean).join(" ")||"—")}</td>
        <td><select data-job-status="${j.id}">${statuses.map(s=>`<option value="${esc(s)}" ${s===j.status?"selected":""}>${esc(s)}</option>`).join("")}</select></td>
        <td>${money(j.estimate_amount)}</td><td>${money(j.advance_amount)}</td><td>${money(j.balance_amount)}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-small" data-job-print="${j.id}">🖨 Print</button><button class="btn btn-small" data-job-est="${j.id}">₹ Estimate</button><button class="btn btn-small" data-job-pay="${j.id}">💳 Payment</button><button class="btn btn-small" data-job-complete="${j.id}">✓ Complete</button><button class="btn btn-small" style="background:#fff0f0;color:#b42318" data-job-delete="${j.id}">Delete</button></div></td>
      </tr>`).join("")||'<tr><td colspan="8">No service job cards.</td></tr>';
      document.querySelectorAll("[data-job-status]").forEach(x=>x.onchange=async()=>{const r=await sb.from("service_jobs").update({status:x.value}).eq("id",x.dataset.jobStatus);if(r.error)alert(r.error.message);else loadJobs();});
      document.querySelectorAll("[data-job-print]").forEach(b=>b.onclick=()=>{const j=rows.find(x=>x.id===b.dataset.jobPrint);if(j)printJob(j,j.customers)});
      document.querySelectorAll("[data-job-est]").forEach(b=>b.onclick=()=>editEstimate(rows.find(x=>x.id===b.dataset.jobEst)));
      document.querySelectorAll("[data-job-pay]").forEach(b=>b.onclick=()=>addPayment(rows.find(x=>x.id===b.dataset.jobPay)));
      document.querySelectorAll("[data-job-complete]").forEach(b=>b.onclick=()=>completeJob(rows.find(x=>x.id===b.dataset.jobComplete)));
      document.querySelectorAll("[data-job-delete]").forEach(b=>b.onclick=()=>deleteJob(rows.find(x=>x.id===b.dataset.jobDelete)));
    }

    function modal(title,body,saveText,handler){
      const m=document.createElement("div");m.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(4,21,45,.58);display:flex;align-items:center;justify-content:center;padding:18px";
      m.innerHTML=`<div style="width:min(560px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;padding:22px"><h2 style="margin:0 0 16px">${title}</h2>${body}<div style="display:flex;gap:10px;margin-top:18px"><button class="btn primary" id="mSave">${saveText}</button><button class="btn secondary" id="mCancel">Cancel</button></div><div id="mMsg" class="status"></div></div>`;
      document.body.appendChild(m);m.querySelector("#mCancel").onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};m.querySelector("#mSave").onclick=async()=>{try{await handler(m);m.remove();await loadJobs();}catch(e){m.querySelector("#mMsg").textContent=e.message||String(e);m.querySelector("#mMsg").style.color="#b42318";}};return m;
    }
    function editEstimate(j){if(!j)return;modal("Add / Update Estimate",`<label class="field">Estimate Amount<input id="mAmount" type="number" min="0" step="0.01" value="${Number(j.estimate_amount||0)}"></label><p class="muted">Estimate can be added or changed after the job card is created.</p>`,"Save Estimate",async m=>{const amount=Math.max(0,Number(m.querySelector("#mAmount").value||0));const paid=Number(j.advance_amount||0);const r=await sb.from("service_jobs").update({estimate_amount:amount,balance_amount:Math.max(0,amount-paid)}).eq("id",j.id);if(r.error)throw r.error;});}
    function addPayment(j){if(!j)return;modal("Add Job Payment",`<div class="grid"><label class="field">Payment Amount<input id="mPay" type="number" min="0.01" step="0.01" value=""></label><label class="field">Payment Date<input id="mDate" type="date" value="${today()}"></label><label class="field">Method<select id="mMethod"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Other</option></select></label><label class="field">Reference<input id="mRef" value="${esc(j.job_number)}"></label><label class="field wide">Notes<textarea id="mNotes" rows="2">Service Job ${esc(j.job_number)}</textarea></label></div>`,`Save Payment`,async m=>{const amount=Number(m.querySelector("#mPay").value||0);if(amount<=0)throw new Error("Enter a valid payment amount.");const date=m.querySelector("#mDate").value||today();const customerId=j.customer_id;if(!customerId)throw new Error("This job has no customer linked.");const p=await sb.from("payments").insert({customer_id:customerId,payment_date:date,amount,payment_method:m.querySelector("#mMethod").value,reference_number:m.querySelector("#mRef").value.trim()||j.job_number,notes:m.querySelector("#mNotes").value.trim()||null});if(p.error)throw p.error;const paid=Number(j.advance_amount||0)+amount;const balance=Math.max(0,Number(j.estimate_amount||0)-paid);const u=await sb.from("service_jobs").update({advance_amount:paid,balance_amount:balance}).eq("id",j.id);if(u.error)throw u.error;});}
    async function completeJob(j){if(!j)return;if(!confirm(`Mark ${j.job_number} as Work Completed?`))return;const r=await sb.from("service_jobs").update({status:"Work Completed"}).eq("id",j.id);if(r.error)alert(r.error.message);else loadJobs();}
    async function deleteJob(j){if(!j)return;if(!confirm(`Delete job card ${j.job_number}? This cannot be undone.`))return;const r=await sb.from("service_jobs").delete().eq("id",j.id);if(r.error)alert(r.error.message);else loadJobs();}

    document.getElementById("smNew").onclick=async()=>{resetForm();await loadCustomers();document.getElementById("smForm").style.display="block";document.getElementById("smMobile").focus();};
    document.getElementById("smCancel").onclick=()=>{document.getElementById("smForm").style.display="none";resetForm();};
    document.getElementById("smSave").onclick=async()=>{try{msg("Saving…");const cid=await getOrCreateCustomer();const job="SRV-"+new Date().getFullYear()+"-"+Date.now().toString().slice(-6);const p={job_number:job,customer_id:cid,device_type:document.getElementById("smDevice").value.trim()||null,brand:document.getElementById("smBrand").value.trim()||null,model:document.getElementById("smModel").value.trim()||null,serial_number:document.getElementById("smSerial").value.trim()||null,technician_id:document.getElementById("smTech").value.trim()||null,priority:document.getElementById("smPriority").value,status:"Received",complaint:document.getElementById("smComplaint").value.trim()||null,notes:document.getElementById("smNotes").value.trim()||null,estimate_amount:0,advance_amount:0,final_amount:0,balance_amount:0};const r=await sb.from("service_jobs").insert(p);if(r.error)throw r.error;document.getElementById("smForm").style.display="none";resetForm();await loadJobs();alert("Job card created: "+job); }catch(e){msg(e.message||String(e),true);}};
    loadJobs();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
