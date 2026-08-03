const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.querySelector("#experience-graph");
const DRAFTS = {
  ko: "2025년 7월 10일 부산 해운대구 바다식당에서 사장님께 시급 차이를 물었고, 010-1234-5678로 답변을 받았습니다. 계약서와 급여명세서를 함께 보여드린 뒤 차액 120,000원을 받았습니다.",
  vi: "Ngày 10 tháng 7 năm 2025, tại một nhà hàng ở Busan, tôi hỏi chủ lao động về chênh lệch lương theo giờ và nhận được trả lời qua điện thoại. Sau khi cho xem hợp đồng và phiếu lương, tôi đã nhận được khoản chênh lệch 120.000 won.",
  "zh-CN": "2025年7月10日，我在釜山的一家餐厅向雇主询问时薪差额，并通过电话收到了回复。出示合同和工资单后，我收到了12万韩元的差额。",
  th: "เมื่อวันที่ 10 กรกฎาคม 2025 ที่ร้านอาหารแห่งหนึ่งในปูซาน ฉันถามนายจ้างเรื่องส่วนต่างค่าจ้างรายชั่วโมงและได้รับคำตอบทางโทรศัพท์ หลังจากแสดงสัญญาและสลิปเงินเดือน ฉันได้รับเงินส่วนต่าง 120,000 วอน",
  id: "Pada 10 Juli 2025, di sebuah restoran di Busan, saya menanyakan selisih upah per jam kepada pemberi kerja dan menerima jawaban melalui telepon. Setelah menunjukkan kontrak dan slip gaji, saya menerima selisih 120.000 won.",
  en: "On July 10, 2025, at a restaurant in Busan, I asked my employer about the hourly-wage difference and received a reply by phone. After showing the contract and payslip, I received the KRW 120,000 difference.",
};
const REDACTIONS = {
  ko: { phone: "[전화번호 제거]", date: "[정확한 날짜 제거]", amount: "[정확한 금액 제거]", region: "부산 지역", workplace: "음식점" },
  vi: { phone: "[đã xóa số điện thoại]", date: "[đã xóa ngày chính xác]", amount: "[đã xóa số tiền chính xác]", region: "khu vực Busan", workplace: "nhà hàng" },
  "zh-CN": { phone: "[已删除电话号码]", date: "[已删除具体日期]", amount: "[已删除具体金额]", region: "釜山地区", workplace: "餐厅" },
  th: { phone: "[ลบหมายเลขโทรศัพท์แล้ว]", date: "[ลบวันที่ที่แน่นอนแล้ว]", amount: "[ลบจำนวนเงินที่แน่นอนแล้ว]", region: "พื้นที่ปูซาน", workplace: "ร้านอาหาร" },
  id: { phone: "[nomor telepon dihapus]", date: "[tanggal pasti dihapus]", amount: "[jumlah pasti dihapus]", region: "wilayah Busan", workplace: "restoran" },
  en: { phone: "[phone number removed]", date: "[exact date removed]", amount: "[exact amount removed]", region: "Busan area", workplace: "restaurant" },
};
const experiences = [
  {type:"해결 후 남긴 말",outcome:"resolved",title:"처음으로 계산 근거를 물어봤어요",summary:"계약서와 급여명세서를 같이 보내니까 막연히 따지는 기분이 아니었어요. 계산표를 받은 뒤 차액도 확인했습니다.",lesson:"“기록을 보여주면서 물으니 덜 무서웠어요.”",evidence:["근로계약서","급여명세서"],meta:"음식점 근무 · 익명"},
  {type:"대화 중 남긴 말",outcome:"partial",title:"수습기간이라는 답을 받았어요",summary:"예전 같으면 그냥 알겠다고 했을 텐데, 시작일과 끝나는 날을 다시 물었습니다. 아직 답변을 기다리고 있어요.",lesson:"“이번에는 질문을 끝까지 남겨두려고 해요.”",evidence:["고용주 대화","채용공고"],meta:"카페 근무 · 익명"},
  {type:"다음 사람에게",outcome:"unresolved",title:"저는 처음 약속을 남기지 못했어요",summary:"급여명세서는 있었지만 계약서와 채용공고를 보관하지 않아서 비교할 근거가 부족했습니다.",lesson:"“일을 시작하기 전에 공고부터 꼭 저장하세요.”",evidence:["급여명세서"],meta:"편의점 근무 · 익명"},
  {type:"해결 후 남긴 말",outcome:"resolved",title:"다음 달 말고 날짜를 물었어요",summary:"계속 다음 달에 준다는 답만 들었습니다. 입금 기록과 함께 정확한 지급일을 물은 뒤 밀린 금액을 받았어요.",lesson:"“날짜 하나를 묻는 게 이렇게 중요할 줄 몰랐어요.”",evidence:["입금 기록","고용주 대화"],meta:"물류 근무 · 익명"},
  {type:"변화가 시작된 말",outcome:"partial",title:"근무시간 변경을 글로 확인했어요",summary:"말로만 바뀌던 시간을 계약서와 근무표로 비교했습니다. 다음 주부터 원래 시간대로 조정됐어요.",lesson:"“제가 기억을 잘못한 게 아니라는 걸 알았어요.”",evidence:["근로계약서","근무표"],meta:"음식점 근무 · 익명"},
  {type:"다음 사람에게",outcome:"unresolved",title:"답변도 기록이라는 걸 늦게 알았어요",summary:"근무시간은 매일 적었지만 대화를 남기지 않아 왜 바뀌었는지 확인하는 과정이 끊겼습니다.",lesson:"“말로 들은 내용도 메시지로 다시 확인하세요.”",evidence:["근무 기록"],meta:"물류 근무 · 익명"}
  ,{type:"해결 후 남긴 말",outcome:"resolved",title:"입금액을 월별로 다시 맞춰봤어요",summary:"계약 시급과 통장 입금액을 월별로 정리해 계산표를 요청했고, 빠진 차액을 확인했습니다.",lesson:"“한 달씩 나누어 보니 어디서 달라졌는지 보였어요.”",evidence:["근로계약서","입금 기록"],meta:"제조업 근무 · 익명"}
  ,{type:"대화 중 남긴 말",outcome:"partial",title:"나눠 준다는 날짜를 모두 적었어요",summary:"밀린 급여를 두 번에 나누어 준다는 답을 받고 각 지급 예정일과 금액을 메시지로 확인했습니다.",lesson:"“약속이 바뀔 때마다 새 날짜를 남겼어요.”",evidence:["입금 기록","고용주 대화"],meta:"숙박업 근무 · 익명"}
  ,{type:"변화가 시작된 말",outcome:"partial",title:"쉬기로 한 날도 근무표와 비교했어요",summary:"채용공고에 적힌 휴일과 실제 근무표를 비교해 휴일 근무 횟수를 줄였습니다.",lesson:"“일한 날뿐 아니라 쉬기로 한 날도 기록하세요.”",evidence:["채용공고","근무표"],meta:"농축산업 근무 · 익명"}
  ,{type:"해결 후 남긴 말",outcome:"resolved",title:"공제 내역을 한 줄씩 물어봤어요",summary:"급여명세서의 공제액과 실제 입금액이 달라 항목별 계산 근거를 요청해 수정된 명세서를 받았습니다.",lesson:"“총액보다 항목을 하나씩 확인하는 게 쉬웠어요.”",evidence:["급여명세서","입금 기록"],meta:"사무 보조 · 익명"}
  ,{type:"다음 사람에게",outcome:"unresolved",title:"휴게시간을 따로 적지 못했어요",summary:"출퇴근 시간은 남겼지만 실제로 쉰 시간이 없어 휴게시간을 정확히 비교하기 어려웠습니다.",lesson:"“출퇴근뿐 아니라 실제로 쉰 시간도 적어두세요.”",evidence:["출퇴근 기록"],meta:"주방 보조 · 익명"}
  ,{type:"대화 중 남긴 말",outcome:"partial",title:"야간 근무 시간을 따로 모았어요",summary:"근무표에서 밤 시간대만 따로 표시해 가산수당 계산 기준을 서면으로 물었습니다.",lesson:"“같은 근무시간이라도 야간 시간을 분리해야 했어요.”",evidence:["근무표","급여명세서"],meta:"물류센터 근무 · 익명"}
  ,{type:"해결 후 남긴 말",outcome:"resolved",title:"급여일과 실제 입금일을 비교했어요",summary:"계약서의 급여일과 통장 입금일을 나란히 정리해 반복되던 지급 지연을 확인했습니다.",lesson:"“입금된 날짜도 근로 기록의 일부였어요.”",evidence:["근로계약서","입금 기록"],meta:"판매직 근무 · 익명"}
  ,{type:"변화가 시작된 말",outcome:"partial",title:"업무가 바뀐 시점을 메시지로 남겼어요",summary:"채용공고와 다른 업무를 맡기 시작한 날짜를 적고 변경 이유와 적용 기간을 질문했습니다.",lesson:"“무슨 일을 했는지보다 언제 바뀌었는지도 중요했어요.”",evidence:["채용공고","고용주 대화"],meta:"서비스업 근무 · 익명"}
  ,{type:"다음 사람에게",outcome:"unresolved",title:"구두 약속만 믿고 시작했어요",summary:"근무 요일과 시급을 말로만 듣고 시작해 나중에 달라진 조건을 증명할 자료가 부족했습니다.",lesson:"“첫 출근 전 약속을 메시지로 다시 확인하세요.”",evidence:["구두 약속 메모"],meta:"건설 보조 · 익명"}
];

