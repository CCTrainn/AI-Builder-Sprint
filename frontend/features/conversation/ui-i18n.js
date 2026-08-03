const LANGUAGE_INDEX = { ko: 0, vi: 1, "zh-CN": 2, th: 3, id: 4, en: 5 };

// Korean is the source text. The generated Korean message itself is intentionally
// excluded because it is the message the worker sends to a Korean employer.
const COPY = [
  ["대꾸 AI", "Daekku AI", "Daekku AI", "Daekku AI", "Daekku AI", "Daekku AI"],
  ["기록이 다른 부분을 근거로 확인할 말을 만들고, 받은 답변의 다음 말까지 이어드려요.", "Tạo lời xác nhận từ các điểm khác nhau trong hồ sơ và tiếp tục với câu tiếp theo sau khi nhận phản hồi.", "根据记录差异生成确认用语，并在收到回复后继续准备下一句话。", "สร้างข้อความยืนยันจากจุดที่บันทึกต่างกัน และช่วยเตรียมคำพูดถัดไปหลังได้รับคำตอบ", "Membuat kalimat konfirmasi dari perbedaan catatan dan melanjutkan dengan kalimat berikutnya setelah menerima jawaban.", "Create a confirmation message from record differences and continue with what to say after the reply."],
  ["기록 기반 대화", "Trao đổi dựa trên hồ sơ", "基于记录的对话", "การสนทนาจากบันทึก", "Percakapan berbasis catatan", "Record-based conversation"],
  ["대꾸 AI | 근로권리 동반자", "Daekku AI | Đồng hành quyền lao động", "Daekku AI | 劳动权益伙伴", "Daekku AI | ผู้ช่วยสิทธิแรงงาน", "Daekku AI | Pendamping hak pekerja", "Daekku AI | Work Rights Companion"],
  ["STEP 3 · 대꾸 AI", "BƯỚC 3 · Daekku AI", "第 3 步 · Daekku AI", "ขั้นตอนที่ 3 · Daekku AI", "LANGKAH 3 · Daekku AI", "STEP 3 · Daekku AI"],
  ["확인 대화 준비 | 근로권리 동반자", "Chuẩn bị trao đổi | Đồng hành quyền lao động", "准备确认对话 | 劳动权益伙伴", "เตรียมการสนทนา | ผู้ช่วยสิทธิแรงงาน", "Persiapan percakapan | Pendamping hak pekerja", "Prepare a conversation | Work Rights Companion"],
  ["STEP 3 · 확인 대화", "BƯỚC 3 · Trao đổi xác nhận", "第3步 · 确认对话", "ขั้นตอน 3 · การสนทนาเพื่อยืนยัน", "LANGKAH 3 · Percakapan konfirmasi", "STEP 3 · Confirmation conversation"],
  ["고용주에게 확인할 말을 준비해요", "Chuẩn bị câu hỏi cho chủ lao động", "准备向雇主确认的话", "เตรียมข้อความเพื่อสอบถามนายจ้าง", "Siapkan pertanyaan untuk pemberi kerja", "Prepare what to ask your employer"],
  ["기록에서 달라진 내용을 바탕으로 질문을 만들어요. 문장을 확인한 뒤 직접 보내주세요.", "Chúng tôi tạo câu hỏi từ những điểm khác nhau trong hồ sơ. Hãy kiểm tra rồi tự gửi cho chủ lao động.", "我们根据记录中的差异生成问题。请确认句子后自行发送。", "เราสร้างคำถามจากข้อมูลที่แตกต่างกัน โปรดตรวจสอบแล้วส่งด้วยตนเอง", "Kami membuat pertanyaan berdasarkan perbedaan dalam catatan. Periksa lalu kirim sendiri.", "We create a question from differences in your records. Review it, then send it yourself."],
  ["질문 준비", "Chuẩn bị câu hỏi", "准备问题", "เตรียมคำถาม", "Siapkan pertanyaan", "Question ready"],
  ["바로 연락하지 않아도 괜찮아요.", "Bạn không cần liên hệ ngay.", "不必马上联系。", "ไม่จำเป็นต้องติดต่อทันที", "Anda tidak perlu langsung menghubungi.", "You do not have to contact them right away."],
  ["지금은 문장만 준비하거나 기록으로 보관할 수 있어요.", "Bây giờ bạn có thể chỉ chuẩn bị câu hoặc lưu lại.", "现在可以只准备句子或保存记录。", "ตอนนี้คุณเตรียมข้อความหรือบันทึกไว้ก่อนได้", "Untuk sekarang, Anda dapat menyiapkan kalimat atau menyimpannya.", "For now, you can prepare the sentence or save it."],
  ["현재 확인할 내용", "Nội dung cần xác nhận", "当前需要确认", "สิ่งที่ต้องตรวจสอบ", "Hal yang perlu dikonfirmasi", "What to confirm"],
  ["확인할 항목을 불러오는 중...", "Đang tải các mục cần xác nhận...", "正在加载待确认项目……", "กำลังโหลดรายการที่ต้องตรวจสอบ...", "Memuat hal yang perlu dikonfirmasi...", "Loading items to confirm..."],
  ["기록 차이를 확인하고 있어요", "Đang kiểm tra sự khác nhau giữa các hồ sơ", "正在检查记录差异", "กำลังตรวจสอบความแตกต่างของบันทึก", "Memeriksa perbedaan catatan", "Checking differences in your records"],
  ["기록 차이", "Hồ sơ khác nhau", "记录不同", "บันทึกต่างกัน", "Catatan berbeda", "Records differ"],
  ["확인 필요", "Cần xác nhận", "需要确认", "ต้องตรวจสอบ", "Perlu dikonfirmasi", "Needs confirmation"],
  ["기록이 다르거나 추가 확인이 필요한 항목 중 하나를 선택하세요.", "Chọn một mục có hồ sơ khác nhau hoặc cần xác nhận thêm.", "请选择一项记录不一致或需要进一步确认的内容。", "เลือกหนึ่งรายการที่บันทึกไม่ตรงกันหรือต้องตรวจสอบเพิ่มเติม", "Pilih salah satu hal dengan catatan berbeda atau yang perlu dikonfirmasi lebih lanjut.", "Choose one item where records differ or more confirmation is needed."],
  ["서로 다르게 기록된 항목 중 하나를 선택하세요.", "Chọn một mục được ghi khác nhau giữa các hồ sơ.", "请选择一项记录不一致的内容。", "เลือกหนึ่งรายการที่บันทึกไว้แตกต่างกัน", "Pilih salah satu item yang tercatat berbeda.", "Choose one item that differs between records."],
  ["비교 항목을 불러오지 못했어요", "Không thể tải các mục so sánh", "无法加载比较项目", "ไม่สามารถโหลดรายการเปรียบเทียบได้", "Tidak dapat memuat item perbandingan", "Could not load comparison items"],
  ["비교할 수 있는 기록이 아직 없어요", "Chưa có hồ sơ nào có thể so sánh", "还没有可比较的记录", "ยังไม่มีบันทึกที่เปรียบเทียบได้", "Belum ada catatan yang dapat dibandingkan", "There are no records to compare yet"],
  ["서로 다르게 기록된 항목이 아직 없어요", "Chưa có mục nào được ghi khác nhau", "还没有记录不一致的项目", "ยังไม่มีรายการที่บันทึกแตกต่างกัน", "Belum ada item yang tercatat berbeda", "There are no differing records yet"],
  ["먼저 자료를 두 개 이상 모으고 기록 비교를 실행해 주세요.", "Trước tiên, hãy thu thập ít nhất hai hồ sơ rồi chạy so sánh.", "请先收集至少两份资料并运行记录比较。", "โปรดรวบรวมบันทึกอย่างน้อยสองรายการแล้วเปรียบเทียบบันทึก", "Kumpulkan setidaknya dua catatan terlebih dahulu, lalu jalankan perbandingan.", "Collect at least two records first, then run the comparison."],
  ["함께 확인할 내용", "Nội dung cần hỏi thêm", "需要一并确认", "สิ่งที่ต้องตรวจสอบร่วมกัน", "Hal lain yang perlu dikonfirmasi", "Items to confirm together"],
  ["수습기간", "Thời gian thử việc", "试用期", "ช่วงทดลองงาน", "Masa percobaan", "Probation period"],
  ["적용 기간", "Thời gian áp dụng", "适用期间", "ระยะเวลาที่ใช้", "Periode penerapan", "Applicable period"],
  ["임금 계산 근거", "Căn cứ tính lương", "工资计算依据", "หลักเกณฑ์การคำนวณค่าจ้าง", "Dasar perhitungan upah", "Basis for wage calculation"],
  ["추천 확인 문장", "Câu hỏi gợi ý", "建议确认句", "ข้อความแนะนำ", "Kalimat yang disarankan", "Suggested question"],
  ["어떤 말투로 물어볼까요?", "Bạn muốn hỏi với giọng điệu nào?", "想用什么语气询问？", "ต้องการถามด้วยน้ำเสียงแบบใด", "Nada bicara apa yang ingin digunakan?", "What tone would you like to use?"],
  ["설명 언어", "Ngôn ngữ giải thích", "说明语言", "ภาษาคำอธิบาย", "Bahasa penjelasan", "Display language"],
  ["정중하게", "Lịch sự", "礼貌", "สุภาพ", "Sopan", "Polite"],
  ["부드럽게 확인해요", "Hỏi một cách nhẹ nhàng", "温和地确认", "สอบถามอย่างนุ่มนวล", "Konfirmasi dengan lembut", "Ask gently"],
  ["명확하게", "Rõ ràng", "明确", "ชัดเจน", "Jelas", "Clear"],
  ["필요한 답을 분명히 요청해요", "Yêu cầu câu trả lời rõ ràng", "明确要求所需答复", "ขอคำตอบที่ต้องการให้ชัดเจน", "Minta jawaban yang diperlukan dengan jelas", "Clearly request the answer you need"],
  ["단호하게", "Dứt khoát", "坚定", "หนักแน่น", "Tegas", "Firm"],
  ["차이와 요청을 또렷하게 말해요", "Nêu rõ khác biệt và yêu cầu", "清楚说明差异和要求", "ระบุความแตกต่างและคำขอให้ชัดเจน", "Nyatakan perbedaan dan permintaan dengan tegas", "State the difference and request clearly"],
  ["고용주에게 보낼 한국어", "Tiếng Hàn gửi cho chủ lao động", "发给雇主的韩语", "ภาษาเกาหลีที่จะส่งให้นายจ้าง", "Bahasa Korea untuk dikirim kepada pemberi kerja", "Korean message to send to your employer"],
  ["문장 복사", "Sao chép câu", "复制句子", "คัดลอกข้อความ", "Salin kalimat", "Copy sentence"],
  ["문장의 의미", "Ý nghĩa của câu", "句子含义", "ความหมายของข้อความ", "Arti kalimat", "Meaning of the sentence"],
  ["이 기록을 바탕으로 만들었어요", "Được tạo dựa trên các hồ sơ này", "根据这些记录生成", "สร้างจากบันทึกเหล่านี้", "Dibuat berdasarkan catatan ini", "Created from these records"],
  ["문장을 불러오지 못했어요.", "Không thể tải câu.", "无法加载句子。", "ไม่สามารถโหลดข้อความได้", "Kalimat tidak dapat dimuat.", "Could not load the sentence."],
  ["잠시 후 다시 시도해 주세요.", "Vui lòng thử lại sau.", "请稍后重试。", "โปรดลองอีกครั้งภายหลัง", "Silakan coba lagi nanti.", "Please try again shortly."],
  ["다시 시도", "Thử lại", "重试", "ลองอีกครั้ง", "Coba lagi", "Try again"],
  ["STEP 3-2 · 답변 확인", "BƯỚC 3-2 · Kiểm tra câu trả lời", "第3-2步 · 确认答复", "ขั้นตอน 3-2 · ตรวจสอบคำตอบ", "LANGKAH 3-2 · Periksa jawaban", "STEP 3-2 · Check the reply"],
  ["고용주의 답변을 확인해요", "Kiểm tra câu trả lời của chủ lao động", "查看雇主的答复", "ตรวจสอบคำตอบของนายจ้าง", "Periksa jawaban pemberi kerja", "Check your employer's reply"],
  ["받은 답변을 붙여넣으면, 질문한 내용 중 무엇이 답변되었는지 나누어 보여드려요.", "Dán câu trả lời đã nhận để xem nội dung nào đã được trả lời.", "粘贴收到的答复，即可查看哪些问题得到了回答。", "วางคำตอบที่ได้รับเพื่อดูว่าประเด็นใดได้รับคำตอบแล้ว", "Tempel jawaban yang diterima untuk melihat pertanyaan mana yang telah dijawab.", "Paste the reply to see which of your questions were answered."],
  ["답변 분석 전", "Chưa phân tích", "尚未分析", "ยังไม่ได้วิเคราะห์", "Belum dianalisis", "Not analyzed"],
  ["고용주에게 받은 답변", "Câu trả lời từ chủ lao động", "雇主的答复", "คำตอบจากนายจ้าง", "Jawaban dari pemberi kerja", "Reply from your employer"],
  ["예시 답변 불러오기", "Tải câu trả lời mẫu", "加载示例答复", "โหลดคำตอบตัวอย่าง", "Muat contoh jawaban", "Load example reply"],
  ["답변 분석하기", "Phân tích câu trả lời", "分析答复", "วิเคราะห์คำตอบ", "Analisis jawaban", "Analyze reply"],
  ["아직 분석한 답변이 없어요", "Chưa có câu trả lời được phân tích", "还没有已分析的答复", "ยังไม่มีคำตอบที่วิเคราะห์แล้ว", "Belum ada jawaban yang dianalisis", "No reply has been analyzed yet"],
  ["왼쪽에 고용주의 답변을 입력하고 분석 버튼을 눌러주세요.", "Nhập câu trả lời của chủ lao động ở bên trái rồi nhấn nút phân tích.", "请在左侧输入雇主答复并点击分析。", "ป้อนคำตอบของนายจ้างทางซ้ายแล้วกดปุ่มวิเคราะห์", "Masukkan jawaban pemberi kerja di sebelah kiri lalu tekan tombol analisis.", "Enter your employer's reply on the left and select Analyze."],
  ["답변 내용을 확인하고 있어요", "Đang kiểm tra câu trả lời", "正在检查答复", "กำลังตรวจสอบคำตอบ", "Sedang memeriksa jawaban", "Checking the reply"],
  ["답변된 내용", "Nội dung đã trả lời", "已回答内容", "ประเด็นที่ตอบแล้ว", "Hal yang telah dijawab", "Answered items"],
  ["아직 답변되지 않은 내용", "Nội dung chưa được trả lời", "尚未回答的内容", "ประเด็นที่ยังไม่ได้ตอบ", "Hal yang belum dijawab", "Unanswered items"],
  ["다음에 확인할 문장", "Câu hỏi tiếp theo", "下一句确认问题", "ข้อความที่จะถามต่อ", "Kalimat tindak lanjut", "Follow-up question"],
  ["근로 기록함에서 보기", "Xem trong hồ sơ lao động", "在劳动记录中查看", "ดูในบันทึกการทำงาน", "Lihat di catatan kerja", "View in work records"],
  ["저장된 대화 기록", "Lịch sử trò chuyện đã lưu", "已保存的对话记录", "ประวัติการสนทนาที่บันทึกไว้", "Riwayat percakapan tersimpan", "Saved conversation history"],
  ["지금까지 확인한 내용을 이어서 봐요", "Tiếp tục xem những nội dung đã xác nhận", "继续查看已确认的内容", "ดูสิ่งที่ตรวจสอบไว้ต่อ", "Lanjutkan dari hal yang telah dikonfirmasi", "Continue reviewing what you have confirmed"],
  ["저장된 대화가 아직 없어요.", "Chưa có cuộc trò chuyện nào được lưu.", "还没有已保存的对话。", "ยังไม่มีการสนทนาที่บันทึกไว้", "Belum ada percakapan yang disimpan.", "There are no saved conversations yet."],
  ["실제로 보낸 카톡", "Tin nhắn KakaoTalk đã gửi", "实际发送的KakaoTalk消息", "ข้อความ KakaoTalk ที่ส่งจริง", "Pesan KakaoTalk yang benar-benar dikirim", "KakaoTalk message actually sent"],
  ["보낸 문장을 그대로 기록해요", "Lưu chính xác nội dung đã gửi", "原样记录已发送的内容", "บันทึกข้อความที่ส่งจริงตามเดิม", "Catat persis pesan yang dikirim", "Record exactly what you sent"],
  ["추천문 가져오기", "Dùng câu gợi ý", "使用建议句", "ใช้ข้อความแนะนำ", "Gunakan kalimat saran", "Use suggested message"],
  ["말투를 선택하는 것만으로는 저장되지 않아요. 실제 카카오톡에 보낸 내용을 붙여넣거나 수정한 뒤 기록해 주세요.", "Việc chọn giọng điệu sẽ không tự lưu. Hãy dán hoặc sửa nội dung thực tế đã gửi trên KakaoTalk rồi lưu lại.", "仅选择语气不会保存。请粘贴或修改在KakaoTalk中实际发送的内容后再记录。", "การเลือกน้ำเสียงอย่างเดียวจะไม่บันทึก โปรดวางหรือแก้ไขข้อความที่ส่งจริงใน KakaoTalk แล้วบันทึก", "Memilih nada saja tidak akan menyimpan pesan. Tempel atau edit pesan yang benar-benar dikirim di KakaoTalk, lalu simpan.", "Choosing a tone does not save anything. Paste or edit what you actually sent on KakaoTalk, then record it."],
  ["보낸 내용 기록하기", "Lưu nội dung đã gửi", "记录已发送内容", "บันทึกข้อความที่ส่ง", "Catat pesan terkirim", "Record sent message"],
  ["이 사업장의 실제 대화를 이어서 봐요", "Tiếp tục cuộc trò chuyện thực tế tại nơi làm việc này", "继续查看该工作场所的实际对话", "ดูการสนทนาจริงของสถานที่ทำงานนี้ต่อ", "Lanjutkan percakapan nyata di tempat kerja ini", "Continue this workplace's actual conversation"],
  ["실제로 보냈거나 받은 대화가 아직 없어요.", "Chưa có tin nhắn thực tế nào được gửi hoặc nhận.", "还没有实际发送或收到的对话。", "ยังไม่มีข้อความที่ส่งหรือได้รับจริง", "Belum ada percakapan nyata yang dikirim atau diterima.", "There are no actual sent or received messages yet."],
  ["현재 사용자와 비슷한 경험 4건이 있어요", "Có 4 trải nghiệm tương tự", "有4个相似经历", "มีประสบการณ์ที่คล้ายกัน 4 รายการ", "Ada 4 pengalaman serupa", "There are 4 similar experiences"],
  ["경험 보기", "Xem trải nghiệm", "查看经历", "ดูประสบการณ์", "Lihat pengalaman", "View experiences"],
];

