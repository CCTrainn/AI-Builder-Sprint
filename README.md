<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./frontend/shared/logo-white.png">
    <img src="./frontend/shared/logo-black.png" alt="근로권리 동반자" width="320">
  </picture>
</p>

<p align="center">
  외국인 유학생과 이주노동자가 흩어진 근로자료를 모으고,<br>
  기록의 차이를 발견해 실제 확인 대화와 다음 행동까지 이어가도록 돕는 서비스
</p>

# 근로권리 동반자

근로권리 동반자는 채용공고, 근로계약서, 근무기록, 급여명세서, 입금내역과
고용주 대화를 한곳에 모아 기록 사이에서 달라진 근로조건을 찾는 웹 서비스입니다.

AI는 위법 여부를 확정하거나 고용주를 자동 신고하지 않습니다. 대신
`기록이 다름`, `확인 필요`, `답변되지 않음`을 구분하고, 사용자가 자신의
기록을 근거로 고용주에게 물어볼 문장과 후속 행동을 준비하도록 돕습니다.

## 주요 기능

- **자료 모으기**: PDF·JPG·PNG 업로드, Upstage Document Parse OCR, 문서 유형별 근로조건 추출
- **기록 비교하기**: 계약·약속·실제 기록을 시점별로 비교하고 달라진 시급, 근무시간, 급여일, 주휴수당 등을 표시
- **공식 기준 확인**: 법제처 국가법령정보 공동활용 API에서 관련 조문 조회
- **대꾸 AI**: 기록을 근거로 확인 문장을 생성하고, 고용주 답변의 회피·거부·약속·협박성 표현을 분석
- **다국어 지원**: 한국어, 베트남어, 중국어, 태국어, 인도네시아어, 영어 화면 및 대화 번역
- **근로 기록함**: 실제로 주고받은 문장, 답변 분석, 미답변 항목과 후속 조치를 보관
- **공동 경험**: 해결 과정을 자동으로 익명화해 사용자가 확인·확정한 한 건의 경험만 공유
- **화면 설정**: 반응형 레이아웃과 라이트·다크 모드

## 서비스 흐름

```text
근로자료 업로드
→ OCR 및 조건 추출
→ 계약·약속·실제 기록 비교
→ 관련 공식 법령 조회
→ 대꾸 AI 확인 문장 생성
→ 고용주 답변 분석
→ 지급·수정 약속과 실제 반영 확인
→ 근로 기록함 보관
→ 익명 공동 경험 확정 및 공유
```

## 기술 구성

| 구분 | 구성 |
| --- | --- |
| 프론트엔드 | HTML, CSS, Vanilla JavaScript |
| 백엔드 | Python 3.11+, FastAPI, Uvicorn |
| 데이터베이스 | SQLite (`backend/local_data/work-rights.db`) |
| 원본 파일 | 백엔드 전용 로컬 저장소 (`backend/local_data/uploads/`) |
| OCR | Upstage Document Parse |
| LLM | Upstage Solar Pro 3 (`solar-pro3`) |
| 공식 법령 | 법제처 국가법령정보 공동활용 Open API |
| 테스트 | pytest |

FastAPI가 `/api/v1` API와 `frontend/` 정적 파일을 같은 출처에서 함께 제공합니다.
별도의 Node.js 빌드 과정은 없습니다.

## 로컬 기동 실행 가이드

### 1. 저장소 받기

```bash
git clone https://github.com/CCTrainn/AI-Builder-Sprint.git
cd AI-Builder-Sprint
```

### 2. Python 가상환경 및 의존성 설치