function seeded(index, salt) { const value=Math.sin(index*91.73+salt*17.19)*43758.5453; return value-Math.floor(value); }
function makeSvg(name,attrs={}) { const element=document.createElementNS(SVG_NS,name); Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,String(value))); return element; }

function createNetwork() {
  const centers=[[320,210],[450,155],[580,210],[370,370],[530,370]];
  const points=Array.from({length:15},(_,index)=>{const cluster=index%5;const [cx,cy]=centers[cluster];const angle=seeded(index,2)*Math.PI*2;const distance=35+seeded(index,3)*105;return{x:cx+Math.cos(angle)*distance,y:cy+Math.sin(angle)*distance*.72,cluster,important:index%5===0};});
  const edgeLayer=makeSvg("g",{class:"impact-edges"}); const nodeLayer=makeSvg("g",{class:"impact-nodes"});
  points.forEach((point,index)=>{points.map((other,otherIndex)=>({other,otherIndex,distance:Math.hypot(point.x-other.x,point.y-other.y)})).filter(item=>item.otherIndex!==index).sort((a,b)=>a.distance-b.distance).slice(0,index%8===0?6:4).forEach(({other,otherIndex})=>{if(otherIndex<index)return;edgeLayer.append(makeSvg("line",{x1:point.x,y1:point.y,x2:other.x,y2:other.y,class:index%13===0?"is-helpful":""}));});});
  points.forEach((point,index)=>{if(index%3===0){const other=points[(index*7+29)%points.length];edgeLayer.append(makeSvg("path",{d:`M ${point.x} ${point.y} Q ${(point.x+other.x)/2+35} ${(point.y+other.y)/2-28} ${other.x} ${other.y}`,class:"cross-link"}));}});
  points.forEach((point,index)=>{const classes=[];if(point.important)classes.push("is-impact");if(index>=12)classes.push("is-recent");const circle=makeSvg("circle",{cx:point.x,cy:point.y,r:point.important?6.5:3.2+seeded(index,5)*1.8,class:classes.join(" ")});nodeLayer.append(circle);});
  svg.replaceChildren(edgeLayer,nodeLayer);
}

