const screens=[...document.querySelectorAll(".screen")];
const navs=[...document.querySelectorAll(".nav")];
const toast=document.getElementById("toast");
const records=[
  {icon:"📣",name:"채용공고.jpg",detail:"시급 12,000원 · 2026.06.25"},
  {icon:"📄",name:"단시간근로계약서.pdf",detail:"시급 12,000원 · 수습조건 불명확"},
  {icon:"🕐",name:"7월 근무기록.pdf",detail:"총 82시간 · 20일 근무"},
  {icon:"₩",name:"7월 급여명세서.pdf",detail:"적용 시급 10,500원"},
  {icon:"🏦",name:"급여 입금내역.jpg",detail:"861,000원 · 2026.08.10"}
];
const messages={
  polite:"안녕하세요. 계약서에는 시급이 12,000원으로 기재되어 있는데, 이번 급여는 10,500원으로 계산된 것 같습니다. 수습기간 적용 여부와 기간, 계산 근거를 확인해 주실 수 있을까요?",
  clear:"계약서상 시급은 12,000원이지만 급여명세서에는 10,500원이 적용되었습니다. 수습기간의 합의 내용과 적용 기간, 임금 계산 근거를 서면으로 알려주세요.",
  firm:"계약서에 명시된 시급 12,000원과 실제 지급 기준 10,500원이 다릅니다. 수습 감액의 합의 근거와 기간을 확인하고 차액의 재계산 여부를 답변해 주세요."
};
const vietnamese="Xin chào. Hợp đồng ghi mức lương 12.000 won/giờ, nhưng lương lần này có vẻ được tính theo 10.500 won. Xin hãy cho tôi biết thời gian thử việc và căn cứ tính lương.";
const languages=["한국어","English","Tiếng Việt","中文","ภาษาไทย","O‘zbekcha","Монгол","Bahasa Indonesia","ភាសាខ្មែរ","नेपाली"];
const i18n={
  English:{private:"Private records",home:"Home",records:"My Records",check:"Compare",conversation:"Confirm",wallet:"Record Box",cases:"Similar Records",needHelp:"Need help?",helpText:"You can save records first without contacting your employer.",help:"View help",eyebrow:"MY WORK RECORDS",welcome:"Keep everyday work records in one place.",welcomeText:"Compare job posts, contracts, work hours, and pay.",start:"Start Recording",demo:"Load Example",j1:"Collect records",j1t:"Gather contracts, chats, and pay records.",j2:"Find changes",j2t:"Compare records from different dates.",j3:"Ask for details",j3t:"Prepare a simple confirmation message.",j4:"Keep the history",j4t:"Organize your work records.",recordTitle:"Collect work records",recordText:"Connect files from the same workplace.",analyze:"Compare records",upload:"Add file or photo",jobPost:"Job posting",contract:"Contract",employerChat:"Employer chat",attendance:"Attendance",payslip:"Payslip",deposit:"Deposit",timeline:"Work timeline",emptyRecords:"No records yet",emptyText:"Load the example or add your files.",checkTitle:"Compare work records",checkText:"See which conditions stayed the same or changed.",conversationTitle:"Confirmation Message Helper",walletTitle:"Work Record Box"},
  "Tiếng Việt":{private:"Hồ sơ riêng tư",home:"Trang chủ",records:"Hồ sơ",check:"Kiểm tra quyền",conversation:"Hỗ trợ hội thoại",wallet:"Ví bằng chứng",cases:"Trường hợp tương tự",needHelp:"Bạn cần hỗ trợ?",helpText:"Bạn không cần đối chất nếu cảm thấy không an toàn.",help:"Nhận hỗ trợ",eyebrow:"HỒ SƠ LAO ĐỘNG ĐẦU TIÊN",welcome:"Biến hồ sơ lao động rời rạc thành bằng chứng có thể sử dụng.",welcomeText:"So sánh lời hứa, hợp đồng, công việc thực tế và tiền lương.",start:"Bắt đầu hồ sơ",demo:"Xem ví dụ",j1:"Thu thập hồ sơ",j1t:"Tập hợp hợp đồng, tin nhắn và lương.",j2:"Tìm điểm khác biệt",j2t:"So sánh lời hứa, hợp đồng và thực tế.",j3:"Hỏi bằng chứng",j3t:"Chuẩn bị câu nói và căn cứ.",j4:"Lưu quá trình",j4t:"Chuẩn bị hồ sơ tư vấn.",recordTitle:"Thu thập hồ sơ",recordText:"Kết nối các tài liệu vào một vụ việc.",analyze:"So sánh hồ sơ",upload:"Thêm tệp hoặc ảnh",jobPost:"Tin tuyển dụng",contract:"Hợp đồng",employerChat:"Tin nhắn chủ",attendance:"Chấm công",payslip:"Phiếu lương",deposit:"Chuyển khoản",timeline:"Dòng thời gian",emptyRecords:"Chưa có hồ sơ",emptyText:"Tải ví dụ hoặc thêm tệp.",checkTitle:"Kiểm tra điều kiện và quyền",checkText:"Tách biệt hồ sơ, phân tích AI và thông tin chính thức.",conversationTitle:"Trợ lý hội thoại quyền lợi",walletTitle:"Ví bằng chứng"}
};

