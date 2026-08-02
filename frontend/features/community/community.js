const SVG_NS = "http://www.w3.org/2000/svg";

const nodes = [
  { id:"problem", type:"problem", label:"내 시급 차이", x:450, y:278, r:48, count:4, description:"계약 시급과 실제 시급이 다르게 기록된 현재 문제예요.", actions:["수습 적용 기간","계약서의 수습 조건","실제 시급 계산 근거"] },
  { id:"exp1", type:"experience", label:"익명 경험 1", x:285, y:178, r:25, count:1, description:"계산표를 받았지만 차액 지급은 확인 중이에요.", actions:["수습 기간 질문","계산표 요청"] },
  { id:"exp2", type:"experience", label:"익명 경험 2", x:615, y:170, r:25, count:1, description:"계약 시급 기준으로 차액을 받은 경험이에요.", actions:["계약 시급 제시","계산 근거 요청"] },
  { id:"exp3", type:"experience", label:"익명 경험 3", x:290, y:390, r:25, count:1, description:"수습 조건 근거를 받지 못한 경험이에요.", actions:["채용공고 비교","수습 조건 질문"] },
  { id:"exp4", type:"experience", label:"익명 경험 4", x:610, y:392, r:25, count:1, description:"계산 근거 답변을 기다리는 경험이에요.", actions:["서면 질문","답변 기한 확인"] },
  { id:"reply1", type:"reply", label:"수습기간 주장", x:448, y:105, r:31, count:2, description:"여러 시급 차이 경험에서 반복된 답변이에요.", actions:["수습 적용 기간","계약서 수습 조건"] },
  { id:"reply2", type:"reply", label:"원래 그래요", x:750, y:255, r:27, count:1, description:"계산 근거 없이 관행만 설명한 답변이에요.", actions:["서면 계산 근거 요청"] },
  { id:"reply3", type:"reply", label:"나중에 이야기", x:150, y:276, r:27, count:1, description:"질문에 직접 답하지 않고 대화를 미룬 답변이에요.", actions:["답변 날짜 확인","질문을 서면으로 남기기"] },
  { id:"action1", type:"action", label:"수습 기간 질문", x:315, y:72, r:27, count:2, description:"수습의 시작일과 종료일을 구체적으로 물었어요.", actions:["시작일과 종료일","적용 시급"] },
  { id:"action2", type:"action", label:"계산 근거 요청", x:735, y:102, r:29, count:3, description:"실제 지급액이 어떻게 계산됐는지 서면으로 요청했어요.", actions:["근무시간","적용 시급","공제 내역"] },
  { id:"action3", type:"action", label:"답변 기한 확인", x:145, y:448, r:25, count:1, description:"언제까지 답변을 받을 수 있는지 다시 확인했어요.", actions:["정확한 답변 날짜"] },
  { id:"evidence1", type:"evidence", label:"근로계약서", x:455, y:490, r:27, count:3, description:"약속된 시급과 수습 조건을 확인하는 데 사용됐어요.", actions:["시급 조항","수습 조항"] },
  { id:"evidence2", type:"evidence", label:"급여명세서", x:695, y:505, r:27, count:3, description:"실제 계산 시급과 지급 내역을 확인하는 데 사용됐어요.", actions:["지급액","계산 시급"] },
  { id:"evidence3", type:"evidence", label:"채용공고", x:175, y:95, r:23, count:1, description:"처음 안내받은 시급과 조건을 확인하는 데 사용됐어요.", actions:["공고 시급","근무 조건"] },
  { id:"outcome1", type:"outcome", label:"차액 지급", x:828, y:410, r:26, count:1, description:"기록을 근거로 확인한 뒤 차액을 받은 가공 경험이에요.", actions:["실제 입금 확인"] },
  { id:"outcome2", type:"outcome", label:"일부 해결", x:75, y:155, r:25, count:1, description:"계산표는 받았지만 차액은 아직 받지 못했어요.", actions:["지급일 재확인"] },
];

