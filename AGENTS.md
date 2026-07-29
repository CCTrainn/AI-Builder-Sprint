# Work Rights Companion 협업 규칙

이 파일은 모든 조원과 Codex가 함께 지키는 프로젝트 규칙이다.
이 파일은 개인 역할에 맞춰 수정하지 않는다. 개인 역할은 `.codex/ROLE.md`에 기록한다.

## 1. 제품 목표

이 앱은 법률 사건 접수 서비스가 아니다.
외국인 유학생과 이주노동자가 평소 채용공고, 근로계약서, 근무기록,
급여명세서, 입금내역, 고용주 대화를 모아두고 기록 사이에서 달라진 조건을
발견하도록 돕는 근로자료 관리 서비스다.

기본 흐름:

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

AI는 위법 여부를 확정하지 않는다. "불법", "거짓말"처럼 단정하지 않고
"기록이 다름", "확인 필요", "답변되지 않음"으로 표현한다.

## 2. 고정 기술

- 프론트엔드: HTML, CSS, JavaScript
- 백엔드: Python 3.11+, FastAPI
- DB: Supabase PostgreSQL
- 원본 파일: Supabase Storage의 private bucket
- OCR: 팀이 선택한 OCR 제공자 하나만 사용
- 공식 법령: 법제처 국가법령정보 공동활용 Open API
- LLM: 팀이 선택한 제공자 하나만 사용
- MVP에서는 대규모 RAG를 만들지 않는다.
- Python 규칙으로 기록 차이를 찾고 법령 API로 공식 조문을 가져온다.

## 3. Codex가 역할 선언을 받았을 때

조원이 다음처럼 말하면:

> 나의 역할은 백엔드 정보 적재 담당이야. AGENTS.md를 읽고 작업을 시작할 수 있게 해줘.

Codex는 아래 순서대로 행동한다.

1. `AGENTS.md`, `docs/team-plan.md`, `docs/api-contract.md`,
   `docs/database.md`를 읽는다.
2. 아래 네 역할 중 하나를 정확히 선택한다.
3. 저장소 상태와 현재 브랜치를 확인한다.
4. `.codex/ROLE.md`를 역할 템플릿에 맞춰 생성하거나 갱신한다.
5. 담당 파일, 수정 금지 파일, 첫 세 작업, 테스트 방법을 사용자에게 알려준다.
6. 사용자가 작업 시작을 요청하면 담당 파일 안에서만 구현한다.

`.codex/ROLE.md`는 개인별 로컬 파일이며 Git에 커밋하지 않는다.
개인 역할 때문에 `AGENTS.md`를 수정하지 않는다.

역할이 불명확하면 코드를 수정하기 전에 정확한 역할을 한 번만 물어본다.

## 4. 역할과 파일 소유권

### ROLE-BE-RECORDS: 백엔드 정보 적재 담당

담당:

- 파일 업로드
- Supabase Storage 저장
- OCR
- 문서 텍스트 및 근로조건 추출
- 기록 비교
- 법제처 API 조회 및 법령 캐시

전용 수정 가능 파일:

```text
app/api/routes/records.py
app/api/routes/comparisons.py
app/services/storage_service.py
app/services/ocr_service.py
app/services/extraction_service.py
app/services/comparison_service.py
app/services/law_api_service.py
app/schemas/records.py
app/schemas/comparisons.py
app/db/tables_records.py
tests/test_records.py
tests/test_comparisons.py
```

### ROLE-BE-CONVERSATION: 백엔드 확인 대화 담당

담당:

- 확인 문장 생성
- 말투별 한국어 문장
- 사용자 언어 번역
- 고용주 답변 분석
- 답변/부분답변/미답변 분류
- 후속 질문 생성
- 대화 저장

전용 수정 가능 파일:

```text
app/api/routes/conversations.py
app/services/conversation_service.py
app/services/reply_analysis_service.py
app/schemas/conversations.py
app/prompts/conversation.py
app/db/tables_conversations.py
tests/test_conversations.py
```

### ROLE-FE-RECORDS: 프론트 기록·비교 담당

담당:

- 홈의 근무자료 현황
- 파일 업로드
- 근무 기록 타임라인
- 기록 비교
- 달라진 조건
- 더 필요한 기록

전용 수정 가능 파일:

```text
frontend/features/home/
frontend/features/records/
frontend/features/comparison/
```

### ROLE-FE-CONVERSATION: 프론트 대화·기록함 담당

담당:

- 확인 대화
- 추천 문장과 번역
- 고용주 답변 입력
- 답변 분석 결과
- 근로 기록함

전용 수정 가능 파일:

```text
frontend/features/conversation/
frontend/features/record_box/
```

프론트엔드 두 명은 역할을 서로 바꿔도 되지만, 같은 기능 폴더를 동시에 수정하면 안 된다.
담당 폴더 변경은 두 사람이 합의하고 `.codex/ROLE.md`에만 반영한다.

## 5. 공통 파일

다음 파일은 개인이 임의로 수정하지 않는다.