const translations = new Map(COPY.map((row) => [row[0], row]));
const originalText = new WeakMap();
const PLACEHOLDERS = {
  ko: "예: 수습기간이라 원래 그렇게 계산해요.",
  vi: "Ví dụ: Vì đang trong thời gian thử việc nên lương được tính như vậy.",
  "zh-CN": "例如：因为是试用期，所以工资原本就是这样计算的。",
  th: "ตัวอย่าง: เนื่องจากเป็นช่วงทดลองงานจึงคำนวณค่าจ้างแบบนี้",
  id: "Contoh: Karena masih masa percobaan, upah dihitung seperti itu.",
  en: "Example: It is calculated that way because you are on probation.",
};
const SENT_MESSAGE_PLACEHOLDERS = {
  ko: "카카오톡에 실제로 보낸 문장을 붙여넣어 주세요.",
  vi: "Hãy dán nội dung bạn thực sự đã gửi trên KakaoTalk.",
  "zh-CN": "请粘贴您在KakaoTalk中实际发送的内容。",
  th: "โปรดวางข้อความที่คุณส่งจริงใน KakaoTalk",
  id: "Tempel pesan yang benar-benar Anda kirim di KakaoTalk.",
  en: "Paste the message you actually sent on KakaoTalk.",
};

function selectedLanguage() {
  const value = document.querySelector("#site-language")?.value
    || sessionStorage.getItem("site_display_language_v2")
    || "ko";
  return Object.hasOwn(LANGUAGE_INDEX, value) ? value : "ko";
}