function renderExperienceCards() {
  const items=[...experiences,...experiences];
  document.querySelector("#experience-card-list").replaceChildren(...items.map((item,index)=>{const card=document.createElement("article");card.className="experience-card";if(index>=experiences.length)card.setAttribute("aria-hidden","true");card.innerHTML=`<header><span>${item.meta}</span><b class="outcome-${item.outcome}">${item.type}</b></header><h3>${item.title}</h3><p>${item.summary}</p><div class="experience-evidence">${item.evidence.map(value=>`<span>${value}</span>`).join("")}</div><strong>${item.lesson}</strong>`;return card;}));
}

document.querySelector("#show-path").addEventListener("click",()=>document.querySelector(".experience-cards").scrollIntoView({behavior:"smooth"}));
const draft = document.querySelector("#experience-draft");
const saveExperienceButton = document.querySelector("#save-experience");
const saveStatus = document.querySelector("#experience-save-status");
const savedList = document.querySelector("#saved-experience-list");
const savedCount = document.querySelector("#saved-experience-count");
const savedPanel = document.querySelector(".saved-experiences");
const shareExperienceButton = document.createElement("button");
shareExperienceButton.type = "button";
shareExperienceButton.className = "share-confirmed-experience";
shareExperienceButton.textContent = "공유하기";
shareExperienceButton.hidden = true;
saveExperienceButton.insertAdjacentElement("afterend", shareExperienceButton);
savedPanel.hidden = true;
const autoDraftTopic = document.querySelector("#auto-draft-topic");
const anonymizeResult = document.querySelector("#anonymize-result");
const workplaceId = window.sessionStorage.getItem("workplace_id") || "demo-e2e";
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
let generatedDraft = null;
let anonymizedDraft = "";
if (false) {
if (Object.values(DRAFTS).includes(draft.value.trim())) draft.value = DRAFTS[currentLanguage()];

document.addEventListener("userlanguagechange", (event) => {
  if (Object.values(DRAFTS).includes(draft.value.trim())) {
    draft.value = DRAFTS[event.detail.language] || DRAFTS.ko;
  }
});

document.querySelector("#preview-anonymize").addEventListener("click",()=>{
  const labels = REDACTIONS[currentLanguage()];
  let text=draft.value;
  text=text
    .replace(/01[016789][ -]?\d{3,4}[ -]?\d{4}/g,labels.phone)
    .replace(/20\d{2}년\s*\d{1,2}월\s*\d{1,2}일|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}|\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+20\d{2}|20\d{2}年\d{1,2}月\d{1,2}日|\d{1,2}\s+กรกฎาคม\s+20\d{2}|\d{1,2}\s+Juli\s+20\d{2}/gi,labels.date)
    .replace(/(?:KRW\s*)?\d{1,3}(?:[,.]\d{3})+(?:\s*(?:원|won|วอน))?/gi,labels.amount)
    .replace(/부산\s*해운대구|Busan|釜山|ปูซาน/gi,labels.region)
    .replace(/바다식당|restaurant|nhà hàng|餐厅|ร้านอาหาร|restoran/gi,labels.workplace);
  const result=document.querySelector("#anonymize-result");
  result.hidden=false;
  result.querySelector("p").textContent=text;
  anonymizedDraft=text;
  saveExperienceButton.disabled=!consent.checked;
});