const edges = [
  ["problem","exp1"],["problem","exp2"],["problem","exp3"],["problem","exp4"],
  ["exp1","reply1"],["exp1","action1"],["exp1","action2"],["exp1","evidence1"],["exp1","evidence2"],["exp1","outcome2"],
  ["exp2","reply2"],["exp2","action2"],["exp2","evidence1"],["exp2","outcome1"],
  ["exp3","reply1"],["exp3","evidence3"],["exp3","action1"],
  ["exp4","reply3"],["exp4","action3"],["exp4","evidence2"],
];

const experiences = [
  { type:"성공 경험", outcome:"resolved", title:"계약 시급 기준으로 차액을 받았어요", summary:"계약서 시급과 급여 계산표를 함께 제시하고 계산 근거를 요청했어요.", lesson:"실제 입금까지 확인한 뒤 해결됨으로 기록했어요." },
  { type:"부분 성공", outcome:"partial", title:"계산표는 받았지만 차액은 아직이에요", summary:"수습 적용 기간을 물어 계산 방식은 확인했지만 지급은 진행 중이에요.", lesson:"지급 약속과 실제 입금은 따로 확인해야 했어요." },
  { type:"해결되지 않음", outcome:"unresolved", title:"수습 조건의 근거를 받지 못했어요", summary:"채용공고와 급여명세서는 있었지만 서면 계약서가 없었어요.", lesson:"어떤 기록이 부족했는지도 다음 사용자에게 알려줘요." },
];

const svg = document.querySelector("#experience-graph");
const nodeById = new Map(nodes.map((node) => [node.id, node]));
let selectedNodeId = "problem";

function svgElement(name, attributes = {}) { const element=document.createElementNS(SVG_NS,name); Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,String(value))); return element; }
function connectedIds(nodeId) { const ids=new Set([nodeId]); edges.forEach(([a,b])=>{if(a===nodeId)ids.add(b);if(b===nodeId)ids.add(a);}); return ids; }
function shortLabel(label) { return label.length>9 ? `${label.slice(0,8)}…` : label; }

function renderGraph() {
  svg.replaceChildren();
  const edgeLayer=svgElement("g"); const nodeLayer=svgElement("g"); svg.append(edgeLayer,nodeLayer);
  edges.forEach(([sourceId,targetId],index)=>{const source=nodeById.get(sourceId);const target=nodeById.get(targetId);const line=svgElement("line",{x1:source.x,y1:source.y,x2:target.x,y2:target.y,class:"graph-edge","data-edge":index,"data-source":sourceId,"data-target":targetId});edgeLayer.append(line);});
  nodes.forEach((node)=>{const group=svgElement("g",{class:`graph-node node-${node.type}`,transform:`translate(${node.x} ${node.y})`,tabindex:"0",role:"button","aria-label":node.label,"data-node-id":node.id});const circle=svgElement("circle",{r:node.r});const text=svgElement("text",{y:node.type==="problem"?4:node.r+17});text.textContent=shortLabel(node.label);group.append(circle,text);group.addEventListener("click",()=>selectNode(node.id));group.addEventListener("keydown",(event)=>{if(event.key==="Enter"||event.key===" ")selectNode(node.id);});nodeLayer.append(group);});
  applyFilters(); selectNode(selectedNodeId);
}

function selectNode(nodeId) {
  selectedNodeId=nodeId; const node=nodeById.get(nodeId); const connected=connectedIds(nodeId);
  document.querySelectorAll(".graph-node").forEach((element)=>{const id=element.dataset.nodeId;element.classList.toggle("selected",id===nodeId);element.classList.toggle("dimmed",!connected.has(id));});
  document.querySelectorAll(".graph-edge").forEach((element)=>{const active=element.dataset.source===nodeId||element.dataset.target===nodeId;element.classList.toggle("active",active);element.classList.toggle("dimmed",!active);});
  document.querySelector("#detail-type").textContent={problem:"내 현재 문제",experience:"익명 경험",reply:"반복된 답변",action:"확인 행동",evidence:"도움이 된 기록",outcome:"진행 결과"}[node.type];
  document.querySelector("#detail-title").textContent=node.label; document.querySelector("#detail-description").textContent=node.description; document.querySelector("#detail-count").textContent=`${node.count||1}개 연결`;
  document.querySelector("#detail-actions").replaceChildren(...node.actions.map((action)=>{const li=document.createElement("li");li.textContent=action;return li;}));
}