```text
AGENTS.md
app/main.py
app/api/router.py
app/core/config.py
app/db/session.py
app/db/models.py
frontend/index.html
frontend/shared/
docs/api-contract.md
docs/database.md
pyproject.toml
.env.example
```

공통 파일 수정이 필요하면:

1. `docs/handoffs/<역할>-<내용>.md`에 필요한 변경을 작성한다.
2. 팀의 통합 담당자에게 전달한다.
3. 통합 담당자가 별도 커밋으로 공통 파일을 수정한다.

해커톤 기간의 통합 담당자는 팀이 1명을 정한다. 권장: 백엔드 정보 적재 담당.

통합 담당자는 최초 기능 개발 전에 다음을 확인한다.

1. `app/api/router.py`가 기록·비교·대화 API만 연결하는지
2. `pyproject.toml`과 `README.md`에 이전 RAG 설명이 남아 있지 않은지
3. 모든 역할 전용 파일이 실제 폴더 구조와 일치하는지
4. `develop` 브랜치가 생성되어 팀원들이 가져올 수 있는지

## 6. API 계약 우선

프론트는 백엔드를 기다리지 않고 `docs/api-contract.md`의 예시 JSON으로 화면을 만든다.
백엔드는 문서에 정의된 JSON을 그대로 반환한다.

필드 이름을 변경하거나 삭제하지 않는다. 변경이 필요하면 먼저
`docs/api-contract.md` 변경을 팀 전체가 합의해야 한다.

모든 API 응답은 기본적으로 다음 구조를 사용한다.

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## 7. DB와 Storage 규칙

- 원본 PDF, 이미지, 대화 캡처는 Storage에 저장한다.
- DB에는 파일 자체가 아닌 `storage_path`, 자료 종류, 날짜, OCR 결과,
  추출 조건, 비교 결과를 저장한다.
- Storage bucket은 public으로 만들지 않는다.
- 실제 이름, 전화번호, 계좌번호, 외국인등록번호를 테스트 데이터에 넣지 않는다.
- Supabase service role key는 백엔드 환경변수에만 두며 프론트에 노출하지 않는다.
- `.env`는 절대 커밋하지 않는다.

## 8. Git 규칙

`main`과 `develop` 브랜치에 직접 커밋하거나 푸시하지 않는다.

브랜치 용도:

```text
main: 심사와 제출에 사용하는 안정 버전
develop: 네 사람의 기능을 합치고 통합 테스트하는 버전
feature/*: 각 담당자가 실제로 개발하는 버전
```

권장 브랜치:

```text
feature/be-records-이름
feature/be-conversation-이름
feature/fe-records-이름
feature/fe-conversation-이름
```

작업 시작:

```bash
git switch develop
git pull origin develop
git switch -c feature/역할-이름
```

작업 완료:

```text
feature/*에서 커밋과 푸시
-> develop을 대상으로 Pull Request 생성
-> 담당 기능 테스트와 충돌 확인
-> 통합 담당자가 develop에 병합
-> 전체 시연이 안정되면 develop에서 main으로 최종 Pull Request
```

커밋 메시지:

```text
feat(records): 계약서 업로드 API 추가
feat(conversation): 고용주 답변 분석 추가
fix(comparison): 시급 숫자 변환 오류 수정
test(records): OCR 결과 테스트 추가
docs(api): 대화 분석 응답 예시 추가
```

규칙:

- 한 커밋에는 한 가지 목적만 담는다.
- 다른 조원의 전용 파일을 수정하지 않는다.
- 공통 파일 변경과 개인 기능 변경을 같은 커밋에 섞지 않는다.
- `git push --force`, `git reset --hard`를 사용하지 않는다.
- 병합 전에 자신의 테스트를 실행한다.
- Pull Request 설명에 변경 파일, 테스트 결과, 남은 문제를 적는다.
- 충돌이 나면 상대 파일을 임의로 덮어쓰지 말고 해당 담당자와 해결한다.

## 9. 완료 기준

기능 완료는 화면이나 함수가 존재하는 것만 의미하지 않는다.

- 입력 예시가 동작한다.
- 성공 응답과 오류 응답이 있다.
- API 응답이 계약 문서와 일치한다.
- 개인정보나 API 키가 코드에 없다.
- 최소 한 개 테스트 또는 재현 가능한 확인 절차가 있다.
- 데모 시나리오에서 다음 단계로 연결된다.

## 10. 범위 제한

1주 MVP에서는 다음을 하지 않는다.

- 근로법 전체 RAG
- 위법 여부 확정
- 카카오톡 실시간 직접 연동
- 자동 신고
- 실제 고용주 평가
- 원본 개인정보의 커뮤니티 공유
- 공동 경험·증거 커뮤니티
- 새로운 프레임워크 추가

공동 경험·증거 커뮤니티는 현재 네 역할의 개발 범위에 포함하지 않는다.
목적, 공유 단위, 개인정보 제거 방법, 검증 방식, 악용 방지 기준을 팀이 별도로
합의한 뒤에만 새로운 기획 문서와 담당자를 정한다. 그전에는 화면, API, DB
테이블을 미리 만들지 않는다.
