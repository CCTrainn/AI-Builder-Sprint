# AI Builder Sprint 2026

> 총 168시간, AI와 함께 만드는 도전

## 대회 소개

**AI Builder Sprint 2026**은 부산대학교 **APPTIVE**가 주최하고, **Upstage**, 부산대학교 **Anchor 사업단** 및 부산대학교 **AI융합교육원**이 후원하는 해커톤입니다. 참가자들은 자유로운 기술 스택을 바탕으로 실제로 동작하는 서비스를 직접 코드로 구현합니다.

| 항목 | 내용 |
| --- | --- |
| 주제 | AI를 통해 인간다움을 더욱 잘 드러낼 수 있는 서비스 개발 |
| 팀 구성 | 2~4인 1팀 |
| 개발 방식 | 코드 기반 앱 개발 필수 (노코드/로우코드 단독 사용 불가) |

### 진행 흐름

1. **팀 단위 참가 신청** — 팀원 정보, 프로젝트 아이디어, 활용 예정 AI 기술·API 제출
2. **참가팀 선발** (20~50팀) — 아이디어 참신성·실현 가능성·AI 활용 계획 기반 서류 심사
3. **예선 개발 기간** (7.27 ~ 8.3, 약 1주일) — API 크레딧 발급, 아이디어 구체화 및 개발
4. **결과물 제출 및 1차 심사** — 데모 영상/배포 링크, 코드 저장소, 발표 자료, AI 활용 증빙 제출
5. **본선 발표 및 질의응답** (8.7) — 팀당 7분 발표 + 5분 Q&A, 심사 후 수상팀 확정

### 기술 스택 및 규칙

- 사용 API·모델은 자유이며, **Upstage API**(Solar LLM, Document Parse, Information Extract) 활용 시 심사 가점
- Claude, GPT, Gemini 등 타사 모델 병행 사용 가능 (제약 없음)
- 프레임워크/언어 자유 (Python, JavaScript, React, Flutter 등)
- 결과물은 데모 가능한 동작하는 앱 (웹앱, 모바일앱, CLI 도구 등 형태 무관)
- 코딩 에이전트(Claude Code, Codex 등) 활용 시 `.claude/`, `AGENTS.md` 등 관련 설정·지침 파일을 저장소에 포함해야 심사에 반영됩니다

### 심사 기준

| 기준 | 배점 |
| --- | --- |
| 창의성 | 20점 |
| AI 활용도 | 20점 |
| 완성도 | 20점 |
| 실용성 | 20점 |
| 발표력 (본선) | 20점 |
| Upstage API 활용 가점 | +5점 |
| 지역사회 기여도 가점 | +5점 |

### 시상 내역

- 대상 1팀: 100만원 + 상품
- 최우수상 1팀: 50만원 + 상품
- 우수상 1팀: 상품
- 본선 참가 10팀: Upstage 굿즈 + 참가 인증서

## Git Fork 하는 방법

참가팀은 이 저장소를 팀 대표의 GitHub 계정으로 **Fork**한 뒤, 해당 Fork 저장소에서 프로젝트를 개발하고 최종 결과물을 제출합니다.

### 1. 저장소 Fork하기

1. [AI-Builder-Sprint 저장소](https://github.com/ApptiveDev/AI-Builder-Sprint)에 접속합니다.
2. 우측 상단의 **Fork** 버튼을 클릭합니다.
  <img width="1888" height="1131" alt="스크린샷 2026-07-27 오전 12 31 16" src="https://github.com/user-attachments/assets/2f0f7f80-6c92-4ba5-87c5-89ed6107eeab" />

3. 본인(또는 팀 대표) GitHub 계정으로 저장소가 복사됩니다. (`https://github.com/<내-계정>/AI-Builder-Sprint`)

### 2. Fork한 저장소 로컬로 클론하기

```bash
git clone https://github.com/<내-계정>/AI-Builder-Sprint.git
cd AI-Builder-Sprint
```

### 3. 개발 진행 및 커밋

```bash
git checkout -b develop
# 코드 작성 및 수정
git add .
git commit -m "feat: 프로젝트 초기 구현"
git push origin develop
```

포크된 저장소 내에서 개발을 진행해주시면 됩니다.

### 4. 결과물 제출

- **팀별로 Fork한 본인 저장소 URL을 제출 양식에 기재합니다.**
- 제출 마감 전까지 코드, 데모 영상/배포 링크, 발표 자료를 함께 준비해 제출해주세요.
- 코딩 에이전트를 활용한 경우 `.claude/`, `AGENTS.md` 등 설정 파일도 반드시 저장소에 포함해주세요.


## 문의

- 대회 관련 문의: 해커톤 문의 오픈채팅방
- 주최: 부산대학교 APPTIVE, 정보컴퓨터공학부 동아리연합회 / 후원: Upstage, 부산대 Anchor 사업단, 부산대 AI융합교육원

---

## CCTrainn 프로젝트

외국인 노동자가 채용공고, 근로계약서, 근무기록, 급여명세서, 입금내역과
고용주 대화를 평소에 모아두면 기록 사이에서 달라진 조건을 찾아주고,
고용주에게 확인할 문장과 근거를 제공하는 근로자료 관리 서비스입니다.

### 핵심 흐름

```text
근로자료 수집
-> OCR 및 조건 추출
-> 시점별 기록 비교
-> 관련 공식 법령 조회
-> 쉬운 설명
-> 고용주에게 확인할 문장
-> 답변 분석
-> 근로 기록함에 보관
```

### 기술 구성

- 프론트엔드: HTML, CSS, JavaScript
- 백엔드: Python 3.11+, FastAPI
- 로컬 MVP DB: SQLite
- 파일 저장: 백엔드 전용 로컬 private 폴더
- OCR: Upstage Document Parse 또는 팀이 확정한 단일 OCR
- 법령 정보: 법제처 국가법령정보 공동활용 Open API

### 폴더 구성

```text
backend/   FastAPI, Python 서비스, 백엔드 테스트와 환경변수 예시
frontend/  실제 서비스 화면의 HTML, CSS, JavaScript
docs/      API, DB, 역할 분담과 개발 계획
wireframe/ 화면 흐름을 확인하는 클릭형 시안
output/    데모용 계약서, 임금명세서와 시나리오
scripts/   데모 자료 생성 보조 파일
```

백엔드 명령은 `backend` 폴더에서 실행합니다.

```bash
cd backend
python -m uvicorn app.main:app --reload
python -m pytest
```

첫 실행 시 `backend/local_data/work-rights.db`와 업로드 폴더가 자동 생성됩니다.
이 폴더는 프론트 정적 파일로 공개되지 않으며 Git에도 포함되지 않습니다.
OCR·번역·법령 조회에 사용할 키만 `backend/.env`에 설정합니다.

### 팀 개발 시작

팀원은 [AGENTS.md](./AGENTS.md)와
[역할별 시작 문서](./docs/role-start.md)를 먼저 읽습니다.
각자 최신 `develop` 브랜치에서 자신의 `feature/역할-이름` 브랜치를 만든 뒤,
담당 폴더 안에서만 작업합니다.

```bash
git switch develop
git pull origin develop
git switch -c feature/역할-이름
```

공동 경험·증거 커뮤니티는 현재 MVP 범위가 아니며, 개인정보 보호와 공유
방식을 별도로 기획한 뒤에만 추가합니다.