function applyFilters() { const enabled=new Set([...document.querySelectorAll('.filter-group input[type="checkbox"]:checked')].map((input)=>input.value)); document.querySelectorAll(".graph-node").forEach((element)=>{const node=nodeById.get(element.dataset.nodeId);element.hidden=node.type!=="problem"&&!enabled.has(node.type);}); document.querySelectorAll(".graph-edge").forEach((edge)=>{const source=nodeById.get(edge.dataset.source);const target=nodeById.get(edge.dataset.target);edge.hidden=(source.type!=="problem"&&!enabled.has(source.type))||(target.type!=="problem"&&!enabled.has(target.type));}); }
function renderList() { const list=document.querySelector("#list-view");list.replaceChildren(...nodes.filter((node)=>node.type!=="problem").map((node)=>{const item=document.createElement("button");item.className="list-item";item.type="button";item.innerHTML=`<span>${node.label}</span><small>${{experience:"익명 경험",reply:"받은 답변",action:"확인 행동",evidence:"도움이 된 기록",outcome:"진행 결과"}[node.type]}</small>`;item.addEventListener("click",()=>{document.querySelector("#toggle-list").click();selectNode(node.id);});return item;})); }
function renderExperienceCards() { document.querySelector("#experience-card-list").replaceChildren(...experiences.map((item)=>{const card=document.createElement("article");card.className="experience-card";card.innerHTML=`<header><span>시급 차이 · 가공 사례</span><b class="outcome-${item.outcome}">${item.type}</b></header><h3>${item.title}</h3><p>${item.summary}</p><strong>${item.lesson}</strong>`;return card;})); }

document.querySelectorAll('.filter-group input[type="checkbox"]').forEach((input)=>input.addEventListener("change",applyFilters));
document.querySelector("#reset-filter").addEventListener("click",()=>{document.querySelectorAll('.filter-group input[type="checkbox"]').forEach((input)=>input.checked=true);applyFilters();selectNode("problem");});
document.querySelector("#center-graph").addEventListener("click",()=>selectNode("problem"));
document.querySelector("#show-path").addEventListener("click",()=>selectNode("reply1"));
document.querySelector("#use-in-conversation").addEventListener("click",()=>{document.querySelector("#detail-feedback").textContent="선택한 경험의 확인 항목을 내 기록 기반 문장에 참고할 준비가 됐어요.";});
document.querySelector("#toggle-list").addEventListener("click",(event)=>{const graph=document.querySelector("#graph-view");const list=document.querySelector("#list-view");const showingList=list.hidden;list.hidden=!showingList;graph.hidden=showingList;event.currentTarget.textContent=showingList?"그래프로 보기":"목록으로 보기";});
document.querySelector("#problem-filter").addEventListener("change",(event)=>{document.querySelector("#graph-title").textContent=`${event.target.selectedOptions[0].textContent} 중심 그래프`;});
document.querySelector("#preview-anonymize").addEventListener("click",()=>{let text=document.querySelector("#experience-draft").value;text=text.replace(/01[016789][ -]?\d{3,4}[ -]?\d{4}/g,"[전화번호 제거]").replace(/20\d{2}년\s*\d{1,2}월\s*\d{1,2}일/g,"[정확한 날짜 제거]").replace(/\d{1,3}(?:,\d{3})+\s*원/g,"[정확한 금액 제거]").replace(/부산\s*해운대구/g,"부산 지역").replace(/바다식당/g,"음식점");const result=document.querySelector("#anonymize-result");result.hidden=false;result.querySelector("p").textContent=text;});

renderGraph(); renderList(); renderExperienceCards();