draft.addEventListener("input",()=>{
  anonymizedDraft="";
  document.querySelector("#anonymize-result").hidden=true;
  saveExperienceButton.disabled=true;
  saveStatus.textContent="";
});
consent.addEventListener("change",()=>{saveExperienceButton.disabled=!(consent.checked&&anonymizedDraft);});
}

const PROBLEM_NAMES={hourly_wage_difference:"시급 차이",delayed_payment:"급여 지급 지연",working_hours_changed:"근무시간 변경",weekly_holiday_pay:"주휴수당",other:"기타"};
const OUTCOME_NAMES={in_progress:"확인 중",resolved:"해결됨",partially_resolved:"일부 해결",unresolved:"미해결"};

async function request(path,options={}){
  const response=await fetch(`${API_BASE}${path}`,options);
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body?.success)throw new Error(body?.error?.message||"요청을 처리하지 못했습니다.");
  return body.data;
}

function renderSavedExperiences(items){
  savedCount.textContent=`${items.length}건`;
  if(!items.length){savedList.innerHTML="<li>아직 저장한 경험이 없어요.</li>";return;}
  savedList.replaceChildren(...items.map(item=>{const row=document.createElement("li");const title=document.createElement("strong");title.textContent=`${PROBLEM_NAMES[item.problem_type]||item.problem_type} · ${OUTCOME_NAMES[item.outcome]||item.outcome}`;const text=document.createElement("span");text.textContent=item.anonymized_text;row.append(title,text);return row;}));
}