Python 3.11 이상이 필요합니다.

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
```

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

### 3. 환경변수 설정

`backend/.env.example`을 복사해 `backend/.env`를 만듭니다.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

그다음 `.env`에 필요한 API 키를 입력합니다. `.env`는 절대 Git에 커밋하지 마세요.

### 4. 서버 실행

`backend` 디렉터리에서 실행합니다.

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

브라우저에서 다음 주소로 접속합니다.

```text
홈: http://127.0.0.1:8000/features/home/home.html
상태 확인: http://127.0.0.1:8000/api/v1/health
API 문서: http://127.0.0.1:8000/docs
```

첫 실행 시 다음 경로가 자동 생성됩니다.

```text
backend/local_data/work-rights.db
backend/local_data/uploads/
```

### 5. 테스트 실행

```bash
cd backend
python -m pytest -q
```

## 환경변수 정보

환경변수는 `backend/.env`에서 관리합니다.

| 변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `APP_NAME` | 선택 | `Work Rights Companion API` | FastAPI 애플리케이션 이름 |
| `APP_ENV` | 선택 | `local` | 실행 환경 표시값 |
| `UPSTAGE_API_KEY` | 실사용 필수 | 없음 | Document Parse OCR 호출에 사용하며, 별도 LLM 키가 없으면 Solar 호출에도 사용 |
| `LLM_API_KEY` | 선택 | 없음 | Solar LLM 전용 키. 비어 있으면 `UPSTAGE_API_KEY`를 사용 |
| `LAW_API_OC` | 선택 | 없음 | 법제처 공동활용 API의 OC 값. 없으면 내장 조문 제목과 공식 링크로 대체 |
| `MAX_UPLOAD_BYTES` | 선택 | `10485760` | 업로드 파일 최대 크기. 기본 10MB |
| `LOCAL_DATA_DIR` | 선택 | `local_data` | SQLite DB와 업로드 폴더의 상위 경로 |
| `LOCAL_DB_NAME` | 선택 | `work-rights.db` | SQLite 파일명 |
| `LOCAL_UPLOAD_DIR_NAME` | 선택 | `uploads` | 원본 파일 저장 폴더명 |

예시:

```dotenv
APP_NAME=Work Rights Companion API
APP_ENV=local
UPSTAGE_API_KEY=your_upstage_api_key
LLM_API_KEY=
LAW_API_OC=your_law_api_oc
MAX_UPLOAD_BYTES=10485760
LOCAL_DATA_DIR=local_data
LOCAL_DB_NAME=work-rights.db
LOCAL_UPLOAD_DIR_NAME=uploads
```

키가 없을 때의 동작:

- `UPSTAGE_API_KEY`가 없으면 새 PDF·이미지의 OCR 처리를 완료할 수 없습니다.
- `LLM_API_KEY`와 `UPSTAGE_API_KEY`가 모두 없으면 대꾸 AI 생성·답변 분석·번역을 사용할 수 없습니다.
- `LAW_API_OC`가 없거나 법령 API 호출에 실패하면 관련 법령 제목과 국가법령정보센터 링크를 제공합니다.

## 실행 및 배포 환경

### 현재 실행 구조

- 단일 FastAPI 프로세스가 API와 프론트 정적 파일을 함께 제공합니다.
- 데이터와 업로드 파일은 서버 로컬 디스크에 저장됩니다.
- 현재 저장소에는 Docker, Vercel, Render 등 특정 플랫폼 전용 배포 설정이 포함되어 있지 않습니다.
- 로컬 MVP는 외부 PostgreSQL이나 Supabase 없이 실행됩니다.

### 배포 명령 예시

배포 서비스의 작업 디렉터리를 `backend`로 설정한 뒤 다음 명령으로 실행할 수 있습니다.

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

배포 환경에는 위 환경변수를 비밀 값으로 등록하고 `.env` 파일을 업로드하지 마세요.

### 배포 시 주의사항

- `backend/local_data`를 **영속 디스크**에 연결해야 재배포·재시작 후에도 DB와 업로드 파일이 유지됩니다.
- 영속 디스크가 없는 서버리스·임시 파일 시스템에서는 저장한 기록과 대화가 사라질 수 있습니다.
- 현재 SQLite 구성은 단일 인스턴스 데모에 적합합니다. 여러 서버 인스턴스를 동시에 운영하려면 공유 PostgreSQL과 private object storage로 이전해야 합니다.
- 원본 근로자료에는 개인정보가 포함될 수 있으므로 업로드 폴더를 정적 파일 경로로 공개하지 마세요.
- HTTPS, 접근 제어, 백업, 보존 기간과 삭제 정책을 운영 환경에 맞게 별도로 설정해야 합니다.

## 빈 사이트에서 데모 데이터 적재하기

배포 직후에는 사용자 근로자료가 없는 빈 화면이 정상입니다. 저장소의 `output/pdf/`에
실제 개인정보를 사용하지 않은 시연용 PDF가 포함되어 있으므로, 아래 파일을 화면에서
직접 업로드해 전체 흐름을 시연할 수 있습니다.

| 순서 | 파일 | 자료 종류 | 권장 날짜 | 확인 가능한 내용 |
| --- | --- | --- | --- | --- |
| 1 | `output/pdf/대모근로계약서.pdf` | 근로계약서 | `2026-07-01` | 계약 시급 12,000원, 근무시간, 휴게시간 |
| 2 | `output/pdf/대모임금명세서.pdf` | 급여명세서 | `2026-07-31` | 적용 시급 10,500원, 82시간, 지급액 861,000원 |
| 3 | `output/pdf/01_알바_채용공고_가온식당.pdf` | 채용공고 | `2026-06-20` | 채용 당시 제시 조건 |
| 4 | `output/pdf/02_근무표_출퇴근기록_가온식당.pdf` | 출퇴근 기록 | `2026-07-31` | 실제 근무시간 비교 |
| 5 | `output/pdf/03_은행거래내역_급여입금.pdf` | 입금내역 | `2026-08-10` | 명세 금액과 실제 입금 기록 비교 |

가장 짧은 데모는 근로계약서와 급여명세서 두 개만 업로드하면 됩니다.

```text
계약서 시급 12,000원
→ 급여명세서 적용 시급 10,500원
→ 기록이 다름
→ 대꾸 AI로 적용 기준과 처리 계획 확인
→ 고용주 답변과 해결 결과 저장
→ 익명 공동 경험 확정 및 공유
```

파일은 `PDF`, `JPG`, `JPEG`, `PNG` 형식을 지원하며 기본 최대 크기는 10MB입니다.
데모 시나리오 설명은 `output/대모시나리오1.txt`에서 확인할 수 있습니다.

배포된 사이트에는 저장소 파일 선택기가 자동으로 나타나지 않습니다. 저장소에서 데모 PDF를
미리 내려받은 뒤, 사이트의 **자료 모으기 → 근무자료 추가**에서 직접 선택해 업로드하세요.

기존 데이터와 섞이지 않는 촬영을 원하면 첫 접속 URL에 새로운 사업장 ID를 지정할 수 있습니다.

```text
http://127.0.0.1:8000/features/records/records.html?workplace_id=demo-video-final
```

## 프로젝트 구조

```text
backend/        FastAPI API, 서비스, SQLite 저장 계층, 테스트
frontend/       HTML, CSS, JavaScript 화면
demo-scenarios/ 추가 데모 문서와 시나리오
docs/           API 계약, 데이터 구조, 팀 개발 문서
output/         시연용 PDF와 대모 시나리오
scripts/        데모 자료 생성 보조 스크립트
```

## 개인정보와 서비스 범위

- 원본 파일과 대화는 공동 경험에 자동 공개되지 않습니다.
- 공동 경험은 사용자가 내용을 확인하고 명시적으로 확정·공유한 경우에만 게시됩니다.
- 이름, 전화번호, 날짜, 금액과 사업장을 식별할 수 있는 표현은 공유 전에 익명화 검사를 거칩니다.
- 본 서비스는 기록 정리와 확인 대화를 돕는 도구이며 법률 자문이나 위법 여부 확정 서비스가 아닙니다.

## API 응답 형식

기본 API 응답은 다음 구조를 사용합니다.

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

세부 요청·응답 예시는 [`docs/api-contract.md`](./docs/api-contract.md)를 참고하세요.

## 팀 개발

협업 규칙과 역할별 파일 소유권은 [`AGENTS.md`](./AGENTS.md), 작업 흐름은
[`docs/team-plan.md`](./docs/team-plan.md)에서 확인할 수 있습니다.

기능 개발은 `feature/*` 브랜치에서 진행하고 `develop` 브랜치로 Pull Request를 생성합니다.

## 라이선스 및 대회

AI Builder Sprint 2026 출품 프로젝트입니다. 대회 제출 및 외부 공개 전 사용한 API,
폰트, 이미지와 데모 자료의 라이선스를 최종 확인해 주세요.
