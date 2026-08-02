const INDEX = { ko: 0, vi: 1, "zh-CN": 2, th: 3, id: 4, en: 5 };
const ROWS = [
  ["홈", "Trang chủ", "首页", "หน้าหลัก", "Beranda", "Home"],
  ["자료 모으기", "Thu thập tài liệu", "收集资料", "รวบรวมเอกสาร", "Kumpulkan dokumen", "Collect records"],
  ["자료", "Tài liệu", "资料", "เอกสาร", "Dokumen", "Records"],
  ["조건 비교하기", "So sánh điều kiện", "比较条件", "เปรียบเทียบเงื่อนไข", "Bandingkan ketentuan", "Compare terms"],
  ["비교", "So sánh", "比较", "เปรียบเทียบ", "Bandingkan", "Compare"],
  ["대화 도우미", "Hỗ trợ trao đổi", "对话助手", "ผู้ช่วยสนทนา", "Asisten percakapan", "Conversation helper"],
  ["대화", "Trao đổi", "对话", "สนทนา", "Percakapan", "Conversation"],
  ["내 기록", "Hồ sơ của tôi", "我的记录", "บันทึกของฉัน", "Catatan saya", "My records"],
  ["기록함", "Hồ sơ", "记录夹", "กล่องบันทึก", "Kotak catatan", "Record box"],
  ["오늘도 근무 기록을 살펴볼까요?", "Hôm nay hãy cùng xem lại hồ sơ làm việc nhé?", "今天也来查看工作记录吧？", "วันนี้มาตรวจสอบบันทึกการทำงานกันไหม", "Mari periksa catatan kerja hari ini.", "Shall we review your work records today?"],
  ["주요 기능", "Chức năng chính", "主要功能", "ฟังก์ชันหลัก", "Fitur utama", "Main features"],
  ["자료 추가하기", "Thêm tài liệu", "添加资料", "เพิ่มเอกสาร", "Tambah dokumen", "Add records"],
  ["새로운 근무자료 모으기", "Thu thập tài liệu làm việc mới", "收集新的工作资料", "รวบรวมเอกสารการทำงานใหม่", "Kumpulkan dokumen kerja baru", "Collect new work records"],
  ["기록 비교하기", "So sánh hồ sơ", "比较记录", "เปรียบเทียบบันทึก", "Bandingkan catatan", "Compare records"],
  ["달라진 조건 확인하기", "Kiểm tra điều kiện đã thay đổi", "查看发生变化的条件", "ตรวจสอบเงื่อนไขที่เปลี่ยนไป", "Periksa ketentuan yang berubah", "Check changed terms"],
  ["확인할 문장 준비하기", "Chuẩn bị câu hỏi xác nhận", "准备确认问题", "เตรียมข้อความเพื่อยืนยัน", "Siapkan pertanyaan konfirmasi", "Prepare a confirmation message"],
  ["모아둔 근로 기록 보기", "Xem hồ sơ lao động đã lưu", "查看已收集的劳动记录", "ดูบันทึกการทำงานที่รวบรวมไว้", "Lihat catatan kerja tersimpan", "View saved work records"],
  ["계약서, 급여명세서, 근무기록을 한곳에 모아 시간순으로 확인하세요.", "Lưu hợp đồng, phiếu lương và chấm công ở một nơi để xem theo thời gian.", "将合同、工资单和工作记录集中保存并按时间查看。", "เก็บสัญญา สลิปเงินเดือน และบันทึกงานไว้ที่เดียวเพื่อดูตามลำดับเวลา", "Simpan kontrak, slip gaji, dan catatan kerja di satu tempat untuk dilihat berdasarkan waktu.", "Keep contracts, payslips, and work logs together and review them over time."],
  ["전체 자료", "Tất cả tài liệu", "全部资料", "เอกสารทั้งหมด", "Semua dokumen", "All records"],
  ["분석 완료", "Đã phân tích", "分析完成", "วิเคราะห์แล้ว", "Analisis selesai", "Analysis complete"],
  ["처리 중", "Đang xử lý", "处理中", "กำลังดำเนินการ", "Sedang diproses", "Processing"],
  ["확인 필요", "Cần xác nhận", "需要确认", "ต้องตรวจสอบ", "Perlu dikonfirmasi", "Needs confirmation"],
  ["새 자료", "Tài liệu mới", "新资料", "เอกสารใหม่", "Dokumen baru", "New record"],
  ["근무자료 추가", "Thêm tài liệu làm việc", "添加工作资料", "เพิ่มเอกสารการทำงาน", "Tambah dokumen kerja", "Add a work record"],
  ["비공개", "Riêng tư", "不公开", "ส่วนตัว", "Pribadi", "Private"],
  ["파일이나 사진을 선택하세요", "Chọn tệp hoặc ảnh", "选择文件或照片", "เลือกไฟล์หรือรูปภาพ", "Pilih berkas atau foto", "Select a file or photo"],
  ["자료 종류", "Loại tài liệu", "资料类型", "ประเภทเอกสาร", "Jenis dokumen", "Record type"],
  ["자료의 날짜", "Ngày của tài liệu", "资料日期", "วันที่ของเอกสาร", "Tanggal dokumen", "Record date"],
  ["모아둔 근무자료", "Tài liệu làm việc đã lưu", "已收集的工作资料", "เอกสารการทำงานที่บันทึกไว้", "Dokumen kerja tersimpan", "Saved work records"],
  ["자료 상세", "Chi tiết tài liệu", "资料详情", "รายละเอียดเอกสาร", "Detail dokumen", "Record details"],
  ["자료 삭제", "Xóa tài liệu", "删除资料", "ลบเอกสาร", "Hapus dokumen", "Delete record"],
  ["확인", "Xác nhận", "确认", "ยืนยัน", "Konfirmasi", "Confirm"],
  ["채용공고, 근로계약서, 실제 근무·급여 기록에서 달라진 조건을 확인하세요.", "Kiểm tra những điều kiện khác nhau giữa tin tuyển dụng, hợp đồng và hồ sơ làm việc, tiền lương.", "查看招聘信息、劳动合同及实际工作和工资记录中的条件差异。", "ตรวจสอบเงื่อนไขที่ต่างกันในประกาศงาน สัญญาจ้าง และบันทึกงานกับค่าจ้างจริง", "Periksa perbedaan ketentuan pada lowongan, kontrak, serta catatan kerja dan gaji aktual.", "Check differences across job postings, contracts, and actual work and pay records."],
  ["자료 확인하기", "Kiểm tra tài liệu", "查看资料", "ตรวจสอบเอกสาร", "Periksa dokumen", "Review records"],
  ["다시 비교하기", "So sánh lại", "重新比较", "เปรียบเทียบอีกครั้ง", "Bandingkan lagi", "Compare again"],
  ["최근 비교 결과", "Kết quả so sánh gần đây", "最近比较结果", "ผลการเปรียบเทียบล่าสุด", "Hasil perbandingan terbaru", "Latest comparison"],
  ["기록 사이의 조건을 확인했어요", "Đã kiểm tra điều kiện giữa các hồ sơ", "已检查记录之间的条件", "ตรวจสอบเงื่อนไขระหว่างบันทึกแล้ว", "Ketentuan antarcatatan telah diperiksa", "We checked the terms across your records"],
  ["비교 결과", "Kết quả so sánh", "比较结果", "ผลการเปรียบเทียบ", "Hasil perbandingan", "Comparison results"],
  ["조건별 기록", "Hồ sơ theo điều kiện", "按条件查看记录", "บันทึกตามเงื่อนไข", "Catatan berdasarkan ketentuan", "Records by term"],
  ["전체", "Tất cả", "全部", "ทั้งหมด", "Semua", "All"],
  ["기록이 다름", "Hồ sơ khác nhau", "记录不同", "บันทึกต่างกัน", "Catatan berbeda", "Records differ"],
  ["자료 부족", "Thiếu tài liệu", "资料不足", "เอกสารไม่เพียงพอ", "Dokumen kurang", "More records needed"],
  ["기록이 같음", "Hồ sơ giống nhau", "记录相同", "บันทึกตรงกัน", "Catatan sama", "Records match"],
  ["확인한 내용을 한곳에서 다시 봐요", "Xem lại nội dung đã xác nhận ở một nơi", "在一个地方重新查看已确认的内容", "ดูสิ่งที่ยืนยันแล้วอีกครั้งในที่เดียว", "Lihat kembali hal yang telah dikonfirmasi di satu tempat", "Review confirmed information in one place"],
  ["확인 대화로 돌아가기", "Quay lại trao đổi", "返回确认对话", "กลับไปยังการสนทนา", "Kembali ke percakapan", "Back to conversation"],
  ["보관된 대화", "Cuộc trò chuyện đã lưu", "已保存的对话", "การสนทนาที่บันทึกไว้", "Percakapan tersimpan", "Saved conversations"],
  ["답변되지 않은 내용", "Nội dung chưa trả lời", "未回答内容", "ประเด็นที่ยังไม่ได้ตอบ", "Hal yang belum dijawab", "Unanswered items"],
  ["현재 상태", "Trạng thái hiện tại", "当前状态", "สถานะปัจจุบัน", "Status saat ini", "Current status"],
  ["채용공고", "Tin tuyển dụng", "招聘信息", "ประกาศงาน", "Lowongan kerja", "Job posting"],
  ["근로계약서", "Hợp đồng lao động", "劳动合同", "สัญญาจ้างงาน", "Kontrak kerja", "Employment contract"],
  ["고용주 대화", "Trao đổi với chủ lao động", "与雇主对话", "การสนทนากับนายจ้าง", "Percakapan dengan pemberi kerja", "Employer conversation"],
  ["구두 약속 메모", "Ghi chú thỏa thuận miệng", "口头约定备忘", "บันทึกข้อตกลงด้วยวาจา", "Catatan janji lisan", "Verbal agreement note"],
  ["근무표", "Lịch làm việc", "工作表", "ตารางงาน", "Jadwal kerja", "Work schedule"],
  ["출퇴근 기록", "Chấm công", "考勤记录", "บันทึกเวลาเข้าออกงาน", "Catatan kehadiran", "Attendance record"],
  ["급여명세서", "Phiếu lương", "工资明细单", "สลิปเงินเดือน", "Slip gaji", "Payslip"],
  ["입금내역", "Lịch sử chuyển khoản", "入账记录", "ประวัติการโอนเงิน", "Riwayat transfer", "Deposit record"],
  ["사업장 공지", "Thông báo nơi làm việc", "工作场所通知", "ประกาศสถานที่ทำงาน", "Pengumuman tempat kerja", "Workplace notice"],
  ["기타", "Khác", "其他", "อื่นๆ", "Lainnya", "Other"],
  ["모든 종류", "Tất cả loại", "所有类型", "ทุกประเภท", "Semua jenis", "All types"],
  ["모든 상태", "Tất cả trạng thái", "所有状态", "ทุกสถานะ", "Semua status", "All statuses"],
  ["약속 기록", "Hồ sơ thỏa thuận", "约定记录", "บันทึกข้อตกลง", "Catatan kesepakatan", "Promised terms"],
  ["계약 기록", "Hồ sơ hợp đồng", "合同记录", "บันทึกสัญญา", "Catatan kontrak", "Contract terms"],
  ["실제 기록", "Hồ sơ thực tế", "实际记录", "บันทึกจริง", "Catatan aktual", "Actual records"],
  ["발견된 기록 차이", "Khác biệt được tìm thấy", "发现的记录差异", "ความแตกต่างที่พบ", "Perbedaan yang ditemukan", "Differences found"],
  ["확인 중", "Đang xác nhận", "确认中", "กำลังตรวจสอบ", "Sedang dikonfirmasi", "Checking"],
  ["아직 보관된 대화가 없어요", "Chưa có cuộc trò chuyện nào được lưu", "还没有已保存的对话", "ยังไม่มีการสนทนาที่บันทึกไว้", "Belum ada percakapan tersimpan", "No saved conversations yet"],
  ["확인 대화 시작하기", "Bắt đầu trao đổi", "开始确认对话", "เริ่มการสนทนา", "Mulai percakapan", "Start a conversation"],
  ["고용주 답변", "Câu trả lời của chủ lao động", "雇主答复", "คำตอบของนายจ้าง", "Jawaban pemberi kerja", "Employer reply"],
  ["답변 분석", "Phân tích câu trả lời", "答复分析", "วิเคราะห์คำตอบ", "Analisis jawaban", "Reply analysis"],
  ["부분 답변", "Trả lời một phần", "部分回答", "ตอบบางส่วน", "Dijawab sebagian", "Partly answered"],
  ["복사", "Sao chép", "复制", "คัดลอก", "Salin", "Copy"],
  ["· 문장의 의미", "· Ý nghĩa của câu", "· 句子含义", "· ความหมายของข้อความ", "· Arti kalimat", "· Meaning of the sentence"],
  ["· 사장님 답변의 의미", "· Ý nghĩa câu trả lời của chủ lao động", "· 雇主答复的含义", "· ความหมายของคำตอบนายจ้าง", "· Arti jawaban pemberi kerja", "· Meaning of the employer's reply"],
  ["문장을 복사했어요.", "Đã sao chép câu.", "已复制句子。", "คัดลอกข้อความแล้ว", "Kalimat telah disalin.", "Sentence copied."],
  ["복사하지 못했어요. 문장을 직접 선택해 복사해 주세요.", "Không thể sao chép. Vui lòng chọn và sao chép câu trực tiếp.", "无法复制，请手动选择并复制句子。", "คัดลอกไม่ได้ โปรดเลือกและคัดลอกข้อความด้วยตนเอง", "Tidak dapat menyalin. Pilih dan salin kalimat secara manual.", "Could not copy. Select and copy the sentence manually."],
  ["날짜 없음", "Không có ngày", "无日期", "ไม่มีวันที่", "Tidak ada tanggal", "No date"],
  ["확인되지 않음", "Chưa xác nhận", "未确认", "ยังไม่ยืนยัน", "Belum dikonfirmasi", "Not confirmed"],
  ["업로드 완료", "Đã tải lên", "上传完成", "อัปโหลดแล้ว", "Unggahan selesai", "Uploaded"],
  ["분석 중", "Đang phân tích", "分析中", "กำลังวิเคราะห์", "Sedang dianalisis", "Analyzing"],
  ["다시 시도하기", "Thử lại", "重试", "ลองอีกครั้ง", "Coba lagi", "Try again"],
  ["선택됨", "Đã chọn", "已选择", "เลือกแล้ว", "Dipilih", "Selected"],
  ["자료 추가하기", "Thêm tài liệu", "添加资料", "เพิ่มเอกสาร", "Tambah dokumen", "Add record"],
  ["자료를 추가하는 중…", "Đang thêm tài liệu…", "正在添加资料…", "กำลังเพิ่มเอกสาร…", "Sedang menambah dokumen…", "Adding record…"],
  ["근무자료를 불러오지 못했어요", "Không thể tải tài liệu làm việc", "无法加载工作资料", "ไม่สามารถโหลดเอกสารการทำงานได้", "Dokumen kerja tidak dapat dimuat", "Could not load work records"],
  ["요청을 처리하지 못했습니다.", "Không thể xử lý yêu cầu.", "无法处理请求。", "ไม่สามารถดำเนินการตามคำขอได้", "Permintaan tidak dapat diproses.", "Could not process the request."],
  ["잠시 후 다시 시도해 주세요. 저장된 자료는 삭제되지 않았어요.", "Vui lòng thử lại sau. Tài liệu đã lưu không bị xóa.", "请稍后重试，已保存的资料不会被删除。", "โปรดลองอีกครั้งภายหลัง เอกสารที่บันทึกไว้จะไม่ถูกลบ", "Coba lagi nanti. Dokumen tersimpan tidak dihapus.", "Please try again shortly. Your saved records were not deleted."],
  ["현재 기록에서 추가로 확인할 조건이 없어요.", "Không có điều kiện nào cần xác nhận thêm trong hồ sơ hiện tại.", "当前记录中没有需要进一步确认的条件。", "ไม่มีเงื่อนไขเพิ่มเติมที่ต้องตรวจสอบในบันทึกปัจจุบัน", "Tidak ada ketentuan tambahan yang perlu dikonfirmasi dalam catatan saat ini.", "There are no additional terms to confirm in the current records."],
  ["비교 결과를 불러오지 못했어요", "Không thể tải kết quả so sánh", "无法加载比较结果", "ไม่สามารถโหลดผลการเปรียบเทียบได้", "Hasil perbandingan tidak dapat dimuat", "Could not load comparison results"],
  ["비교 결과를 불러오지 못했어요.", "Không thể tải kết quả so sánh.", "无法加载比较结果。", "ไม่สามารถโหลดผลการเปรียบเทียบได้", "Hasil perbandingan tidak dapat dimuat.", "Could not load comparison results."],
  ["잠시 후 다시 시도해 주세요. 모아둔 자료는 삭제되지 않았어요.", "Vui lòng thử lại sau. Tài liệu đã thu thập không bị xóa.", "请稍后重试，已收集的资料不会被删除。", "โปรดลองอีกครั้งภายหลัง เอกสารที่รวบรวมไว้จะไม่ถูกลบ", "Coba lagi nanti. Dokumen yang telah dikumpulkan tidak dihapus.", "Please try again shortly. Your collected records were not deleted."],
  ["근무조건을 비교하고 있어요", "Đang so sánh điều kiện làm việc", "正在比较工作条件", "กำลังเปรียบเทียบเงื่อนไขการทำงาน", "Sedang membandingkan ketentuan kerja", "Comparing working conditions"],
  ["모아둔 기록을 시간순으로 살펴보고 있어요.", "Đang xem các hồ sơ đã lưu theo thời gian.", "正在按时间查看已收集的记录。", "กำลังตรวจสอบบันทึกตามลำดับเวลา", "Sedang meninjau catatan berdasarkan waktu.", "Reviewing saved records in chronological order."],
  ["비교할 수 있는 기록이 아직 없어요", "Chưa có hồ sơ để so sánh", "还没有可比较的记录", "ยังไม่มีบันทึกให้เปรียบเทียบ", "Belum ada catatan untuk dibandingkan", "There are no records to compare yet"],
  ["채용공고, 계약서, 급여명세서처럼 서로 비교할 자료를 추가해 주세요.", "Hãy thêm tài liệu có thể so sánh như tin tuyển dụng, hợp đồng và phiếu lương.", "请添加招聘信息、合同和工资单等可相互比较的资料。", "เพิ่มเอกสารที่เปรียบเทียบกันได้ เช่น ประกาศงาน สัญญา และสลิปเงินเดือน", "Tambahkan dokumen yang dapat dibandingkan seperti lowongan, kontrak, dan slip gaji.", "Add comparable records such as a job posting, contract, and payslip."],
  ["이 상태에 해당하는 조건이 없어요", "Không có điều kiện nào ở trạng thái này", "没有符合此状态的条件", "ไม่มีเงื่อนไขในสถานะนี้", "Tidak ada ketentuan dengan status ini", "No terms have this status"],
  ["다른 비교 상태를 선택해 보세요.", "Hãy chọn trạng thái so sánh khác.", "请选择其他比较状态。", "ลองเลือกสถานะการเปรียบเทียบอื่น", "Pilih status perbandingan lain.", "Choose a different comparison status."],
  ["시급 기록이", "Mức lương theo giờ", "时薪记录", "บันทึกค่าจ้างรายชั่วโมง", "Catatan upah per jam", "The hourly wage records are"],
  ["달라요", "khác nhau", "不一致", "แตกต่างกัน", "berbeda", "different"],
  ["입력한 답변은 다음 확인 문장을 만들기 위해 대화 기록에 저장됩니다.", "Câu trả lời bạn nhập sẽ được lưu trong lịch sử trò chuyện để tạo câu hỏi xác nhận tiếp theo.", "您输入的答复将保存在对话记录中，用于生成下一句确认问题。", "คำตอบที่ป้อนจะถูกบันทึกไว้ในประวัติการสนทนาเพื่อสร้างข้อความยืนยันถัดไป", "Jawaban yang Anda masukkan akan disimpan dalam riwayat percakapan untuk membuat pertanyaan tindak lanjut.", "Your entered reply is saved in the conversation history to create the next confirmation message."],
  ["이 문장은 기록을 확인하기 위한 예시이며, 위법 여부를 판단하거나 법률 자문을 제공하지 않습니다.", "Câu này là ví dụ để xác nhận hồ sơ; không xác định hành vi có trái luật hay cung cấp tư vấn pháp lý.", "此句仅为确认记录的示例，不判断是否违法，也不提供法律咨询。", "ข้อความนี้เป็นเพียงตัวอย่างสำหรับตรวจสอบบันทึก ไม่ได้ตัดสินว่าผิดกฎหมายหรือให้คำปรึกษาทางกฎหมาย", "Kalimat ini adalah contoh untuk memeriksa catatan; tidak menentukan pelanggaran hukum atau memberikan nasihat hukum.", "This sentence is an example for checking records; it does not determine legality or provide legal advice."],
  ["확인 문장의 말투 선택", "Chọn giọng điệu câu xác nhận", "选择确认句的语气", "เลือกน้ำเสียงของข้อความยืนยัน", "Pilih nada kalimat konfirmasi", "Choose the confirmation message tone"],
  ["질문한 항목이 답변되었는지 나누는 중입니다.", "Đang kiểm tra nội dung nào đã được trả lời.", "正在区分哪些问题已得到回答。", "กำลังตรวจสอบว่าประเด็นใดได้รับคำตอบแล้ว", "Sedang memeriksa pertanyaan mana yang telah dijawab.", "Checking which questions were answered."],
  ["답변을 분석하지 못했어요.", "Không thể phân tích câu trả lời.", "无法分析答复。", "ไม่สามารถวิเคราะห์คำตอบได้", "Jawaban tidak dapat dianalisis.", "Could not analyze the reply."],
  ["분석 결과", "Kết quả phân tích", "分析结果", "ผลการวิเคราะห์", "Hasil analisis", "Analysis results"],
  ["일부만 답변되었어요", "Chỉ một phần được trả lời", "仅回答了一部分", "ตอบเพียงบางส่วน", "Hanya sebagian yang dijawab", "Only some items were answered"],
  ["답변을 이렇게 확인했어요", "Cách chúng tôi kiểm tra câu trả lời", "答复检查方式", "วิธีที่เราตรวจสอบคำตอบ", "Cara kami memeriksa jawaban", "How we checked the reply"],
  ["기록으로 확인된 사실", "Thông tin được hồ sơ xác nhận", "记录确认的事实", "ข้อเท็จจริงที่ยืนยันจากบันทึก", "Fakta yang dikonfirmasi oleh catatan", "Facts confirmed by records"],
  ["과", "và", "与", "และ", "dan", "and"],
  ["AI의 참고 분석", "Phân tích tham khảo của AI", "AI参考分析", "การวิเคราะห์อ้างอิงโดย AI", "Analisis referensi AI", "AI reference analysis"],
  ["을 구분해서 보여드려요. 위법 여부를 확정하는 법률 판단은 아닙니다.", "được hiển thị riêng. Đây không phải là kết luận pháp lý về tính hợp pháp.", "将分别显示。这不是对是否合法的法律判断。", "จะแสดงแยกกัน และไม่ใช่คำวินิจฉัยทางกฎหมาย", "ditampilkan secara terpisah. Ini bukan penilaian hukum atas legalitas.", "are shown separately. This is not a legal determination."],
  ["대화 기록에 안전하게 보관돼요.", "Được lưu an toàn trong lịch sử trò chuyện.", "安全保存在对话记录中。", "บันทึกไว้อย่างปลอดภัยในประวัติการสนทนา", "Disimpan dengan aman dalam riwayat percakapan.", "Saved safely in conversation history."],
  ["계약서 시급 12,000원", "Hợp đồng: 12.000 won/giờ", "合同：时薪12,000韩元", "สัญญา: 12,000 วอนต่อชั่วโมง", "Kontrak: 12.000 won per jam", "Contract: KRW 12,000/hour"],
  ["급여명세서 시급 10,500원", "Phiếu lương: 10.500 won/giờ", "工资单：时薪10,500韩元", "สลิปเงินเดือน: 10,500 วอนต่อชั่วโมง", "Slip gaji: 10.500 won per jam", "Payslip: KRW 10,500/hour"],
  ["수습기간을 적용했다는 주장", "Chủ lao động nói rằng thời gian thử việc được áp dụng", "雇主称适用了试用期", "นายจ้างระบุว่าใช้ช่วงทดลองงาน", "Pemberi kerja menyatakan masa percobaan diterapkan", "Employer states that probation applies"],
  ["수습기간의 시작일과 종료일", "Ngày bắt đầu và kết thúc thử việc", "试用期的开始和结束日期", "วันเริ่มต้นและสิ้นสุดช่วงทดลองงาน", "Tanggal mulai dan berakhir masa percobaan", "Probation start and end dates"],
  ["어디에서 합의했는지", "Nội dung được thỏa thuận ở đâu", "在哪里作出的约定", "ตกลงเรื่องนี้ไว้ที่ใด", "Di mana hal ini disepakati", "Where this was agreed"],
  ["10,500원의 계산 근거", "Căn cứ tính mức 10.500 won", "10,500韩元的计算依据", "หลักเกณฑ์การคำนวณ 10,500 วอน", "Dasar perhitungan 10.500 won", "Basis for the KRW 10,500 calculation"],
  ["채용공고와 다른 이유", "Lý do khác với tin tuyển dụng", "与招聘信息不同的原因", "เหตุผลที่ต่างจากประกาศงาน", "Alasan berbeda dari lowongan", "Why it differs from the job posting"],
  ["홈 | 근로권리 동반자", "Trang chủ | Đồng hành quyền lao động", "首页 | 劳动权益伙伴", "หน้าหลัก | ผู้ช่วยสิทธิแรงงาน", "Beranda | Pendamping hak pekerja", "Home | Work Rights Companion"],
  ["자료 모으기 | 근로권리 동반자", "Thu thập tài liệu | Đồng hành quyền lao động", "收集资料 | 劳动权益伙伴", "รวบรวมเอกสาร | ผู้ช่วยสิทธิแรงงาน", "Kumpulkan dokumen | Pendamping hak pekerja", "Collect records | Work Rights Companion"],
  ["PDF, JPG, PNG · 최대 10MB", "PDF, JPG, PNG · tối đa 10MB", "PDF、JPG、PNG · 最大10MB", "PDF, JPG, PNG · สูงสุด 10MB", "PDF, JPG, PNG · maks. 10MB", "PDF, JPG, PNG · up to 10MB"],
  ["종류를 선택하세요", "Chọn loại tài liệu", "请选择类型", "เลือกประเภท", "Pilih jenis", "Select a type"],
  ["문서에 적힌 날짜나 자료를 받은 날짜를 입력하세요.", "Nhập ngày trên tài liệu hoặc ngày bạn nhận được.", "请输入文件上的日期或收到资料的日期。", "กรอกวันที่ในเอกสารหรือวันที่ได้รับเอกสาร", "Masukkan tanggal pada dokumen atau tanggal diterima.", "Enter the date on the document or the date you received it."],
  ["원본 파일은 비공개 저장소에 보관됩니다.", "Tệp gốc được lưu trong kho riêng tư.", "原始文件保存在私有存储中。", "ไฟล์ต้นฉบับถูกเก็บไว้ในพื้นที่ส่วนตัว", "Berkas asli disimpan di penyimpanan pribadi.", "Original files are kept in private storage."],
  ["타임라인", "Dòng thời gian", "时间线", "ไทม์ไลน์", "Linimasa", "Timeline"],
  ["자료 종류 필터", "Lọc loại tài liệu", "资料类型筛选", "ตัวกรองประเภทเอกสาร", "Filter jenis dokumen", "Record type filter"],
  ["처리 상태 필터", "Lọc trạng thái xử lý", "处理状态筛选", "ตัวกรองสถานะ", "Filter status proses", "Processing status filter"],
  ["기록 비교하기 | 근로권리 동반자", "So sánh hồ sơ | Đồng hành quyền lao động", "比较记录 | 劳动权益伙伴", "เปรียบเทียบบันทึก | ผู้ช่วยสิทธิแรงงาน", "Bandingkan catatan | Pendamping hak pekerja", "Compare records | Work Rights Companion"],
  ["달라진 기록부터 차근차근 살펴보세요.", "Hãy xem từng hồ sơ khác nhau trước.", "请从不同的记录开始逐项查看。", "เริ่มตรวจสอบจากบันทึกที่แตกต่างกันทีละรายการ", "Periksa catatan yang berbeda terlebih dahulu.", "Start with the records that differ."],
  ["비교 결과는 기록을 정리한 정보입니다.", "Kết quả so sánh chỉ sắp xếp thông tin trong hồ sơ.", "比较结果只是对记录信息的整理。", "ผลการเปรียบเทียบเป็นการจัดระเบียบข้อมูลในบันทึก", "Hasil perbandingan hanya merangkum informasi catatan.", "Comparison results organize information from your records."],
  ["위법 여부를 확정하지 않으며, 공식 정보와 실제 적용 기준을 추가로 확인할 수 있어요.", "Kết quả không kết luận vi phạm pháp luật; hãy kiểm tra thêm thông tin chính thức và tiêu chuẩn áp dụng.", "结果不判定是否违法；请进一步确认官方信息和实际适用标准。", "ผลลัพธ์ไม่ได้ตัดสินว่าผิดกฎหมาย โปรดตรวจสอบข้อมูลทางการและเกณฑ์ที่ใช้จริงเพิ่มเติม", "Hasil tidak menetapkan pelanggaran hukum; periksa informasi resmi dan standar yang berlaku.", "It does not determine legality; check official information and the rules that apply."],
  ["근로 기록함 | 근로권리 동반자", "Hồ sơ lao động | Đồng hành quyền lao động", "劳动记录 | 劳动权益伙伴", "บันทึกการทำงาน | ผู้ช่วยสิทธิแรงงาน", "Catatan kerja | Pendamping hak pekerja", "Work records | Work Rights Companion"],
  ["STEP 4 · 근로 기록함", "BƯỚC 4 · Hồ sơ lao động", "第4步 · 劳动记录", "ขั้นตอน 4 · บันทึกการทำงาน", "LANGKAH 4 · Catatan kerja", "STEP 4 · Work records"],
  ["추천 문장, 고용주 답변과 아직 확인할 내용을 시간순으로 보관해요.", "Lưu câu gợi ý, câu trả lời của chủ lao động và nội dung chưa xác nhận theo thời gian.", "按时间保存建议句、雇主答复和尚未确认的内容。", "เก็บข้อความแนะนำ คำตอบนายจ้าง และสิ่งที่ยังไม่ได้ยืนยันตามลำดับเวลา", "Simpan kalimat saran, jawaban pemberi kerja, dan hal yang belum dikonfirmasi secara kronologis.", "Keep suggested messages, employer replies, and unresolved items in chronological order."],
  ["확인 대화에서 고용주 답변을 분석하면 이곳에서 다시 볼 수 있어요.", "Sau khi phân tích câu trả lời, bạn có thể xem lại tại đây.", "分析雇主答复后，可在此处再次查看。", "หลังวิเคราะห์คำตอบของนายจ้างแล้ว คุณสามารถกลับมาดูที่นี่ได้", "Setelah menganalisis jawaban, Anda dapat melihatnya lagi di sini.", "After analyzing an employer reply, you can review it here."],
  ["가온식당 · 시급 확인", "Nhà hàng Gaon · Kiểm tra lương giờ", "Gaon餐厅 · 时薪确认", "ร้านอาหารกาอน · ตรวจสอบค่าจ้างรายชั่วโมง", "Restoran Gaon · Periksa upah per jam", "Gaon Restaurant · Hourly wage check"],
  ["계약서와 급여명세서의 시급 기록이 달라요", "Mức lương giờ trong hợp đồng và phiếu lương khác nhau", "合同和工资单中的时薪记录不同", "อัตราค่าจ้างในสัญญาและสลิปเงินเดือนไม่ตรงกัน", "Catatan upah per jam pada kontrak dan slip gaji berbeda", "The hourly wage differs between the contract and payslip"],
  ["부분 답변 · 확인 필요", "Trả lời một phần · Cần xác nhận", "部分回答 · 需要确认", "ตอบบางส่วน · ต้องตรวจสอบ", "Dijawab sebagian · Perlu dikonfirmasi", "Partly answered · Needs confirmation"],
  ["시급 12,000원", "Lương giờ 12.000 won", "时薪12,000韩元", "ค่าจ้าง 12,000 วอนต่อชั่วโมง", "Upah 12.000 won per jam", "KRW 12,000 per hour"],
  ["계산 시급 10,500원", "Lương giờ tính toán 10.500 won", "计算时薪10,500韩元", "อัตราที่ใช้คำนวณ 10,500 วอน", "Tarif perhitungan 10.500 won", "Calculated rate KRW 10,500"],
  ["1,500원 다름", "Chênh lệch 1.500 won", "相差1,500韩元", "ต่างกัน 1,500 วอน", "Selisih 1.500 won", "KRW 1,500 difference"],
  ["내가 준비한 확인 문장", "Câu xác nhận tôi đã chuẩn bị", "我准备的确认句", "ข้อความยืนยันที่ฉันเตรียมไว้", "Kalimat konfirmasi yang saya siapkan", "My prepared confirmation message"],
  ["오늘", "Hôm nay", "今天", "วันนี้", "Hari ini", "Today"],
  ["답변된 내용", "Nội dung đã trả lời", "已回答内容", "ประเด็นที่ตอบแล้ว", "Hal yang telah dijawab", "Answered items"],
  ["아직 답변되지 않은 내용", "Nội dung chưa trả lời", "尚未回答的内容", "ประเด็นที่ยังไม่ได้ตอบ", "Hal yang belum dijawab", "Unanswered items"],
  ["다음에 확인할 문장", "Câu hỏi tiếp theo", "下一句确认问题", "ข้อความที่จะถามต่อ", "Kalimat tindak lanjut", "Follow-up message"],
  ["준비됨", "Đã sẵn sàng", "已准备", "พร้อมแล้ว", "Siap", "Ready"],
  ["답변을 다시 분석하기", "Phân tích lại câu trả lời", "重新分析答复", "วิเคราะห์คำตอบอีกครั้ง", "Analisis ulang jawaban", "Analyze the reply again"],
  ["이 기록함은 사용자가 모은 자료와 대화를 정리해 보여주며, 위법 여부를 확정하지 않습니다.", "Hồ sơ này sắp xếp tài liệu và cuộc trò chuyện của bạn; không kết luận vi phạm pháp luật.", "本记录夹整理展示用户资料和对话，不判定是否违法。", "กล่องบันทึกนี้จัดระเบียบเอกสารและการสนทนา โดยไม่ได้ตัดสินว่าผิดกฎหมายหรือไม่", "Kotak ini merangkum dokumen dan percakapan Anda tanpa menetapkan pelanggaran hukum.", "This record box organizes your documents and conversations; it does not determine legality."],
];