async function loadSavedExperiences(){
  try{const data=await request(`/community/experiences?workplace_id=${encodeURIComponent(workplaceId)}`);renderConfirmedExperiences(data.experiences);return data.experiences;}
  catch(error){savedList.innerHTML=`<li>${error.message}</li>`;}
  return [];
}

function renderConfirmedExperiences(items){
  savedCount.textContent=`${items.length}건`;
  if(!items.length){shareExperienceButton.hidden=true;return;}
  const current=items[0];
  shareExperienceButton.hidden=false;
  shareExperienceButton.dataset.experienceId=current.experience_id;
  shareExperienceButton.disabled=current.is_shared;
  shareExperienceButton.textContent=current.is_shared?"공유됨":"공유하기";
  savedList.replaceChildren(...items.map(item=>{
    const row=document.createElement("li");
    const title=document.createElement("strong");
    title.textContent=`${PROBLEM_NAMES[item.problem_type]||item.problem_type} · ${OUTCOME_NAMES[item.outcome]||item.outcome}`;
    const body=document.createElement("span");body.textContent=item.anonymized_text;
    const action=document.createElement("button");action.type="button";action.className="share-confirmed-experience";action.dataset.experienceId=item.experience_id;action.disabled=item.is_shared;action.textContent=item.is_shared?"공유됨":"공유하기";
    row.append(title,body,action);return row;
  }));
}

savedList.addEventListener("click",async(event)=>{
  const button=event.target.closest(".share-confirmed-experience");
  if(!button||button.disabled)return;
  button.disabled=true;button.textContent="공유 중...";
  try{
    const data=await request(`/community/experiences/${encodeURIComponent(button.dataset.experienceId)}/share`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workplace_id:workplaceId})});
    saveStatus.textContent=data.notice;await loadSavedExperiences();
  }catch(error){saveStatus.textContent=error.message;button.disabled=false;button.textContent="공유하기";}
});

shareExperienceButton.addEventListener("click",async()=>{
  if(shareExperienceButton.disabled)return;
  shareExperienceButton.disabled=true;shareExperienceButton.textContent="공유 중...";
  try{
    const data=await request(`/community/experiences/${encodeURIComponent(shareExperienceButton.dataset.experienceId)}/share`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workplace_id:workplaceId})});
    saveStatus.textContent=data.notice;await loadSavedExperiences();
  }catch(error){saveStatus.textContent=error.message;shareExperienceButton.disabled=false;shareExperienceButton.textContent="공유하기";}
});