function go(id){
  screens.forEach(s=>s.classList.toggle("active",s.id===id));
  navs.forEach(n=>n.classList.toggle("active",n.dataset.go===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{const target=e.target.closest("[data-go]");if(target)go(target.dataset.go)});
function showToast(text){toast.textContent=text;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
function renderRecords(custom=[]){
  const all=[...records,...custom];
  document.getElementById("recordCount").textContent=`${all.length}개 기록`;
  document.getElementById("recordList").innerHTML=all.map(r=>`<div class="record-item"><span class="record-icon">${r.icon}</span><div><b>${r.name}</b><small>${r.detail}</small></div><em>추출 완료 ✓</em></div>`).join("");
  document.getElementById("analyzeButton").disabled=false;
}
document.getElementById("loadDemo").onclick=()=>{renderRecords();showToast("예시 기록 5개를 불러왔습니다");go("records")};
document.getElementById("uploadButton").onclick=()=>document.getElementById("fileInput").click();
document.getElementById("fileInput").onchange=e=>{
  const custom=[...e.target.files].map(f=>({icon:"📎",name:f.name,detail:`${Math.ceil(f.size/1024)} KB · 분석 준비됨`}));
  renderRecords(custom);showToast(`${custom.length}개 파일을 추가했습니다`);
};
document.getElementById("analyzeButton").onclick=()=>{showToast("기록 비교가 완료되었습니다");go("check")};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-tab]").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active");
});
const suggested=document.getElementById("suggestedMessage");
const translated=document.getElementById("translatedMessage");
suggested.textContent=messages.polite;translated.textContent=vietnamese;
document.querySelectorAll("[data-tone]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-tone]").forEach(x=>x.classList.remove("active"));b.classList.add("active");suggested.textContent=messages[b.dataset.tone];
});
document.getElementById("copyMessage").onclick=async()=>{try{await navigator.clipboard.writeText(suggested.textContent)}catch{}showToast("한국어 문장을 복사했습니다")};
document.getElementById("markSent").onclick=()=>showToast("보낸 질문을 근무 기록에 저장했습니다");
document.getElementById("analyzeReply").onclick=()=>{
  const text=document.getElementById("employerReply").value.trim()||"수습기간이라 원래 그렇게 계산해요";
  document.getElementById("employerReply").value=text;
  const result=document.getElementById("replyResult");result.classList.remove("hidden");
  result.innerHTML="<b>부분 답변 · 핵심 근거 미확인</b><p>수습 적용을 언급했지만 합의 위치, 적용 기간, 감액 기준, 채용공고와 다른 이유에는 답하지 않았습니다.</p><button class='secondary' id='followup'>후속 문장 만들기</button>";
  document.getElementById("unansweredCount").textContent="4";
  document.getElementById("walletReply").className="warning";
  document.getElementById("walletReply").innerHTML="<span>2026.08.11</span><b>고용주 답변 분석</b><p>부분 답변 · 미답변 4개</p>";
  document.getElementById("followup").onclick=()=>{suggested.textContent=messages.clear;showToast("미답변 항목을 반영했습니다")};
};
document.getElementById("exportPdf").onclick=()=>document.getElementById("pdfModal").classList.remove("hidden");
document.getElementById("closeModal").onclick=()=>document.getElementById("pdfModal").classList.add("hidden");
document.getElementById("pdfModal").onclick=e=>{if(e.target.id==="pdfModal")e.currentTarget.classList.add("hidden")};
const languageMenu=document.getElementById("languageMenu");
languageMenu.innerHTML=languages.map(x=>`<button data-lang="${x}">${x}</button>`).join("");
document.getElementById("languageButton").onclick=()=>languageMenu.classList.toggle("hidden");
languageMenu.onclick=e=>{
  const b=e.target.closest("[data-lang]");if(!b)return;
  const lang=b.dataset.lang;document.getElementById("currentLanguage").textContent=lang;
  const dict=i18n[lang]||i18n.English;
  document.querySelectorAll("[data-i18n]").forEach(el=>{if(dict[el.dataset.i18n])el.innerHTML=dict[el.dataset.i18n]});
  languageMenu.classList.add("hidden");showToast(`${lang} interface applied`);
};
