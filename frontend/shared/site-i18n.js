const INDEX = { ko: 0, vi: 1, "zh-CN": 2, th: 3, id: 4, en: 5 };
const ROWS = [
  ["홈", "Trang chủ", "首页", "หน้าหลัก", "Beranda", "Home"],
  ["로그인 / 회원가입", "Đăng nhập / Đăng ký", "登录 / 注册", "เข้าสู่ระบบ / สมัครสมาชิก", "Masuk / Daftar", "Log in / Sign up"],
  ["내 근로 기록을 확인하고 있어요", "Đang kiểm tra hồ sơ làm việc của tôi", "正在查看我的工作记录", "กำลังตรวจสอบบันทึกการทำงานของฉัน", "Sedang memeriksa catatan kerja saya", "Reviewing my work records"],
  ["모아둔 자료에서 현재 상태를 불러오는 중입니다.", "Đang tải trạng thái hiện tại từ tài liệu đã lưu.", "正在从已保存的资料中加载当前状态。", "กำลังโหลดสถานะปัจจุบันจากเอกสารที่บันทึกไว้", "Memuat status saat ini dari dokumen tersimpan.", "Loading the current status from saved records."],
  ["추천 다음 단계", "Bước tiếp theo được đề xuất", "建议的下一步", "ขั้นตอนถัดไปที่แนะนำ", "Langkah berikutnya yang disarankan", "Recommended next step"],
  ["기록을 확인하는 중...", "Đang kiểm tra hồ sơ...", "正在检查记录……", "กำลังตรวจสอบบันทึก...", "Memeriksa catatan...", "Checking records..."],
  ["잠시만 기다려 주세요.", "Vui lòng chờ một chút.", "请稍候。", "โปรดรอสักครู่", "Mohon tunggu sebentar.", "Please wait a moment."],
  ["전체 기능 바로가기", "Lối tắt đến tất cả chức năng", "所有功能快捷入口", "ทางลัดไปยังทุกฟังก์ชัน", "Pintasan ke semua fitur", "All feature shortcuts"],
  ["원하는 페이지로 바로 이동하세요", "Đi thẳng đến trang bạn muốn", "直接前往所需页面", "ไปยังหน้าที่ต้องการได้ทันที", "Langsung buka halaman yang diinginkan", "Go directly to the page you need"],
  ["계약서·명세서 추가", "Thêm hợp đồng · phiếu lương", "添加合同和工资单", "เพิ่มสัญญาและสลิปเงินเดือน", "Tambah kontrak · slip gaji", "Add contracts · payslips"],
  ["조건 비교", "So sánh điều kiện", "条件比较", "เปรียบเทียบเงื่อนไข", "Bandingkan ketentuan", "Compare terms"],
  ["달라진 기록 확인", "Kiểm tra hồ sơ khác nhau", "查看不同的记录", "ตรวจสอบบันทึกที่ต่างกัน", "Periksa catatan yang berbeda", "Review differing records"],
  ["확인 문장·답변 분석", "Câu xác nhận · phân tích trả lời", "确认语句和答复分析", "ข้อความยืนยัน · วิเคราะห์คำตอบ", "Pesan konfirmasi · analisis jawaban", "Confirmation message · reply analysis"],
  ["전체 기록 다시 보기", "Xem lại toàn bộ hồ sơ", "重新查看全部记录", "ดูบันทึกทั้งหมดอีกครั้ง", "Lihat kembali semua catatan", "Review all records"],
  ["공동 경험", "Kinh nghiệm chung", "共同经验", "ประสบการณ์ร่วม", "Pengalaman bersama", "Shared experiences"],
  ["비슷한 경험 확인", "Xem kinh nghiệm tương tự", "查看相似经历", "ดูประสบการณ์ที่คล้ายกัน", "Lihat pengalaman serupa", "Review similar experiences"],
  ["현재 상황", "Tình trạng hiện tại", "当前情况", "สถานการณ์ปัจจุบัน", "Situasi saat ini", "Current situation"],
  ["자세히 보기 →", "Xem chi tiết →", "查看详情 →", "ดูรายละเอียด →", "Lihat detail →", "View details →"],
  ["기록 요약", "Tóm tắt hồ sơ", "记录摘要", "สรุปบันทึก", "Ringkasan catatan", "Record summary"],
  ["자료를 불러오는 중입니다.", "Đang tải tài liệu.", "正在加载资料。", "กำลังโหลดเอกสาร", "Memuat dokumen.", "Loading records."],
  ["약속·계약", "Thỏa thuận · hợp đồng", "约定和合同", "ข้อตกลง · สัญญา", "Janji · kontrak", "Promise · contract"],
  ["전체 진행", "Tiến độ tổng thể", "总体进度", "ความคืบหน้าทั้งหมด", "Progres keseluruhan", "Overall progress"],
  ["자료 수집", "Thu thập tài liệu", "收集资料", "รวบรวมเอกสาร", "Pengumpulan dokumen", "Collect records"],
  ["근로자료를 모아요", "Thu thập tài liệu làm việc", "收集工作资料", "รวบรวมเอกสารการทำงาน", "Kumpulkan dokumen kerja", "Collect work records"],
  ["기록 비교", "So sánh hồ sơ", "记录比较", "เปรียบเทียบบันทึก", "Bandingkan catatan", "Compare records"],
  ["달라진 조건을 확인해요", "Kiểm tra điều kiện đã thay đổi", "检查变化的条件", "ตรวจสอบเงื่อนไขที่เปลี่ยนไป", "Periksa ketentuan yang berubah", "Check changed terms"],
  ["확인 대화", "Trao đổi xác nhận", "确认对话", "การสนทนาเพื่อยืนยัน", "Percakapan konfirmasi", "Confirmation conversation"],
  ["고용주에게 확인하고 답변을 남겨요", "Xác nhận với chủ lao động và lưu câu trả lời", "向雇主确认并保存答复", "ยืนยันกับนายจ้างและบันทึกคำตอบ", "Konfirmasi kepada pemberi kerja dan simpan jawaban", "Confirm with the employer and save the reply"],
  ["경험 정리", "Tóm tắt kinh nghiệm", "整理经历", "สรุปประสบการณ์", "Rangkum pengalaman", "Summarize experience"],
  ["내 경험을 확인하고 공유해요", "Kiểm tra và chia sẻ kinh nghiệm của tôi", "查看并分享我的经历", "ตรวจสอบและแบ่งปันประสบการณ์ของฉัน", "Periksa dan bagikan pengalaman saya", "Review and share my experience"],
  ["대기", "Chờ", "等待", "รอ", "Menunggu", "Waiting"],
  ["진행 중", "Đang tiến hành", "进行中", "กำลังดำเนินการ", "Sedang berlangsung", "In progress"],
  ["완료", "Hoàn tất", "完成", "เสร็จสิ้น", "Selesai", "Complete"],
  ["모아둔 기록", "Hồ sơ đã lưu", "已保存的记录", "บันทึกที่เก็บไว้", "Catatan tersimpan", "Saved records"],
  ["내 기록 보기 →", "Xem hồ sơ của tôi →", "查看我的记录 →", "ดูบันทึกของฉัน →", "Lihat catatan saya →", "View my records →"],
  ["비슷한 경험", "Kinh nghiệm tương tự", "相似经历", "ประสบการณ์ที่คล้ายกัน", "Pengalaman serupa", "Similar experiences"],
  ["공동 경험 보기 →", "Xem kinh nghiệm chung →", "查看共同经验 →", "ดูประสบการณ์ร่วม →", "Lihat pengalaman bersama →", "View shared experiences →"],
  ["첫 근로자료부터 모아볼까요?", "Hãy bắt đầu với tài liệu làm việc đầu tiên nhé?", "从第一份工作资料开始收集吧？", "มาเริ่มเก็บเอกสารการทำงานชิ้นแรกกันไหม", "Mari mulai dari dokumen kerja pertama.", "Shall we collect your first work record?"],
  ["계약서나 급여명세서를 추가하면 기록 사이에 달라진 조건이 있는지 함께 확인합니다.", "Thêm hợp đồng hoặc phiếu lương để kiểm tra các điều kiện khác nhau giữa hồ sơ.", "添加合同或工资单后，我们会一起检查记录之间是否存在不同条件。", "เพิ่มสัญญาหรือสลิปเงินเดือนเพื่อตรวจสอบเงื่อนไขที่ต่างกันระหว่างบันทึก", "Tambahkan kontrak atau slip gaji untuk memeriksa perbedaan ketentuan antarcatatan.", "Add a contract or payslip to check for differing terms across records."],
  ["첫 자료를 추가해 주세요", "Hãy thêm tài liệu đầu tiên", "请添加第一份资料", "เพิ่มเอกสารชิ้นแรก", "Tambahkan dokumen pertama", "Add your first record"],
  ["사진이나 PDF 한 개부터 시작할 수 있어요.", "Bạn có thể bắt đầu bằng một ảnh hoặc tệp PDF.", "可以从一张图片或一个 PDF 开始。", "เริ่มได้ด้วยรูปภาพหรือ PDF หนึ่งไฟล์", "Anda dapat mulai dengan satu foto atau PDF.", "You can start with one photo or PDF."],
  ["아직 모아둔 자료가 없어요", "Chưa có tài liệu nào được lưu", "还没有已保存的资料", "ยังไม่มีเอกสารที่บันทึกไว้", "Belum ada dokumen tersimpan", "No records saved yet"],
  ["자료를 추가하면 현재 상황이 여기에 정리됩니다.", "Khi thêm tài liệu, tình trạng hiện tại sẽ được tóm tắt tại đây.", "添加资料后，当前情况会汇总在这里。", "เมื่อเพิ่มเอกสาร สถานการณ์ปัจจุบันจะสรุปไว้ที่นี่", "Setelah menambah dokumen, situasi saat ini akan dirangkum di sini.", "Once you add records, the current situation will be summarized here."],
  ["근로자료를 모으고 있어요", "Đang thu thập tài liệu làm việc", "正在收集工作资料", "กำลังรวบรวมเอกสารการทำงาน", "Sedang mengumpulkan dokumen kerja", "Collecting work records"],
  ["기록 비교 결과를 확인해 주세요", "Hãy kiểm tra kết quả so sánh hồ sơ", "请查看记录比较结果", "ตรวจสอบผลการเปรียบเทียบบันทึก", "Periksa hasil perbandingan catatan", "Review the record comparison"],
  ["서로 다른 조건이나 추가로 필요한 기록이 있는지 살펴보세요.", "Kiểm tra các điều kiện khác nhau hoặc tài liệu cần bổ sung.", "查看是否存在不同条件或需要补充的记录。", "ตรวจสอบเงื่อนไขที่ต่างกันหรือบันทึกที่ต้องเพิ่ม", "Periksa ketentuan yang berbeda atau catatan tambahan yang diperlukan.", "Check for differing terms or additional records needed."],
  ["자료 수집 완료", "Đã thu thập tài liệu", "资料收集完成", "รวบรวมเอกสารแล้ว", "Pengumpulan dokumen selesai", "Records collected"],
  ["정리한 경험을 확인해 주세요", "Hãy kiểm tra kinh nghiệm đã tóm tắt", "请查看整理后的经历", "ตรวจสอบประสบการณ์ที่สรุปไว้", "Periksa pengalaman yang telah dirangkum", "Review your summarized experience"],
  ["내용은 언제든 수정할 수 있고, 공유되는 경험은 한 개만 유지됩니다.", "Bạn có thể sửa bất cứ lúc nào và chỉ duy trì một kinh nghiệm được chia sẻ.", "内容可随时修改，并且只保留一条共享经历。", "แก้ไขได้ทุกเมื่อและเก็บประสบการณ์ที่แชร์ไว้เพียงหนึ่งรายการ", "Isi dapat diedit kapan saja dan hanya satu pengalaman yang dibagikan akan disimpan.", "You can edit it anytime, and only one shared experience is kept."],
  ["경험 수정하기", "Sửa kinh nghiệm", "修改经历", "แก้ไขประสบการณ์", "Edit pengalaman", "Edit experience"],
  ["확인 대화가 마무리됐어요", "Cuộc trao đổi xác nhận đã hoàn tất", "确认对话已结束", "การสนทนาเพื่อยืนยันเสร็จแล้ว", "Percakapan konfirmasi selesai", "The confirmation conversation is complete"],
  ["모아둔 기록과 대화를 바탕으로 내 경험이 자동 작성됩니다.", "Kinh nghiệm của bạn được tự động soạn từ hồ sơ và cuộc trò chuyện đã lưu.", "系统会根据保存的记录和对话自动生成您的经历。", "ระบบจะเขียนประสบการณ์จากบันทึกและบทสนทนาที่เก็บไว้โดยอัตโนมัติ", "Pengalaman Anda dibuat otomatis dari catatan dan percakapan tersimpan.", "Your experience is drafted automatically from saved records and conversations."],
  ["경험 정리하기", "Tóm tắt kinh nghiệm", "整理经历", "สรุปประสบการณ์", "Rangkum pengalaman", "Summarize experience"],
  ["고용주 답변을 확인해 주세요", "Hãy kiểm tra câu trả lời của chủ lao động", "请查看雇主答复", "ตรวจสอบคำตอบของนายจ้าง", "Periksa jawaban pemberi kerja", "Review the employer's reply"],
  ["답변된 내용과 아직 답변되지 않은 내용을 나누어 보여드립니다.", "Nội dung đã trả lời và chưa trả lời được hiển thị riêng.", "已回答和未回答的内容会分别显示。", "แสดงเนื้อหาที่ตอบแล้วและยังไม่ได้ตอบแยกกัน", "Jawaban dan hal yang belum dijawab ditampilkan terpisah.", "Answered and unanswered items are shown separately."],
  ["답변 분석하기", "Phân tích câu trả lời", "分析答复", "วิเคราะห์คำตอบ", "Analisis jawaban", "Analyze reply"],
  ["고용주의 답변을 받았나요?", "Bạn đã nhận được câu trả lời của chủ lao động chưa?", "收到雇主的答复了吗？", "ได้รับคำตอบจากนายจ้างหรือยัง", "Sudah menerima jawaban pemberi kerja?", "Did you receive the employer's reply?"],
  ["받은 답변을 붙여 넣으면 다음 질문까지 이어서 정리합니다.", "Dán câu trả lời nhận được để tiếp tục đến câu hỏi tiếp theo.", "粘贴收到的答复后，系统会继续整理下一个问题。", "วางคำตอบที่ได้รับเพื่อจัดทำคำถามถัดไป", "Tempel jawaban yang diterima untuk melanjutkan ke pertanyaan berikutnya.", "Paste the reply to continue with the next question."],
  ["답변 기록하기", "Lưu câu trả lời", "记录答复", "บันทึกคำตอบ", "Catat jawaban", "Record reply"],
  ["고용주에게 확인할 문장을 준비해 주세요", "Hãy chuẩn bị câu hỏi xác nhận cho chủ lao động", "请准备向雇主确认的语句", "เตรียมข้อความยืนยันสำหรับนายจ้าง", "Siapkan pesan konfirmasi untuk pemberi kerja", "Prepare a confirmation message for the employer"],
  ["발견된 기록 차이를 바탕으로 정중하고 명확한 문장을 만듭니다.", "Tạo câu lịch sự và rõ ràng dựa trên khác biệt trong hồ sơ.", "根据发现的记录差异生成礼貌而明确的语句。", "สร้างข้อความสุภาพและชัดเจนจากความแตกต่างของบันทึก", "Buat pesan yang sopan dan jelas berdasarkan perbedaan catatan.", "Create a polite, clear message from the record differences."],
  ["확인 문장 만들기", "Tạo câu xác nhận", "生成确认语句", "สร้างข้อความยืนยัน", "Buat pesan konfirmasi", "Create confirmation message"],
  ["내 근로 기록", "Hồ sơ làm việc của tôi", "我的工作记录", "บันทึกการทำงานของฉัน", "Catatan kerja saya", "My work records"],
  ["현재 기록 상태를 불러오지 못했지만 자료 추가는 계속할 수 있습니다.", "Không thể tải trạng thái hiện tại nhưng bạn vẫn có thể thêm tài liệu.", "无法加载当前记录状态，但仍可继续添加资料。", "ไม่สามารถโหลดสถานะปัจจุบันได้ แต่ยังเพิ่มเอกสารได้", "Status saat ini tidak dapat dimuat, tetapi Anda tetap dapat menambah dokumen.", "The current status could not be loaded, but you can still add records."],
  ["근로자료를 확인해 주세요", "Hãy kiểm tra tài liệu làm việc", "请查看工作资料", "ตรวจสอบเอกสารการทำงาน", "Periksa dokumen kerja", "Review work records"],
  ["자료 보러 가기", "Xem tài liệu", "查看资料", "ดูเอกสาร", "Lihat dokumen", "View records"],
  ["상태를 불러오지 못했어요", "Không thể tải trạng thái", "无法加载状态", "ไม่สามารถโหลดสถานะ", "Status tidak dapat dimuat", "Could not load status"],
  ["잠시 후 다시 방문하면 현재 진행 상태를 확인할 수 있습니다.", "Hãy quay lại sau để kiểm tra tiến độ hiện tại.", "请稍后回来查看当前进度。", "กลับมาอีกครั้งภายหลังเพื่อตรวจสอบความคืบหน้า", "Kembali lagi nanti untuk memeriksa progres saat ini.", "Come back shortly to check the current progress."],
  ["별도계산", "Tính riêng", "另行计算", "คำนวณแยก", "Dihitung terpisah", "Calculated separately"],
  ["자료 모으기", "Thu thập tài liệu", "收集资料", "รวบรวมเอกสาร", "Kumpulkan dokumen", "Collect records"],
  ["자료", "Tài liệu", "资料", "เอกสาร", "Dokumen", "Records"],
  ["조건 비교하기", "So sánh điều kiện", "比较条件", "เปรียบเทียบเงื่อนไข", "Bandingkan ketentuan", "Compare terms"],
  ["비교", "So sánh", "比较", "เปรียบเทียบ", "Bandingkan", "Compare"],
  ["대꾸 AI", "Daekku AI", "Daekku AI", "Daekku AI", "Daekku AI", "Daekku AI"],
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
  ["공동 경험", "Kinh nghiệm chung", "共同经历", "ประสบการณ์ร่วม", "Pengalaman bersama", "Shared experiences"],
  ["비슷한 경험과 다음 행동 보기", "Xem trải nghiệm tương tự và bước tiếp theo", "查看相似经历和下一步行动", "ดูประสบการณ์ที่คล้ายกันและขั้นตอนถัดไป", "Lihat pengalaman serupa dan langkah berikutnya", "View similar experiences and next steps"],
  ["명", "người", "人", "คน", "orang", "people"],
  ["번", "lần", "次", "ครั้ง", "kali", "times"],
  ["“내가 겪은 일이 누군가에게는", "“Để trải nghiệm của tôi có thể giúp ai đó", "“愿我的经历能让别人", "“เพื่อให้สิ่งที่ฉันเผชิญช่วยให้ใครบางคน", "“Semoga pengalaman saya membantu orang lain", "“May what I experienced give someone"],
  ["처음부터 알고 시작할 권리가 되도록.”", "có quyền được biết ngay từ đầu.”", "从一开始就拥有知情的权利。”", "มีสิทธิที่จะรู้ตั้งแต่เริ่มต้น”", "hak untuk mengetahui sejak awal.”", "the right to know from the start.”"],
  ["백엔드에 연결하지 못했어요. API 서버와 CORS 설정을 확인해 주세요.", "Không thể kết nối với máy chủ. Vui lòng kiểm tra máy chủ API và cài đặt CORS.", "无法连接后端，请检查API服务器和CORS设置。", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ โปรดตรวจสอบ API และการตั้งค่า CORS", "Tidak dapat terhubung ke server. Periksa server API dan pengaturan CORS.", "Could not connect to the server. Check the API server and CORS settings."],
  ["사업장 정보 형식이 올바르지 않아요.", "Định dạng thông tin nơi làm việc không hợp lệ.", "工作场所信息格式不正确。", "รูปแบบข้อมูลสถานที่ทำงานไม่ถูกต้อง", "Format informasi tempat kerja tidak valid.", "The workplace information format is invalid."],
  ["근무자료 목록을 불러오지 못했어요.", "Không thể tải danh sách tài liệu làm việc.", "无法加载工作资料列表。", "ไม่สามารถโหลดรายการเอกสารการทำงานได้", "Daftar dokumen kerja tidak dapat dimuat.", "Could not load the work-record list."],
  ["근무자료 상세 내용을 불러오지 못했어요.", "Không thể tải chi tiết tài liệu làm việc.", "无法加载工作资料详情。", "ไม่สามารถโหลดรายละเอียดเอกสารการทำงานได้", "Detail dokumen kerja tidak dapat dimuat.", "Could not load the work-record details."],
  ["비교할 근무자료를 불러오지 못했어요.", "Không thể tải tài liệu làm việc để so sánh.", "无法加载要比较的工作资料。", "ไม่สามารถโหลดเอกสารการทำงานเพื่อเปรียบเทียบได้", "Dokumen kerja untuk perbandingan tidak dapat dimuat.", "Could not load the work records to compare."],
  ["비교 결과를 저장하지 못했어요.", "Không thể lưu kết quả so sánh.", "无法保存比较结果。", "ไม่สามารถบันทึกผลการเปรียบเทียบได้", "Hasil perbandingan tidak dapat disimpan.", "Could not save the comparison results."],
  ["해당 비교 결과를 찾을 수 없어요.", "Không tìm thấy kết quả so sánh.", "找不到该比较结果。", "ไม่พบผลการเปรียบเทียบนี้", "Hasil perbandingan tidak ditemukan.", "The comparison result could not be found."],
  ["여러 사용자가 계약 시급과 급여명세서를 함께 제시하고 수습 적용 기간과 계산 근거를 확인했어요. 이 흐름이 위 추천 문장에 반영됐습니다.", "Nhiều người đã cùng đưa hợp đồng và phiếu lương để xác nhận thời gian thử việc và căn cứ tính lương. Cách làm này được phản ánh trong câu gợi ý ở trên.", "多名用户同时出示合同和工资单，确认了试用期和工资计算依据。上述建议句已参考这一做法。", "ผู้ใช้หลายคนแสดงสัญญาและสลิปเงินเดือนร่วมกันเพื่อตรวจสอบช่วงทดลองงานและหลักเกณฑ์การคำนวณ แนวทางนี้ถูกนำมาใช้ในข้อความแนะนำข้างต้น", "Beberapa pengguna menunjukkan kontrak dan slip gaji bersama-sama untuk memastikan masa percobaan dan dasar perhitungan. Alur ini diterapkan pada pesan saran di atas.", "Several users presented their contracts and payslips together to confirm the probation period and calculation basis. This approach is reflected in the suggested message above."],
  ["비슷한 익명 경험 보기", "Xem trải nghiệm ẩn danh tương tự", "查看相似的匿名经历", "ดูประสบการณ์แบบไม่ระบุตัวตนที่คล้ายกัน", "Lihat pengalaman anonim serupa", "View similar anonymous experiences"],
  ["백엔드에 연결하지 못했습니다.", "Không thể kết nối với máy chủ.", "无法连接后端。", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "Tidak dapat terhubung ke server.", "Could not connect to the server."],
  ["경험", "Kinh nghiệm", "经历", "ประสบการณ์", "Pengalaman", "Experiences"],
  ["말대꾸 지도 | 공동 경험", "Bản đồ tiếng nói | Kinh nghiệm chung", "发声地图 | 共同经历", "แผนที่เสียง | ประสบการณ์ร่วม", "Peta suara | Pengalaman bersama", "Voice map | Shared experiences"],
  ["익명 근로 경험을 연결해 다음 행동을 돕는 공동 경험 지도", "Bản đồ kết nối kinh nghiệm lao động ẩn danh để gợi ý bước tiếp theo", "连接匿名劳动经历、帮助确定下一步行动的共同经历地图", "แผนที่เชื่อมโยงประสบการณ์การทำงานแบบไม่ระบุตัวตนเพื่อช่วยเลือกขั้นตอนถัดไป", "Peta yang menghubungkan pengalaman kerja anonim untuk membantu langkah berikutnya", "A shared-experience map connecting anonymous work experiences to support the next step"],
  ["말대꾸 지도", "Bản đồ tiếng nói", "发声地图", "แผนที่เสียง", "Peta suara", "Voice map"],
  ["나와 비슷한 문제를 겪은 사람들이 어떤 답변을 받고, 무엇을 확인하고, 어떻게 마무리했는지 익명 경험의 연결로 확인해요.", "Khám phá qua các trải nghiệm ẩn danh xem những người gặp vấn đề tương tự đã nhận được câu trả lời gì, xác nhận điều gì và kết thúc ra sao.", "通过匿名经历的连接，查看遇到类似问题的人收到了什么答复、确认了什么以及如何处理。", "ดูผ่านประสบการณ์แบบไม่ระบุตัวตนว่าคนที่เจอปัญหาคล้ายกันได้รับคำตอบอะไร ตรวจสอบอะไร และจบอย่างไร", "Lihat melalui pengalaman anonim jawaban yang diterima orang dengan masalah serupa, apa yang mereka periksa, dan bagaimana hasilnya.", "Explore anonymous experiences to see what answers people with similar issues received, what they checked, and how things concluded."],
  ["가상 데이터 데모", "Bản demo dữ liệu giả lập", "虚拟数据演示", "เดโมข้อมูลจำลอง", "Demo data simulasi", "Simulated-data demo"],
  ["지금 대화와 비슷한 경험", "Trải nghiệm tương tự cuộc trò chuyện này", "与当前对话相似的经历", "ประสบการณ์ที่คล้ายกับบทสนทนานี้", "Pengalaman serupa dengan percakapan ini", "Experiences similar to this conversation"],
  ["시급 차이와 수습기간 답변을 겪은 경험이 여러 건 있어요", "Có nhiều trải nghiệm về chênh lệch lương giờ và câu trả lời liên quan đến thử việc", "有多起关于时薪差异和试用期答复的经历", "มีหลายกรณีเกี่ยวกับค่าจ้างรายชั่วโมงต่างกันและคำตอบเรื่องทดลองงาน", "Ada beberapa pengalaman tentang selisih upah per jam dan jawaban masa percobaan", "Several experiences involve hourly-wage differences and probation responses"],
  ["다른 사람들은 수습 적용 기간과 계산 근거를 함께 확인했어요.", "Những người khác đã cùng xác nhận thời gian thử việc và căn cứ tính lương.", "其他人同时确认了试用期适用期间和计算依据。", "คนอื่นตรวจสอบทั้งช่วงทดลองงานและหลักเกณฑ์การคำนวณ", "Orang lain memeriksa periode masa percobaan dan dasar perhitungannya.", "Others checked both the probation period and the calculation basis."],
  ["도움이 된 경로 보기", "Xem cách xử lý hữu ích", "查看有帮助的处理路径", "ดูแนวทางที่เป็นประโยชน์", "Lihat langkah yang membantu", "View helpful paths"],
  ["말대꾸가 모이면, 권리가 됩니다", "Khi tiếng nói được kết nối, chúng trở thành quyền", "当声音汇聚，就成为权利", "เมื่อเสียงรวมกัน ก็กลายเป็นสิทธิ", "Saat suara terkumpul, suara itu menjadi hak", "When voices connect, they become rights"],
  ["혼자였던 말들이", "Những lời từng đơn độc", "曾经孤单的话语", "คำพูดที่เคยโดดเดี่ยว", "Kata-kata yang pernah sendirian", "Words once spoken alone"],
  ["서로의", "trở thành", "成为彼此的", "กลายเป็น", "menjadi", "became shared"],
  ["근거", "căn cứ chung", "依据", "หลักฐานร่วม", "dasar bersama", "evidence"],
  ["가 되었습니다.", ".", "。", "ของกันและกัน", "bagi satu sama lain.", "for one another."],
  ["누군가 어렵게 남긴 기록이, 오늘 같은 문제 앞에 선 다른 사람의 다음 말을 만듭니다.", "Một ghi chép khó khăn của ai đó có thể giúp người khác biết nên nói gì tiếp theo hôm nay.", "某人艰难留下的记录，会帮助今天面对同样问题的人说出下一句话。", "บันทึกที่ใครบางคนทิ้งไว้อย่างยากลำบากช่วยให้คนที่เจอปัญหาเดียวกันรู้ว่าจะพูดอะไรต่อ", "Catatan yang dibuat seseorang dengan susah payah membantu orang lain menentukan ucapan berikutnya.", "A record someone struggled to leave can help another person know what to say next."],
  ["익명으로 남은 목소리", "Tiếng nói ẩn danh", "匿名留下的声音", "เสียงที่ไม่ระบุตัวตน", "Suara anonim", "Anonymous voices"],
  ["서로에게 닿은 도움", "Lượt hỗ trợ được kết nối", "彼此传递的帮助", "ความช่วยเหลือที่ส่งถึงกัน", "Bantuan yang tersampaikan", "Helpful connections"],
  ["최근 7일 동안", "Trong 7 ngày qua", "最近7天", "ในช่วง 7 วันที่ผ่านมา", "Dalam 7 hari terakhir", "In the last 7 days"],
  ["내가 겪은 일이 누군가에게는", "Điều tôi đã trải qua có thể giúp người khác", "我的经历也能让别人", "สิ่งที่ฉันเจออาจช่วยให้ใครบางคน", "Pengalaman saya dapat membantu orang lain", "What I experienced can help someone else"],
  ["처음부터 알고 시작할 권리가 되도록.", "có quyền được biết ngay từ đầu.", "从一开始就有知情的权利。", "มีสิทธิที่จะรู้ตั้งแต่ต้น", "memiliki hak untuk tahu sejak awal.", "have the right to know from the start."],
  ["이름도, 사업장도 보이지 않습니다. 도움만 남습니다.", "Không hiển thị tên hay nơi làm việc. Chỉ giữ lại điều hữu ích.", "不显示姓名或工作场所，只保留有帮助的信息。", "ไม่แสดงชื่อหรือสถานที่ทำงาน เหลือไว้เฉพาะข้อมูลที่ช่วยได้", "Nama dan tempat kerja tidak ditampilkan. Hanya informasi yang membantu yang tersisa.", "Names and workplaces are hidden. Only helpful information remains."],
  ["128개의 목소리", "128 tiếng nói", "128个声音", "128 เสียง", "128 suara", "128 voices"],
  ["하나의 권리 지식망", "Một mạng lưới kiến thức về quyền", "一个权益知识网络", "เครือข่ายความรู้ด้านสิทธิหนึ่งเดียว", "Satu jaringan pengetahuan hak", "One rights knowledge network"],
  ["밝은 점은 최근 더해진 경험입니다", "Các điểm sáng là trải nghiệm mới được thêm gần đây", "亮点表示最近新增的经历", "จุดสว่างคือประสบการณ์ที่เพิ่มเข้ามาล่าสุด", "Titik terang adalah pengalaman yang baru ditambahkan", "Bright points are recently added experiences"],
  ["공동 경험이 서로 도움으로 연결된 추상 그래프", "Biểu đồ trừu tượng kết nối các trải nghiệm chung", "共同经历相互连接的抽象图", "กราฟนามธรรมที่เชื่อมโยงประสบการณ์ร่วม", "Graf abstrak pengalaman bersama yang saling terhubung", "Abstract graph connecting shared experiences"],
  ["이 연결은 실제 사람을 식별하지 않습니다", "Kết nối này không xác định danh tính người thật", "这些连接不会识别真实人物", "การเชื่อมโยงนี้ไม่ระบุตัวบุคคลจริง", "Koneksi ini tidak mengidentifikasi orang nyata", "These connections do not identify real people"],
  ["말하고 난 뒤, 사람들이 남긴 이야기", "Những câu chuyện được để lại sau khi lên tiếng", "人们发声后留下的故事", "เรื่องราวที่ผู้คนทิ้งไว้หลังจากพูดออกมา", "Cerita yang ditinggalkan setelah berbicara", "Stories people left after speaking up"],
  ["누군가의 결과가 아니라, 다음 사람에게 건넨 짧은 메모입니다.", "Đây không phải kết luận về ai đó, mà là ghi chú ngắn gửi cho người tiếp theo.", "这不是对某人的结论，而是留给下一位的简短留言。", "นี่ไม่ใช่ข้อสรุปของใคร แต่เป็นบันทึกสั้น ๆ ส่งต่อให้คนถัดไป", "Ini bukan kesimpulan tentang seseorang, melainkan catatan singkat untuk orang berikutnya.", "These are not verdicts about anyone, but short notes for the next person."],
  ["모든 후기는 개인정보를 제거하고 사용자가 공유에 동의한 내용만 보여줍니다.", "Tất cả câu chuyện đã được loại bỏ thông tin cá nhân và chỉ hiển thị nội dung người dùng đồng ý chia sẻ.", "所有经历均已删除个人信息，仅显示用户同意分享的内容。", "ทุกเรื่องราวลบข้อมูลส่วนบุคคลแล้วและแสดงเฉพาะเนื้อหาที่ผู้ใช้ยินยอมแชร์", "Semua cerita telah menghapus data pribadi dan hanya menampilkan isi yang disetujui pengguna.", "All stories remove personal information and show only content users agreed to share."],
  ["가상 사용자 경험", "Trải nghiệm người dùng giả lập", "虚拟用户经历", "ประสบการณ์ผู้ใช้จำลอง", "Pengalaman pengguna simulasi", "Simulated user experiences"],
  ["도움이 된 기록 연결", "Kết nối hồ sơ hữu ích", "有帮助的记录连接", "การเชื่อมโยงบันทึกที่เป็นประโยชน์", "Koneksi catatan yang membantu", "Helpful record connections"],
  ["최근 추가한 경험", "Trải nghiệm mới thêm", "最近新增的经历", "ประสบการณ์ที่เพิ่มล่าสุด", "Pengalaman yang baru ditambahkan", "Recently added experiences"],
  ["15개의 가상 경험", "15 trải nghiệm giả lập", "15个虚拟经历", "15 ประสบการณ์จำลอง", "15 pengalaman simulasi", "15 simulated experiences"],
  ["아래 15건은 실제 개인정보를 사용하지 않은 완전한 가상 시연 경험입니다.", "15 trường hợp dưới đây là trải nghiệm minh họa hoàn toàn giả lập, không sử dụng dữ liệu cá nhân thật.", "以下15项是完全虚构的演示经历，不使用任何真实个人信息。", "15 กรณีด้านล่างเป็นประสบการณ์สาธิตที่สร้างขึ้นทั้งหมดและไม่ใช้ข้อมูลส่วนบุคคลจริง", "15 kasus di bawah ini adalah pengalaman demo yang sepenuhnya dibuat-buat tanpa menggunakan data pribadi nyata.", "The 15 cases below are fully simulated demo experiences and use no real personal information."],
  ["내 경험은 익명화된 내용만 로컬 기록에 저장됩니다. 저장해도 공동 경험에 자동 공개되지 않아요.", "Chỉ nội dung đã ẩn danh được lưu vào hồ sơ cục bộ của tôi và không tự động công khai.", "仅匿名化内容会保存到本地个人记录中，保存后不会自动公开。", "จะบันทึกเฉพาะเนื้อหาที่ไม่ระบุตัวตนไว้ในบันทึกภายในเครื่องและจะไม่เผยแพร่อัตโนมัติ", "Hanya isi anonim yang disimpan di catatan lokal saya dan tidak dipublikasikan otomatis.", "Only anonymized content is saved to your local records and it is never published automatically."],
  ["내 경험 초안", "Bản nháp trải nghiệm của tôi", "我的经历草稿", "ร่างประสบการณ์ของฉัน", "Draf pengalaman saya", "My experience draft"],
  ["문제 유형", "Loại vấn đề", "问题类型", "ประเภทปัญหา", "Jenis masalah", "Issue type"],
  ["현재 상태", "Trạng thái hiện tại", "当前状态", "สถานะปัจจุบัน", "Status saat ini", "Current status"],
  ["시급 차이", "Chênh lệch lương giờ", "时薪差异", "ส่วนต่างค่าจ้างรายชั่วโมง", "Selisih upah per jam", "Hourly-wage difference"],
  ["급여 지급 지연", "Chậm trả lương", "工资延迟支付", "การจ่ายค่าจ้างล่าช้า", "Keterlambatan pembayaran upah", "Delayed wage payment"],
  ["근무시간 변경", "Thay đổi giờ làm", "工作时间变更", "การเปลี่ยนเวลาทำงาน", "Perubahan jam kerja", "Working-hours change"],
  ["확인 중", "Đang xác nhận", "确认中", "กำลังตรวจสอบ", "Sedang dikonfirmasi", "In progress"],
  ["해결됨", "Đã giải quyết", "已解决", "แก้ไขแล้ว", "Selesai", "Resolved"],
  ["일부 해결", "Đã giải quyết một phần", "部分解决", "แก้ไขบางส่วน", "Sebagian selesai", "Partially resolved"],
  ["미해결", "Chưa giải quyết", "未解决", "ยังไม่แก้ไข", "Belum selesai", "Unresolved"],
  ["저장 전 익명화 결과", "Kết quả ẩn danh trước khi lưu", "保存前的匿名化结果", "ผลการไม่ระบุตัวตนก่อนบันทึก", "Hasil anonimisasi sebelum disimpan", "Anonymized result before saving"],
  ["아직 저장되거나 공개되지 않았어요.", "Nội dung chưa được lưu hoặc công khai.", "尚未保存或公开。", "ยังไม่ได้บันทึกหรือเผยแพร่", "Belum disimpan atau dipublikasikan.", "This has not been saved or published."],
  ["익명화된 내용을 내 로컬 경험 기록에 저장하는 데 동의합니다.", "Tôi đồng ý lưu nội dung đã ẩn danh vào hồ sơ trải nghiệm cục bộ.", "我同意将匿名化内容保存到本地经历记录。", "ฉันยินยอมให้บันทึกเนื้อหาที่ไม่ระบุตัวตนไว้ในบันทึกประสบการณ์ภายในเครื่อง", "Saya setuju menyimpan isi anonim ke catatan pengalaman lokal.", "I agree to save the anonymized content in my local experience records."],
  ["내 경험으로 저장하기", "Lưu vào trải nghiệm của tôi", "保存为我的经历", "บันทึกเป็นประสบการณ์ของฉัน", "Simpan sebagai pengalaman saya", "Save to my experiences"],
  ["저장된 내 경험", "Trải nghiệm tôi đã lưu", "我保存的经历", "ประสบการณ์ที่ฉันบันทึก", "Pengalaman saya yang tersimpan", "My saved experiences"],
  ["저장된 경험을 불러오는 중...", "Đang tải trải nghiệm đã lưu...", "正在加载已保存的经历……", "กำลังโหลดประสบการณ์ที่บันทึกไว้...", "Memuat pengalaman tersimpan...", "Loading saved experiences..."],
  ["아직 저장한 경험이 없어요.", "Chưa có trải nghiệm nào được lưu.", "还没有保存的经历。", "ยังไม่มีประสบการณ์ที่บันทึกไว้", "Belum ada pengalaman tersimpan.", "There are no saved experiences yet."],
  ["내 경험도 누군가의 다음 말이 될 수 있어요", "Trải nghiệm của tôi cũng có thể giúp người khác biết nên nói gì tiếp theo", "我的经历也能帮助别人说出下一句话", "ประสบการณ์ของฉันก็ช่วยให้คนอื่นรู้ว่าจะพูดอะไรต่อ", "Pengalaman saya juga dapat membantu ucapan orang berikutnya", "My experience can help someone else know what to say next"],
  ["사용 과정은 개인 기록으로만 정리됩니다. 공동 경험 공유는 사용자가 내용을 확인하고 명시적으로 동의한 경우에만 진행돼요.", "Quá trình sử dụng chỉ được lưu trong hồ sơ cá nhân. Chỉ chia sẻ trải nghiệm khi người dùng kiểm tra nội dung và đồng ý rõ ràng.", "使用过程仅保存在个人记录中。只有用户确认内容并明确同意后才会分享共同经历。", "กระบวนการใช้งานจะเก็บเป็นบันทึกส่วนตัวเท่านั้น จะแชร์ประสบการณ์เมื่อผู้ใช้ตรวจสอบและยินยอมอย่างชัดเจน", "Proses penggunaan hanya disimpan sebagai catatan pribadi. Pengalaman dibagikan hanya setelah pengguna memeriksa dan menyetujuinya secara jelas.", "Your activity remains in your private records. An experience is shared only after you review it and explicitly consent."],
  ["공유할 경험 초안", "Bản nháp trải nghiệm để chia sẻ", "待分享的经历草稿", "ร่างประสบการณ์ที่จะแชร์", "Draf pengalaman untuk dibagikan", "Experience draft to share"],
  ["익명화 결과 미리보기", "Xem trước kết quả ẩn danh", "预览匿名化结果", "ดูตัวอย่างผลการทำให้ไม่ระบุตัวตน", "Pratinjau hasil anonimisasi", "Preview anonymized result"],
  ["공개 전 변환 결과", "Kết quả chuyển đổi trước khi công khai", "公开前的转换结果", "ผลลัพธ์ก่อนเผยแพร่", "Hasil sebelum dipublikasikan", "Result before publishing"],
  ["아직 공개되지 않았어요. 사용자의 최종 동의가 필요합니다.", "Nội dung chưa được công khai. Cần sự đồng ý cuối cùng của người dùng.", "内容尚未公开，需要用户最终同意。", "ยังไม่ได้เผยแพร่ ต้องได้รับความยินยอมขั้นสุดท้ายจากผู้ใช้", "Belum dipublikasikan. Persetujuan akhir pengguna diperlukan.", "This has not been published. Final user consent is required."],
  ["해결 후 남긴 말", "Ghi chú sau khi giải quyết", "解决后留下的话", "ข้อความหลังแก้ไข", "Catatan setelah selesai", "Note after resolution"],
  ["대화 중 남긴 말", "Ghi chú trong khi trao đổi", "对话中留下的话", "ข้อความระหว่างสนทนา", "Catatan selama percakapan", "Note during conversation"],
  ["다음 사람에게", "Gửi người tiếp theo", "给下一位", "ถึงคนถัดไป", "Untuk orang berikutnya", "For the next person"],
  ["변화가 시작된 말", "Lời nói bắt đầu thay đổi", "带来改变的话", "คำพูดที่เริ่มความเปลี่ยนแปลง", "Ucapan yang memulai perubahan", "Words that started a change"],
  ["근로계약서", "Hợp đồng lao động", "劳动合同", "สัญญาจ้างงาน", "Kontrak kerja", "Employment contract"],
  ["급여명세서", "Phiếu lương", "工资明细单", "สลิปเงินเดือน", "Slip gaji", "Payslip"],
  ["고용주 대화", "Trao đổi với chủ lao động", "雇主对话", "บทสนทนากับนายจ้าง", "Percakapan pemberi kerja", "Employer conversation"],
  ["채용공고", "Tin tuyển dụng", "招聘信息", "ประกาศงาน", "Lowongan kerja", "Job posting"],
  ["입금 기록", "Lịch sử chuyển khoản", "入账记录", "บันทึกการโอนเงิน", "Catatan transfer", "Deposit record"],
  ["근무표", "Lịch làm việc", "排班表", "ตารางงาน", "Jadwal kerja", "Work schedule"],
  ["근무 기록", "Hồ sơ làm việc", "工作记录", "บันทึกการทำงาน", "Catatan kerja", "Work record"],
  ["음식점 근무 · 익명", "Nhà hàng · Ẩn danh", "餐饮工作 · 匿名", "งานร้านอาหาร · ไม่ระบุตัวตน", "Pekerjaan restoran · Anonim", "Restaurant work · Anonymous"],
  ["카페 근무 · 익명", "Quán cà phê · Ẩn danh", "咖啡店工作 · 匿名", "งานคาเฟ่ · ไม่ระบุตัวตน", "Pekerjaan kafe · Anonim", "Cafe work · Anonymous"],
  ["편의점 근무 · 익명", "Cửa hàng tiện lợi · Ẩn danh", "便利店工作 · 匿名", "งานร้านสะดวกซื้อ · ไม่ระบุตัวตน", "Pekerjaan minimarket · Anonim", "Convenience-store work · Anonymous"],
  ["물류 근무 · 익명", "Kho vận · Ẩn danh", "物流工作 · 匿名", "งานโลจิสติกส์ · ไม่ระบุตัวตน", "Pekerjaan logistik · Anonim", "Logistics work · Anonymous"],
  ["처음으로 계산 근거를 물어봤어요", "Lần đầu tôi hỏi căn cứ tính lương", "我第一次询问计算依据", "ฉันถามหลักเกณฑ์การคำนวณเป็นครั้งแรก", "Untuk pertama kalinya saya menanyakan dasar perhitungan", "I asked for the calculation basis for the first time"],
  ["수습기간이라는 답을 받았어요", "Tôi nhận được câu trả lời rằng đó là thời gian thử việc", "我得到的答复是因为试用期", "ฉันได้รับคำตอบว่าเป็นช่วงทดลองงาน", "Saya mendapat jawaban bahwa itu karena masa percobaan", "I was told it was because of probation"],
  ["저는 처음 약속을 남기지 못했어요", "Tôi đã không lưu lại lời hứa ban đầu", "我没有保存最初的约定", "ฉันไม่ได้เก็บข้อตกลงแรกไว้", "Saya tidak menyimpan janji awal", "I did not keep the original promise"],
  ["다음 달 말고 날짜를 물었어요", "Tôi hỏi ngày cụ thể thay vì 'tháng sau'", "我问了具体日期，而不是“下个月”", "ฉันถามวันที่แทนคำว่าเดือนหน้า", "Saya menanyakan tanggal, bukan hanya 'bulan depan'", "I asked for a date, not just 'next month'"],
  ["근무시간 변경을 글로 확인했어요", "Tôi xác nhận thay đổi giờ làm bằng văn bản", "我用书面方式确认了工时变更", "ฉันยืนยันการเปลี่ยนเวลาทำงานเป็นลายลักษณ์อักษร", "Saya mengonfirmasi perubahan jam kerja secara tertulis", "I confirmed the schedule change in writing"],
  ["답변도 기록이라는 걸 늦게 알았어요", "Tôi nhận ra quá muộn rằng câu trả lời cũng là một hồ sơ", "我很晚才意识到答复也是记录", "ฉันรู้ช้าไปว่าคำตอบก็เป็นบันทึก", "Saya terlambat menyadari bahwa jawaban juga merupakan catatan", "I learned too late that replies are records too"],
  ["계약서와 급여명세서를 같이 보내니까 막연히 따지는 기분이 아니었어요. 계산표를 받은 뒤 차액도 확인했습니다.", "Khi gửi kèm hợp đồng và phiếu lương, tôi không còn cảm thấy mình đang chất vấn vô căn cứ. Sau khi nhận bảng tính, tôi đã kiểm tra cả khoản chênh lệch.", "把合同和工资单一起发过去后，我不再觉得自己是在无凭无据地质问。收到计算表后，我也确认了差额。", "เมื่อส่งสัญญาและสลิปเงินเดือนไปพร้อมกัน ฉันไม่รู้สึกว่ากำลังทักท้วงโดยไม่มีหลักฐาน หลังจากได้รับตารางคำนวณ ฉันก็ตรวจสอบส่วนต่างแล้ว", "Setelah mengirim kontrak dan slip gaji bersama-sama, saya tidak merasa sedang memprotes tanpa dasar. Setelah menerima tabel perhitungan, saya juga memeriksa selisihnya.", "Sending the contract and payslip together made the question feel evidence-based. After receiving the calculation sheet, I also checked the difference."],
  ["“기록을 보여주면서 물으니 덜 무서웠어요.”", "“Khi vừa cho xem hồ sơ vừa hỏi, tôi thấy bớt sợ hơn.”", "“拿出记录再询问时，我没那么害怕了。”", "“พอถามพร้อมแสดงบันทึก ฉันก็กลัวน้อยลง”", "“Saya tidak terlalu takut ketika bertanya sambil menunjukkan catatan.”", "“I felt less afraid when I asked while showing the records.”"],
  ["예전 같으면 그냥 알겠다고 했을 텐데, 시작일과 끝나는 날을 다시 물었습니다. 아직 답변을 기다리고 있어요.", "Trước đây có lẽ tôi chỉ nói là đã hiểu, nhưng lần này tôi hỏi lại ngày bắt đầu và ngày kết thúc. Tôi vẫn đang chờ câu trả lời.", "以前我可能只会说知道了，但这次我再次询问了开始和结束日期。目前还在等待回复。", "ถ้าเป็นเมื่อก่อนฉันคงตอบแค่ว่าเข้าใจแล้ว แต่ครั้งนี้ฉันถามวันเริ่มและวันสิ้นสุดอีกครั้ง ตอนนี้ยังรอคำตอบอยู่", "Dulu mungkin saya hanya akan bilang mengerti, tetapi kali ini saya menanyakan kembali tanggal mulai dan selesai. Saya masih menunggu jawaban.", "Before, I might have simply said I understood, but this time I asked again for the start and end dates. I am still waiting for a reply."],
  ["“이번에는 질문을 끝까지 남겨두려고 해요.”", "“Lần này tôi muốn giữ lại câu hỏi cho đến khi có câu trả lời.”", "“这次我想把问题一直保留下来，直到得到回答。”", "“ครั้งนี้ฉันจะเก็บคำถามไว้จนกว่าจะได้คำตอบ”", "“Kali ini saya akan menyimpan pertanyaannya sampai mendapat jawaban.”", "“This time I will keep the question on record until it is answered.”"],
  ["급여명세서는 있었지만 계약서와 채용공고를 보관하지 않아서 비교할 근거가 부족했습니다.", "Tôi có phiếu lương nhưng không giữ hợp đồng và tin tuyển dụng, nên thiếu căn cứ để so sánh.", "我有工资单，但没有保存合同和招聘信息，因此缺少可供比较的依据。", "ฉันมีสลิปเงินเดือน แต่ไม่ได้เก็บสัญญาและประกาศรับสมัครงาน จึงมีหลักฐานไม่พอสำหรับเปรียบเทียบ", "Saya memiliki slip gaji, tetapi tidak menyimpan kontrak dan lowongan kerja sehingga dasar perbandingannya kurang.", "I had payslips, but I had not saved the contract or job posting, so there was not enough evidence to compare."],
  ["“일을 시작하기 전에 공고부터 꼭 저장하세요.”", "“Hãy nhớ lưu tin tuyển dụng trước khi bắt đầu làm việc.”", "“开始工作前，一定要先保存招聘信息。”", "“ก่อนเริ่มงาน อย่าลืมเก็บประกาศรับสมัครงานไว้”", "“Simpan lowongan kerja sebelum mulai bekerja.”", "“Save the job posting before you start work.”"],
  ["계속 다음 달에 준다는 답만 들었습니다. 입금 기록과 함께 정확한 지급일을 물은 뒤 밀린 금액을 받았어요.", "Tôi liên tục chỉ nhận được câu trả lời rằng sẽ trả vào tháng sau. Sau khi gửi lịch sử chuyển khoản và hỏi ngày trả chính xác, tôi đã nhận được số tiền còn thiếu.", "我一直只得到“下个月支付”的答复。附上入账记录并询问确切支付日期后，我收到了拖欠款项。", "ฉันได้ยินแต่คำตอบว่าจะจ่ายเดือนหน้า หลังจากแนบบันทึกการโอนและถามวันที่จ่ายที่แน่นอน ฉันก็ได้รับเงินที่ค้างอยู่", "Saya terus hanya mendapat jawaban bahwa pembayaran akan dilakukan bulan depan. Setelah menyertakan catatan transfer dan menanyakan tanggal pembayaran yang pasti, saya menerima jumlah yang tertunggak.", "I kept hearing only that it would be paid next month. After sharing the deposit records and asking for an exact payment date, I received the overdue amount."],
  ["“날짜 하나를 묻는 게 이렇게 중요할 줄 몰랐어요.”", "“Tôi không biết việc hỏi một ngày cụ thể lại quan trọng đến vậy.”", "“我没想到询问一个具体日期会这么重要。”", "“ฉันไม่รู้เลยว่าการถามวันที่ให้ชัดเจนจะสำคัญขนาดนี้”", "“Saya tidak menyangka menanyakan satu tanggal bisa sepenting ini.”", "“I did not realize asking for one exact date could matter this much.”"],
  ["말로만 바뀌던 시간을 계약서와 근무표로 비교했습니다. 다음 주부터 원래 시간대로 조정됐어요.", "Tôi so sánh giờ làm bị thay đổi bằng lời nói với hợp đồng và lịch làm việc. Từ tuần sau, lịch đã được điều chỉnh về giờ ban đầu.", "我用合同和排班表核对了口头更改的工作时间。从下周起，时间已调整回原来的安排。", "ฉันเปรียบเทียบเวลาที่เปลี่ยนกันด้วยคำพูดกับสัญญาและตารางงาน ตั้งแต่สัปดาห์หน้า เวลาถูกปรับกลับเป็นเวลาเดิม", "Saya membandingkan jam yang hanya diubah secara lisan dengan kontrak dan jadwal kerja. Mulai minggu depan, jadwalnya disesuaikan kembali ke waktu semula.", "I compared the verbally changed hours with the contract and work schedule. Starting next week, the schedule was adjusted back to the original hours."],
  ["“제가 기억을 잘못한 게 아니라는 걸 알았어요.”", "“Tôi biết rằng mình đã không nhớ sai.”", "“我确认了并不是自己记错了。”", "“ฉันได้รู้ว่าตัวเองไม่ได้จำผิด”", "“Saya tahu bahwa ingatan saya tidak salah.”", "“I learned that I had not remembered it incorrectly.”"],
  ["근무시간은 매일 적었지만 대화를 남기지 않아 왜 바뀌었는지 확인하는 과정이 끊겼습니다.", "Tôi ghi giờ làm mỗi ngày nhưng không lưu cuộc trò chuyện, nên quá trình xác nhận lý do thay đổi đã bị gián đoạn.", "我每天都记录工作时间，但没有保存对话，因此无法继续确认变更原因。", "ฉันจดเวลาทำงานทุกวัน แต่ไม่ได้เก็บบทสนทนาไว้ จึงไม่สามารถติดตามยืนยันสาเหตุที่เปลี่ยนได้", "Saya mencatat jam kerja setiap hari, tetapi tidak menyimpan percakapan sehingga proses memastikan alasan perubahan terputus.", "I recorded my hours every day, but because I did not save the conversation, I could not complete the process of confirming why they changed."],
  ["“말로 들은 내용도 메시지로 다시 확인하세요.”", "“Hãy xác nhận lại bằng tin nhắn cả những điều bạn chỉ nghe bằng lời nói.”", "“口头听到的内容也要通过消息再次确认。”", "“สิ่งที่ได้ยินด้วยวาจาก็ควรยืนยันอีกครั้งทางข้อความ”", "“Konfirmasikan kembali lewat pesan juga untuk hal yang disampaikan secara lisan.”", "“Confirm anything said verbally again in a message.”"],
];

const HOME_CONDITIONS = [
  ["시급", "lương theo giờ", "时薪", "ค่าจ้างรายชั่วโมง", "upah per jam", "hourly wage"],
  ["주휴수당", "phụ cấp nghỉ hằng tuần", "周休津贴", "ค่าจ้างวันหยุดประจำสัปดาห์", "tunjangan hari libur mingguan", "weekly holiday pay"],
  ["근무시간", "giờ làm việc", "工作时间", "เวลาทำงาน", "jam kerja", "working hours"],
  ["주 근무시간", "giờ làm việc hằng tuần", "每周工时", "ชั่วโมงทำงานต่อสัปดาห์", "jam kerja mingguan", "weekly working hours"],
  ["급여일", "ngày trả lương", "发薪日", "วันจ่ายเงินเดือน", "tanggal gajian", "payday"],
  ["총급여", "tổng lương", "总工资", "ค่าจ้างรวม", "gaji kotor", "gross pay"],
  ["실수령액", "lương thực nhận", "实发工资", "ค่าจ้างสุทธิ", "gaji bersih", "net pay"],
];
HOME_CONDITIONS.forEach((condition) => {
  const [ko, vi, zh, th, id, en] = condition;
  ROWS.push(
    [`${ko} 기록을 확인하고 있어요`, `Đang kiểm tra hồ sơ ${vi}`, `正在查看${zh}记录`, `กำลังตรวจสอบบันทึก${th}`, `Sedang memeriksa catatan ${id}`, `Reviewing ${en} records`],
    [`${ko} 기록 차이`, `Khác biệt trong hồ sơ ${vi}`, `${zh}记录差异`, `ความแตกต่างของบันทึก${th}`, `Perbedaan catatan ${id}`, `${en} record difference`],
  );
});

const TABLE = new Map(ROWS.map((row) => [row[0], row]));
const originals = new WeakMap();
const attributeOriginals = new WeakMap();
const PATTERNS = [
  {
    source: /^(\d+)개의 자료가 저장되어 있습니다\.$/,
    values: ["$1개의 자료가 저장되어 있습니다.", "Đã lưu $1 tài liệu.", "已保存 $1 份资料。", "บันทึกเอกสารแล้ว $1 รายการ", "$1 dokumen telah disimpan.", "$1 records saved."],
  },
  {
    source: /^(\d+)개의 기록에서 근로조건을 추출했습니다\.$/,
    values: ["$1개의 기록에서 근로조건을 추출했습니다.", "Đã trích xuất điều kiện làm việc từ $1 hồ sơ.", "已从 $1 份记录中提取工作条件。", "แยกเงื่อนไขการทำงานจาก $1 บันทึกแล้ว", "Ketentuan kerja diekstrak dari $1 catatan.", "Work terms extracted from $1 records."],
  },
  {
    source: /^(\d+) \/ 4단계 · 단계를 누르면 이동$/,
    values: ["$1 / 4단계 · 단계를 누르면 이동", "$1 / 4 bước · Nhấn một bước để di chuyển", "$1 / 4 步 · 点击步骤前往", "$1 / 4 ขั้นตอน · กดขั้นตอนเพื่อไปต่อ", "$1 / 4 langkah · Tekan langkah untuk membuka", "$1 / 4 steps · Select a step to open"],
  },
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

HOME_CONDITIONS.forEach((condition) => {
  const [ko, vi, zh, th, id, en] = condition;
  PATTERNS.unshift({
    source: new RegExp(`^(\\d+)개의 자료에서 서로 다른 조건 ${ko}을 발견했습니다\\.$`),
    values: [
      `$1개의 자료에서 서로 다른 조건 ${ko}을 발견했습니다.`,
      `Đã tìm thấy điểm khác biệt về ${vi} trong $1 tài liệu.`,
      `在 $1 份资料中发现了${zh}差异。`,
      `พบความแตกต่างเรื่อง${th}ในเอกสาร $1 รายการ`,
      `Ditemukan perbedaan ${id} dalam $1 dokumen.`,
      `Found differing ${en} terms across $1 records.`,
    ],
  });
  PATTERNS.unshift(
    {
      source: new RegExp(`^${ko} 조건이 기록 사이에서 다릅니다\\. 적용 기준을 확인해 보세요\\.$`),
      values: [
        `${ko} 조건이 기록 사이에서 다릅니다. 적용 기준을 확인해 보세요.`,
        `Điều kiện ${vi} khác nhau giữa các hồ sơ. Hãy kiểm tra tiêu chuẩn áp dụng.`,
        `记录中的${zh}条件不同，请确认适用标准。`,
        `เงื่อนไข${th}ในบันทึกต่างกัน โปรดตรวจสอบเกณฑ์ที่ใช้`,
        `Ketentuan ${id} berbeda antarcatatan. Periksa standar yang berlaku.`,
        `The ${en} terms differ across records. Check which standard applies.`,
      ],
    },
    {
      source: new RegExp(`^${ko} 조건이 기록 사이에서 같습니다\\.$`),
      values: [
        `${ko} 조건이 기록 사이에서 같습니다.`,
        `Điều kiện ${vi} giống nhau giữa các hồ sơ.`,
        `记录中的${zh}条件一致。`,
        `เงื่อนไข${th}ในบันทึกตรงกัน`,
        `Ketentuan ${id} sama antarcatatan.`,
        `The ${en} terms match across records.`,
      ],
    },
  );
});

function language() {
  const value = document.querySelector("#site-language")?.value
    || sessionStorage.getItem("site_display_language_v2") || "ko";
  return Object.hasOwn(INDEX, value) ? value : "ko";
}

function translateNode(node, index) {
  if (node.parentElement?.closest("[translate='no'], .notranslate")) return;
  const currentKey = node.nodeValue.trim();
  const currentIsKoreanSource = TABLE.has(currentKey)
    || PATTERNS.some(({ source }) => source.test(currentKey));
  if (!originals.has(node) || currentIsKoreanSource) originals.set(node, node.nodeValue);
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