function translateTextNode(node, index) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue);
  const source = originalText.get(node);
  const trimmed = source.trim();
  const row = translations.get(trimmed);
  if (!row) return;
  node.nodeValue = source.replace(trimmed, row[index]);
}

function translatePage(language = selectedLanguage()) {
  const index = LANGUAGE_INDEX[language] ?? 0;
  document.documentElement.lang = language;
  document.title = translations.get("확인 대화 준비 | 근로권리 동반자")[index];
  const replyInput = document.querySelector("#employer-reply");
  if (replyInput) replyInput.placeholder = PLACEHOLDERS[language];
  const sentMessageInput = document.querySelector("#sent-message-text");
  if (sentMessageInput) sentMessageInput.placeholder = SENT_MESSAGE_PLACEHOLDERS[language];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return ["SCRIPT", "STYLE", "OPTION"].includes(node.parentElement?.tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) translateTextNode(walker.currentNode, index);
}

const observer = new MutationObserver((mutations) => {
  const index = LANGUAGE_INDEX[selectedLanguage()] ?? 0;
  mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, index);
    if (node.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateTextNode(walker.currentNode, index);
    }
  }));
});

translatePage();
observer.observe(document.body, { childList: true, subtree: true });
document.addEventListener("userlanguagechange", (event) => translatePage(event.detail.language));