const TABLE = new Map(ROWS.map((row) => [row[0], row]));
const originals = new WeakMap();
const attributeOriginals = new WeakMap();
const PATTERNS = [
  {
    source: /^찾은 조건 ([\d,]+)개$/,
    values: ["찾은 조건 $1개", "Đã tìm thấy $1 điều kiện", "找到 $1 个条件", "พบ $1 เงื่อนไข", "Ditemukan $1 ketentuan", "$1 conditions found"],
  },
  {
    source: /^([\d,]+)개$/,
    values: ["$1개", "$1 mục", "$1项", "$1 รายการ", "$1 item", "$1 items"],
  },
  {
    source: /^([\d,]+)원$/,
    values: ["$1원", "$1 won", "$1韩元", "$1 วอน", "$1 won", "KRW $1"],
  },
  {
    source: /^([\d,.]+)시간$/,
    values: ["$1시간", "$1 giờ", "$1小时", "$1 ชั่วโมง", "$1 jam", "$1 hours"],
  },
];

function language() {
  const value = document.querySelector("#site-language")?.value
    || sessionStorage.getItem("site_display_language_v2") || "ko";
  return Object.hasOwn(INDEX, value) ? value : "ko";
}

function translateNode(node, index) {
  if (node.parentElement?.closest("[translate='no'], .notranslate")) return;
  if (!originals.has(node)) originals.set(node, node.nodeValue);
  const source = originals.get(node);
  const key = source.trim();
  const row = TABLE.get(key);
  if (row) {
    const translated = source.replace(key, row[index]);
    if (node.nodeValue !== translated) node.nodeValue = translated;
    return;
  }
  const pattern = PATTERNS.find(({ source: expression }) => expression.test(key));
  if (pattern) {
    const translated = source.replace(key, key.replace(pattern.source, pattern.values[index]));
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }
}

