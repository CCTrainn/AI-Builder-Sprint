# 확인 대화 백엔드 전달: 권리 점검 결과 사용법

비교 상세 API의 `legal_reference.rights_check`는 Python 규칙이 만든 결과다.
확인 대화 LLM에는 다음 필드를 설명용 입력으로 전달한다.

- `title`, `explanation`: 쉬운 설명과 확인 문장의 문맥
- `basis`: 사용자에게 보여 줄 수치·기록 근거
- `missing_information`: 후속 질문으로 확인할 정보
- `legal_reference.title`, `article`, `source_url`: 공식 법령 근거

LLM이 해도 되는 일:

- 사용자가 선택한 언어로 번역
- 어려운 표현을 쉬운 말로 설명
- 고용주에게 확인할 정중한 문장 생성

LLM이 하면 안 되는 일:

- `status`, `rule_code`, 기준 수치 변경
- 법령 API의 조문이나 링크 변경
- 예외 조건을 확인하지 않고 위법·합법을 확정
- 고용주의 말을 거짓말이라고 단정

확인 문장 생성 후에도 원본 `rights_check` 객체를 함께 저장해 AI 설명과 규칙 결과를
구분할 수 있게 한다.
