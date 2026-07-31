# 변경 요청

- 상태: 요청
- 요청 역할: `ROLE-FE-RECORDS`
- 변경할 공통 파일 및 외부 설정:
  - `backend/app/main.py`
  - `frontend/shared/api.js`
  - `frontend/shared/app.js`
  - `README.md`
  - 백엔드 로컬 `backend/.env`와 Supabase 프로젝트 설정
- 필요한 이유: 기록·비교 프론트의 실제 API 모드는 준비됐지만, 별도 정적 서버에서 FastAPI로 요청할 때 CORS와 실행 포트가 정리되지 않았고 로컬 Supabase 환경도 설정되지 않아 end-to-end 테스트가 불가능함
- 원하는 변경:
  1. 프론트 개발 서버 포트를 `5500` 등으로 하나 정하고 README 실행 방법에 명시
  2. FastAPI에 환경변수 기반 CORS 허용 목록 추가
     - `http://127.0.0.1:5500`
     - `http://localhost:5500`
     - 팀이 정한 배포 프론트 origin
  3. 배포 환경에서 프론트와 API가 같은 origin인지, 서로 다른 origin인지 결정
  4. `frontend/shared/api.js`가 환경별 API base URL과 `error.code`, `error.message`를 공통 처리하도록 정리
  5. `frontend/shared/app.js`에서 사이드바 이동 시 `workplace_id`와 `mode=api` 컨텍스트를 유지해 대화·기록함 화면에도 같은 사업장이 전달되게 처리
  6. 각 백엔드 담당자의 로컬 `backend/.env`에 다음 값을 설정하되 Git에는 커밋하지 않음
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `UPSTAGE_API_KEY`
     - 필요한 경우 `LAW_API_OC`
  7. Supabase private bucket과 `records`, `extracted_conditions`, `comparisons`, `legal_references` 테이블이 준비됐는지 확인
  8. 개인정보가 없는 `demo-e2e` 사업장 자료로 목록·업로드·비교 흐름을 검증
  9. Python 가상환경과 프로젝트 의존성 설치 방법을 README에 추가하고 전체 백엔드 테스트 실행
- 프론트에서 이미 반영한 내용:
  - 로컬 API 모드는 현재 호스트의 `8000` 포트 FastAPI를 호출
  - 기본 데모 사업장 ID를 `demo-e2e`로 사용
  - URL과 `sessionStorage`로 `workplace_id` 유지
  - 업로드 후 `uploaded → processing → completed/failed` 상태 polling
  - 백엔드 오류 코드별 사용자 안내
  - 목록 자료와 상세 응답을 병합해 날짜 및 추출 조건 표시
- 연결되는 API 또는 화면:
  - `GET /api/v1/records?workplace_id={workplace_id}`
  - `POST /api/v1/records/upload`
  - `GET /api/v1/records/{record_id}`
  - `DELETE /api/v1/records/{record_id}`
  - `POST /api/v1/workplaces/{workplace_id}/compare`
  - `frontend/features/home/home.html`
  - `frontend/features/records/records.html`
  - `frontend/features/comparison/comparison.html`
- 확인 방법:
  1. 백엔드를 `127.0.0.1:8000`, 프론트를 합의된 정적 서버 포트로 실행
  2. `records.html?mode=api&workplace_id=demo-e2e`에서 저장된 자료 목록 확인
  3. 개인정보가 없는 PDF 또는 이미지 업로드
  4. 화면에서 `uploaded → processing → completed/failed` 상태 변화 확인
  5. 상세 화면에서 날짜와 추출 조건 확인
  6. 비교 화면으로 이동한 뒤 URL의 `workplace_id=demo-e2e&mode=api` 유지 확인
  7. 비교 API 결과의 네 상태와 오류 응답 확인
  8. 브라우저 콘솔에 CORS 오류와 API 키 노출이 없는지 확인
