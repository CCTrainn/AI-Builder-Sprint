const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.querySelector("#experience-graph");
const experiences = [
  {type:"해결 후 남긴 말",outcome:"resolved",title:"처음으로 계산 근거를 물어봤어요",summary:"계약서와 급여명세서를 같이 보내니까 막연히 따지는 기분이 아니었어요. 계산표를 받은 뒤 차액도 확인했습니다.",lesson:"“기록을 보여주면서 물으니 덜 무서웠어요.”",evidence:["근로계약서","급여명세서"],meta:"음식점 근무 · 익명"},
  {type:"대화 중 남긴 말",outcome:"partial",title:"수습기간이라는 답을 받았어요",summary:"예전 같으면 그냥 알겠다고 했을 텐데, 시작일과 끝나는 날을 다시 물었습니다. 아직 답변을 기다리고 있어요.",lesson:"“이번에는 질문을 끝까지 남겨두려고 해요.”",evidence:["고용주 대화","채용공고"],meta:"카페 근무 · 익명"},
  {type:"다음 사람에게",outcome:"unresolved",title:"저는 처음 약속을 남기지 못했어요",summary:"급여명세서는 있었지만 계약서와 채용공고를 보관하지 않아서 비교할 근거가 부족했습니다.",lesson:"“일을 시작하기 전에 공고부터 꼭 저장하세요.”",evidence:["급여명세서"],meta:"편의점 근무 · 익명"},
  {type:"해결 후 남긴 말",outcome:"resolved",title:"다음 달 말고 날짜를 물었어요",summary:"계속 다음 달에 준다는 답만 들었습니다. 입금 기록과 함께 정확한 지급일을 물은 뒤 밀린 금액을 받았어요.",lesson:"“날짜 하나를 묻는 게 이렇게 중요할 줄 몰랐어요.”",evidence:["입금 기록","고용주 대화"],meta:"물류 근무 · 익명"},
  {type:"변화가 시작된 말",outcome:"partial",title:"근무시간 변경을 글로 확인했어요",summary:"말로만 바뀌던 시간을 계약서와 근무표로 비교했습니다. 다음 주부터 원래 시간대로 조정됐어요.",lesson:"“제가 기억을 잘못한 게 아니라는 걸 알았어요.”",evidence:["근로계약서","근무표"],meta:"음식점 근무 · 익명"},
  {type:"다음 사람에게",outcome:"unresolved",title:"답변도 기록이라는 걸 늦게 알았어요",summary:"근무시간은 매일 적었지만 대화를 남기지 않아 왜 바뀌었는지 확인하는 과정이 끊겼습니다.",lesson:"“말로 들은 내용도 메시지로 다시 확인하세요.”",evidence:["근무 기록"],meta:"물류 근무 · 익명"}
];

function seeded(index, salt) { const value=Math.sin(index*91.73+salt*17.19)*43758.5453; return value-Math.floor(value); }
function makeSvg(name,attrs={}) { const element=document.createElementNS(SVG_NS,name); Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,String(value))); return element; }

function createNetwork() {
  const centers=[[320,210],[450,155],[580,210],[370,370],[530,370]];
  const points=Array.from({length:128},(_,index)=>{const cluster=index%5;const [cx,cy]=centers[cluster];const angle=seeded(index,2)*Math.PI*2;const distance=18+seeded(index,3)*112;return{x:cx+Math.cos(angle)*distance,y:cy+Math.sin(angle)*distance*.72,cluster,important:index%19===0};});
  const edgeLayer=makeSvg("g",{class:"impact-edges"}); const nodeLayer=makeSvg("g",{class:"impact-nodes"});
  points.forEach((point,index)=>{points.map((other,otherIndex)=>({other,otherIndex,distance:Math.hypot(point.x-other.x,point.y-other.y)})).filter(item=>item.otherIndex!==index).sort((a,b)=>a.distance-b.distance).slice(0,index%8===0?6:4).forEach(({other,otherIndex})=>{if(otherIndex<index)return;edgeLayer.append(makeSvg("line",{x1:point.x,y1:point.y,x2:other.x,y2:other.y,class:index%13===0?"is-helpful":""}));});});
  points.forEach((point,index)=>{if(index%3===0){const other=points[(index*7+29)%points.length];edgeLayer.append(makeSvg("path",{d:`M ${point.x} ${point.y} Q ${(point.x+other.x)/2+35} ${(point.y+other.y)/2-28} ${other.x} ${other.y}`,class:"cross-link"}));}});
  points.forEach((point,index)=>{const classes=[];if(point.important)classes.push("is-impact");if(index>=110)classes.push("is-recent");const circle=makeSvg("circle",{cx:point.x,cy:point.y,r:point.important?5.5:2.2+seeded(index,5)*1.8,class:classes.join(" ")});nodeLayer.append(circle);});
  svg.replaceChildren(edgeLayer,nodeLayer);
}

function renderExperienceCards() {
  const items=[...experiences,...experiences];
  document.querySelector("#experience-card-list").replaceChildren(...items.map((item,index)=>{const card=document.createElement("article");card.className="experience-card";if(index>=experiences.length)card.setAttribute("aria-hidden","true");card.innerHTML=`<header><span>${item.meta}</span><b class="outcome-${item.outcome}">${item.type}</b></header><h3>${item.title}</h3><p>${item.summary}</p><div class="experience-evidence">${item.evidence.map(value=>`<span>${value}</span>`).join("")}</div><strong>${item.lesson}</strong>`;return card;}));
}

document.querySelector("#show-path").addEventListener("click",()=>document.querySelector(".experience-cards").scrollIntoView({behavior:"smooth"}));
document.querySelector("#preview-anonymize").addEventListener("click",()=>{let text=document.querySelector("#experience-draft").value;text=text.replace(/01[016789][ -]?\d{3,4}[ -]?\d{4}/g,"[전화번호 제거]").replace(/20\d{2}년\s*\d{1,2}월\s*\d{1,2}일/g,"[정확한 날짜 제거]").replace(/\d{1,3}(?:,\d{3})+원/g,"[정확한 금액 제거]").replace(/부산\s*해운대구/g,"부산 지역").replace(/바다식당/g,"음식점");const result=document.querySelector("#anonymize-result");result.hidden=false;result.querySelector("p").textContent=text;});
createNetwork(); renderExperienceCards();
