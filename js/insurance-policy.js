/* iTech Vehicle Insurance: free browser-side PDF text extraction + OCR. No OpenAI/API credits required. */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let pdfJsPromise=null, tesseractPromise=null;

  function addUi(){
    if(!$('viForm')||$('policyPdf'))return;
    const actions=$('saveBtn')?.parentElement;
    if(!actions)return;
    const block=document.createElement('div');
    block.className='vi-note'; block.style.margin='12px 0';
    block.innerHTML='<b>📄 Policy PDF + Free OCR</b><br><small>Upload a policy PDF. The browser reads the PDF locally and fills the available fields automatically. No OpenAI API, API key or credits are required. Review the values before saving.</small><div style="margin-top:9px"><input id="policyPdf" type="file" accept="application/pdf"></div><div id="policyAiStatus" style="margin-top:8px"></div>';
    actions.parentElement.insertBefore(block,actions);
    $('policyPdf').addEventListener('change',()=>{
      const f=$('policyPdf').files?.[0];
      if(f){ $('policyAiStatus').textContent='PDF selected. Reading policy locally…'; analyzeSelectedPolicy().catch(err=>{ $('policyAiStatus').innerHTML='<b style="color:#b91c1c">PDF extraction failed:</b> '+esc(err.message||err); }); }
    });
  }

  function loadScript(src, globalName){
    if(globalName && window[globalName])return Promise.resolve(window[globalName]);
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src===src);
      if(existing){existing.addEventListener('load',()=>resolve(window[globalName]));existing.addEventListener('error',()=>reject(new Error('Unable to load OCR library.')));return;}
      const s=document.createElement('script'); s.src=src; s.async=true;
      s.onload=()=>resolve(window[globalName]); s.onerror=()=>reject(new Error('Unable to load OCR library. Please check your internet connection.'));
      document.head.appendChild(s);
    });
  }

  async function loadPdfJs(){
    if(pdfJsPromise)return pdfJsPromise;
    pdfJsPromise=loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib').then(lib=>{
      lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      return lib;
    });
    return pdfJsPromise;
  }

  async function loadTesseract(){
    if(tesseractPromise)return tesseractPromise;
    tesseractPromise=loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js','Tesseract');
    return tesseractPromise;
  }

  function normalizeDate(v){
    if(!v)return '';
    const s=String(v).trim().replace(/\b(?:00:00|23:59|00:00:00|23:59:59)\b/g,'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    let m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    m=s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
    if(m)return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    return '';
  }

  function clean(v){return String(v??'').replace(/[\u00a0\t]+/g,' ').replace(/\s{2,}/g,' ').trim();}
  function firstMatch(text, patterns){
    for(const re of patterns){const m=text.match(re);if(m&&m[1])return clean(m[1]);}
    return '';
  }

  function extractPolicyFields(text){
    const t=String(text||'').replace(/\r/g,'\n');
    const flat=t.replace(/\n+/g,'\n');
    const x={
      customer_name:firstMatch(flat,[
        /(?:customer|insured|policy\s*holder|name\s+of\s+insured)\s*[:\-]\s*([^\n]{2,80})/i,
        /(?:proposer\s*name|insured\s*name)\s*[:\-]?\s*([^\n]{2,80})/i
      ]),
      mobile:firstMatch(flat,[
        // Common labelled formats: Mobile No, Mobile Number, Contact No, Phone, etc.
        /(?:mobile|mob(?:ile)?|phone|contact)\s*(?:number|no\.?|#)?\s*[:\-]?\s*(?:\+?91[\s().-]*)?([6-9]\d[\s.-]?\d{4}[\s.-]?\d{4})/i,
        // Some PDF text extractors put the label and value on separate lines.
        /(?:mobile|mob(?:ile)?|phone|contact)\s*(?:number|no\.?|#)?\s*[:\-]?\s*\n\s*(?:\+?91[\s().-]*)?([6-9]\d[\s.-]?\d{4}[\s.-]?\d{4})/i
      ]),
      vehicle_number:firstMatch(flat,[
        /(?:vehicle\s*(?:registration|reg(?:istration)?|number|no\.?|#)|registration\s*(?:number|no\.?|#)|regn?\.?\s*(?:no\.?|number))\s*[:\-]?\s*([A-Z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?[0-9]{3,4})/i
      ]),
      insurance_company:firstMatch(flat,[
        /(?:insurance\s*company|insurer|company\s*name)\s*[:\-]?\s*([^\n]{2,100})/i,
        /\b(The\s+(?:Oriental|New\s+India|National|United\s+India)\s+Insurance\s+Company(?:\s+Limited)?)\b/i,
        /\b((?:Oriental|New\s+India|National|United\s+India)\s+Insurance\s+Company(?:\s+Limited)?)\b/i
      ]),
      policy_number:firstMatch(flat,[
        /(?:policy\s*(?:number|no\.?|#)|policy\s*no)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/.\-_]{3,50})/i
      ]),
      vehicle_type:firstMatch(flat,[
        /(?:vehicle\s*type|class\s*of\s*vehicle|vehicle\s*category)\s*[:\-]?\s*([^\n]{2,60})/i,
        /\b(TWO\s*WHEELER)\b/i,
        /\b(FOUR\s*WHEELER)\b/i,
        /\b(MOTORCYCLE|MOTOR\s*CYCLE)\b/i,
        /\b(SCOOTER)\b/i,
        /\b(PRIVATE\s*CAR|CAR)\b/i
      ]),
      policy_start_date:firstMatch(flat,[
        /(?:policy\s*(?:start|from|inception)|period\s*from|effective\s*date)\s*[:\-]?\s*(?:from\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2})/i,
        /(?:period\s+of\s+insurance|insurance\s+period|period)\s*[:\-]?\s*(?:from\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2})/i
      ]),
      expiry_date:firstMatch(flat,[
        /(?:policy\s*(?:expiry|end|to)|period\s*(?:to|upto|up\s*to)|valid\s*(?:till|upto|up\s*to)|expiry\s*date)\s*[:\-]?\s*(?:to\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2})/i,
        /(?:period\s+of\s+insurance|insurance\s+period|period)\s*[:\-]?\s*(?:from\s*)?\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}\s+(?:to|upto|up\s*to|[-–—])\s*(?:to\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2})/i
      ]),
      premium_amount:firstMatch(flat,[
        /(?:total\s*premium|premium\s*(?:amount|payable)?|gross\s*premium)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i
      ]),
      remarks:''
    };

    // Common policy layouts have dates on a "Period" line without explicit labels.
    if(!x.policy_start_date || !x.expiry_date){
      const m=flat.match(/(?:period\s+of\s+insurance|insurance\s+period|period)\s*[:\-]?\s*(?:from\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\s+(?:to|upto|up\s*to|[-–—])\s*(?:to\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})/i);
      if(m){x.policy_start_date=x.policy_start_date||m[1];x.expiry_date=x.expiry_date||m[2];}
    }

    // Strong date fallback for insurer layouts such as:
    // "Period of Insurance : FROM 07-09-2026 00:00 TO 06-09-2027 23:59".
    {
      const pm=flat.match(/(?:period\s+of\s+insurance|insurance\s+period)\s*[:\-]?\s*(?:from\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\s+(?:to|upto|up\s*to|[-–—])\s*(?:to\s*)?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})/i);
      if(pm){
        x.policy_start_date=x.policy_start_date||normalizeDate(pm[1]);
        x.expiry_date=x.expiry_date||normalizeDate(pm[2]);
      }
    }

    // Fallback: locate likely Indian vehicle registration number anywhere in the document.
    if(!x.vehicle_number){
      const m=flat.match(/\b([A-Z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?[0-9]{3,4})\b/i);
      if(m)x.vehicle_number=clean(m[1]).toUpperCase();
    } else x.vehicle_number=x.vehicle_number.toUpperCase();
    if(x.mobile)x.mobile=x.mobile.replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');

    // Strong fallback for policies where the label is missing/mangled in PDF extraction.
    // Prefer a 10-digit Indian mobile candidate (6-9 start), while avoiding obvious
    // policy/vehicle/date numbers. This is only used when the labelled match failed.
    if(!x.mobile){
      const mobileCandidates=[...flat.matchAll(/(?:^|[^0-9])(?:\+?91[\s().-]*)?([6-9]\d{9})(?![0-9])/g)]
        .map(m=>m[1])
        .filter(n=>n.length===10);
      if(mobileCandidates.length===1) x.mobile=mobileCandidates[0];
      else if(mobileCandidates.length>1){
        const labelled=mobileCandidates.find(n=>{
          const idx=flat.indexOf(n);
          const near=flat.slice(Math.max(0,idx-100),idx).toLowerCase();
          return /(mobile|mob|phone|contact)/.test(near);
        });
        x.mobile=labelled||mobileCandidates[0];
      }
    }
    // Strong insurer/company fallback for policy schedules where there is no
    // explicit 'Insurance Company' label.
    if(!x.insurance_company){
      const cm=flat.match(/\b(The\s+(?:Oriental|New\s+India|National|United\s+India)\s+Insurance\s+Company(?:\s+Limited)?)\b/i);
      if(cm)x.insurance_company=clean(cm[1]);
    }

    // Strong vehicle-type fallback for Indian motor policy schedules.
    // Prefer the actual vehicle class/title over unrelated words such as 'vehicle'.
    if(!x.vehicle_type){
      if(/\bTWO\s*WHEELER\b/i.test(flat)) x.vehicle_type='Two Wheeler';
      else if(/\bFOUR\s*WHEELER\b/i.test(flat)) x.vehicle_type='Four Wheeler';
      else if(/\bMOTORCYCLE\b/i.test(flat)) x.vehicle_type='Motorcycle';
      else if(/\bSCOOTER\b/i.test(flat)) x.vehicle_type='Scooter';
      else if(/\bPRIVATE\s*CAR\b/i.test(flat)) x.vehicle_type='Car';
    }

    if(x.premium_amount)x.premium_amount=x.premium_amount.replace(/,/g,'');
    x.policy_start_date=normalizeDate(x.policy_start_date);
    x.expiry_date=normalizeDate(x.expiry_date);

    const useful=['customer_name','vehicle_number','insurance_company','policy_number','vehicle_type','policy_start_date','expiry_date','premium_amount'];
    const count=useful.filter(k=>x[k]).length;
    if(count<2){
      // A simple line-label fallback helps with PDFs whose text extraction puts the value on the next line.
      const lines=flat.split('\n').map(clean).filter(Boolean);
      const getAfterLabel=(labels)=>{
        for(let i=0;i<lines.length;i++){
          if(labels.some(l=>new RegExp('^'+l+'\\s*:?[ ]*$','i').test(lines[i])) && lines[i+1])return lines[i+1];
        }
        return '';
      };
      x.customer_name=x.customer_name||getAfterLabel(['customer name','insured name','policy holder']);
      x.insurance_company=x.insurance_company||getAfterLabel(['insurance company','insurer']);
      x.policy_number=x.policy_number||getAfterLabel(['policy number','policy no']);
      x.vehicle_type=x.vehicle_type||getAfterLabel(['vehicle type']);
    }
    return x;
  }

  async function extractPdfText(file,onProgress){
    const pdfjs=await loadPdfJs();
    const data=new Uint8Array(await file.arrayBuffer());
    const pdf=await pdfjs.getDocument({data}).promise;
    let text='';
    const maxPages=Math.min(pdf.numPages,20);
    for(let i=1;i<=maxPages;i++){
      onProgress?.(`Reading PDF page ${i} of ${maxPages}…`);
      const page=await pdf.getPage(i);
      const content=await page.getTextContent();
      const pageText=content.items.map(item=>item.str||'').join(' ');
      text+=`\n${pageText}`;
    }
    return {text,pdf,maxPages};
  }

  async function ocrPdf(file,onProgress,pdfInfo){
    const T=await loadTesseract();
    const worker=await T.createWorker('eng',1,{logger:m=>{
      if(m.status && typeof m.progress==='number')onProgress?.(`OCR: ${m.status} ${Math.round(m.progress*100)}%`);
    }});
    let text='';
    const pdf=pdfInfo?.pdf || (await extractPdfText(file,onProgress)).pdf;
    const maxPages=Math.min(pdf.numPages,10);
    try{
      for(let i=1;i<=maxPages;i++){
        onProgress?.(`OCR reading page ${i} of ${maxPages}…`);
        const page=await pdf.getPage(i);
        const viewport=page.getViewport({scale:1.8});
        const canvas=document.createElement('canvas');
        canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        await page.render({canvasContext:ctx,viewport}).promise;
        const result=await worker.recognize(canvas);
        text+=`\n${result.data.text||''}`;
        canvas.width=1;canvas.height=1;
      }
    }finally{await worker.terminate();}
    return text;
  }

  function applyExtracted(x){
    const mapping={customer_name:'customer_name',vehicle_number:'vehicle_number',expiry_date:'expiry_date',insurance_company:'insurance_company',policy_number:'policy_number',vehicle_type:'vehicle_type',policy_start_date:'policy_start_date',premium_amount:'premium_amount',remarks:'remarks'};
    Object.entries(mapping).forEach(([field,key])=>{
      const el=$(field); if(!el || x?.[key]==null || x[key]==='')return;
      const value=(field==='expiry_date'||field==='policy_start_date')?normalizeDate(x[key]):x[key];
      if(value!=='')el.value=value;
    });
    if($('customer_name')){$('customer_name').readOnly=false;$('customer_name').style.background='';}
  }

  async function analyzeSelectedPolicy(){
    const file=$('policyPdf')?.files?.[0];
    if(!file) return {};
    if(file.type && file.type!=='application/pdf' && !/\.pdf$/i.test(file.name))throw new Error('Please select a PDF policy file.');
    const status=$('policyAiStatus');
    const progress=msg=>{if(status)status.textContent=msg;};
    progress('Reading PDF locally…');
    const info=await extractPdfText(file,progress);
    let text=info.text||'';
    let extracted=extractPolicyFields(text);
    const useful=['customer_name','vehicle_number','insurance_company','policy_number','vehicle_type','policy_start_date','expiry_date','premium_amount'];
    let count=useful.filter(k=>extracted[k]).length;
    if(count<3 || text.replace(/\s/g,'').length<80){
      progress('PDF appears scanned. Starting free OCR…');
      const ocrText=await ocrPdf(file,progress,info);
      text=text+'\n'+ocrText;
      extracted=extractPolicyFields(text);
    }
    applyExtracted(extracted);
    const found=useful.filter(k=>extracted[k]).length;
    if(status)status.innerHTML=`<b style="color:#0a7a43">✓ Free extraction complete.</b> ${found} field${found===1?'':'s'} found locally. Please review and save.`;
    return extracted;
  }

  async function uploadPolicyOnly(recordId, aiData){
    const file=$('policyPdf')?.files?.[0]; if(!file||!recordId)return;
    const status=$('policyAiStatus'); if(status)status.textContent='Saving policy PDF…';
    const path=`${recordId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const up=await sb.storage.from('insurance-policies').upload(path,file,{contentType:'application/pdf',upsert:true});
    if(up.error)throw up.error;
    const upd=await sb.from('vehicle_insurance').update({policy_pdf_path:path,policy_pdf_name:file.name,ai_extracted_data:aiData||{},ai_extraction_status:aiData?'review':'manual'}).eq('id',recordId);
    if(upd.error)throw upd.error;
    if(status)status.innerHTML=aiData?'<b style="color:#0a7a43">✓ Policy PDF saved. The form values are saved only after you click Save/Update.</b>':'<b style="color:#0a7a43">✓ Policy PDF saved.</b>';
  }

  async function uploadAndAnalyze(recordId){
    const file=$('policyPdf')?.files?.[0]; if(!file||!recordId)return {};
    const extracted=await analyzeSelectedPolicy();
    await uploadPolicyOnly(recordId,extracted);
    return extracted;
  }

  async function openPolicyPdf(path){
    if(!path) throw new Error('No policy PDF is attached to this record.');
    const popup=window.open('about:blank','_blank');
    const result=await sb.storage.from('insurance-policies').createSignedUrl(path,3600);
    if(result.error || !result.data?.signedUrl){ if(popup) popup.close(); throw (result.error || new Error('Unable to create policy PDF link.')); }
    if(popup){ popup.location.href=result.data.signedUrl; } else { window.location.href=result.data.signedUrl; }
    return result.data.signedUrl;
  }

  async function uploadPolicyFile(recordId,file){
    if(!recordId || !file) throw new Error('Policy record or PDF file is missing.');
    if(file.type && file.type!=='application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('Please select a PDF policy file.');
    const path=`${recordId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const up=await sb.storage.from('insurance-policies').upload(path,file,{contentType:'application/pdf',upsert:true});
    if(up.error) throw up.error;
    const upd=await sb.from('vehicle_insurance').update({policy_pdf_path:path,policy_pdf_name:file.name,ai_extraction_status:'manual'}).eq('id',recordId);
    if(upd.error){await sb.storage.from('insurance-policies').remove([path]).catch(()=>{});throw upd.error;}
    return path;
  }

  async function deleteInsuranceRecord(record){
    if(!record?.id) throw new Error('Insurance record not found.');
    if(record.policy_pdf_path){
      const rm=await sb.storage.from('insurance-policies').remove([record.policy_pdf_path]);
      if(rm.error) throw rm.error;
    }
    const del=await sb.from('vehicle_insurance').delete().eq('id',record.id);
    if(del.error) throw del.error;
  }

  window.openPolicyPdf=openPolicyPdf;
  window.itechOpenPolicyPdf=openPolicyPdf;
  window.itechUploadInsurancePolicyFile=uploadPolicyFile;
  window.itechDeleteInsuranceRecord=deleteInsuranceRecord;
  window.itechAnalyzeSelectedInsurancePolicy=analyzeSelectedPolicy;
  window.itechUploadInsurancePolicy=uploadPolicyOnly;
  window.itechInsuranceUploadAnalyze=uploadAndAnalyze;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addUi);else addUi();
})();