function translateAttributes(element, index) {
  if (element.closest("[translate='no'], .notranslate")) return;
  if (!attributeOriginals.has(element)) attributeOriginals.set(element, {});
  const saved = attributeOriginals.get(element);
  ["placeholder", "title", "aria-label"].forEach((name) => {
    if (!element.hasAttribute(name)) return;
    if (!(name in saved)) saved[name] = element.getAttribute(name);
    const row = TABLE.get(saved[name]);
    if (row) element.setAttribute(name, row[index]);
  });
}

function apply(languageCode = language()) {
  const index = INDEX[languageCode] ?? 0;
  document.documentElement.lang = languageCode;
  if (!document.documentElement.dataset.sourceTitle) {
    document.documentElement.dataset.sourceTitle = document.title;
  }
  const titleRow = TABLE.get(document.documentElement.dataset.sourceTitle);
  if (titleRow) document.title = titleRow[index];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return ["SCRIPT", "STYLE"].includes(node.parentElement?.tagName)
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) translateNode(walker.currentNode, index);
  document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
    translateAttributes(element, index);
  });
}

const observer = new MutationObserver((mutations) => {
  const index = INDEX[language()] ?? 0;
  mutations.forEach(({ addedNodes, target, type }) => {
    if (type === "characterData") translateNode(target, index);
    addedNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) translateNode(node, index);
    if (node.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(node, index);
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateNode(walker.currentNode, index);
    }
    });
  });
});

apply();
observer.observe(document.body, { childList: true, subtree: true, characterData: true });
document.addEventListener("userlanguagechange", (event) => apply(event.detail.language));