if (false) saveExperienceButton.addEventListener("click",async()=>{
  if(!anonymizedDraft||!consent.checked)return;
  saveExperienceButton.disabled=true;
  saveStatus.textContent="익명화된 경험을 저장하고 있어요.";
  try{
    const data=await request("/community/experiences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workplace_id:workplaceId,problem_type:document.querySelector("#experience-problem").value,outcome:document.querySelector("#experience-outcome").value,text:anonymizedDraft,evidence_types:[],consent_to_store:true})});
    saveStatus.textContent="내 경험으로 확정했어요. 아래 목록에서 공유 여부를 결정할 수 있어요.";
    consent.checked=false;
    anonymizedDraft="";
    await loadSavedExperiences();
  }catch(error){saveStatus.textContent=error.message;saveExperienceButton.disabled=false;}
});

async function loadAutomaticDraft(){
  saveExperienceButton.disabled=true;
  saveStatus.textContent="내 기록과 대화를 확인하고 있어요.";
  try{
    generatedDraft=await request(`/community/experience-draft?workplace_id=${encodeURIComponent(workplaceId)}`);
    draft.value=generatedDraft.text;
    autoDraftTopic.textContent=PROBLEM_NAMES[generatedDraft.problem_type]||"기록 확인 경험";
    const preview=await request("/community/anonymize-preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:generatedDraft.text})});
    anonymizedDraft=preview.anonymized_text;
    anonymizeResult.hidden=false;
    anonymizeResult.querySelector("p").textContent=anonymizedDraft;
    saveExperienceButton.disabled=!preview.safe_to_preview;
    saveStatus.textContent=preview.safe_to_preview?"내용을 확인한 뒤 확정해 주세요.":"식별될 수 있는 표현이 있어 자동 저장을 멈췄어요.";
  }catch(error){
    draft.value="";
    autoDraftTopic.textContent="초안을 만들 수 없음";
    saveStatus.textContent=error.message;
  }
}

async function initializeExperience(){
  draft.readOnly=false;
  const saved=await loadSavedExperiences();
  if(saved.length){
    const item=saved[0];
    generatedDraft={problem_type:item.problem_type,outcome:item.outcome,text:item.anonymized_text};
    draft.value=item.anonymized_text;
    anonymizedDraft=item.anonymized_text;
    anonymizeResult.querySelector("p").textContent=item.anonymized_text;
    autoDraftTopic.textContent=PROBLEM_NAMES[item.problem_type]||"내 경험";
    saveExperienceButton.disabled=false;
    saveExperienceButton.textContent="수정 내용 확정하기";
    saveStatus.textContent=item.is_shared?"공유된 경험입니다. 수정 후 다시 확정하면 공유가 해제돼요.":"내용을 수정하거나 바로 공유할 수 있어요.";
    return;
  }
  await loadAutomaticDraft();
}

draft.addEventListener("input",()=>{
  anonymizedDraft="";
  saveExperienceButton.disabled=draft.value.trim().length<10;
  saveExperienceButton.textContent="수정 내용 확정하기";
  saveStatus.textContent="수정한 내용은 다시 확정해야 반영돼요.";
});

saveExperienceButton.addEventListener("click",async()=>{
  if(!generatedDraft||draft.value.trim().length<10)return;
  saveExperienceButton.disabled=true;
  saveStatus.textContent="확정한 경험을 저장하고 있어요.";
  try{
    const preview=await request("/community/anonymize-preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:draft.value.trim()})});
    if(!preview.safe_to_preview)throw new Error("식별될 수 있는 표현을 수정한 뒤 다시 확정해 주세요.");
    anonymizedDraft=preview.anonymized_text;
    anonymizeResult.querySelector("p").textContent=anonymizedDraft;
    const data=await request("/community/experiences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workplace_id:workplaceId,problem_type:generatedDraft.problem_type,outcome:generatedDraft.outcome||"in_progress",text:anonymizedDraft,evidence_types:[],consent_to_store:true})});
    saveStatus.textContent="내 경험으로 확정했어요. 아래 목록에서 공유 여부를 결정할 수 있어요.";
    saveExperienceButton.textContent="수정 내용 확정하기";
    saveExperienceButton.disabled=false;
    await loadSavedExperiences();
  }catch(error){
    saveStatus.textContent=error.message;
    saveExperienceButton.disabled=false;
  }
});

createNetwork(); renderExperienceCards(); initializeExperience();
if(new URLSearchParams(window.location.search).get("from")==="completed"){
  document.querySelector(".share-preview").scrollIntoView({behavior:"smooth",block:"center"});
}
