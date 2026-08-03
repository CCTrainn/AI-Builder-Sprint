# 변경 요청

- 상태: 완료
- 요청 역할: ROLE-BE-RECORDS
- 변경할 공통 파일: `backend/app/api/routes/health.py`
- 필요한 이유: 현재 `health.py`가 제거된 SQLAlchemy 의존성을 import하여 앱 시작과 전체 테스트 수집이 실패함
- 원하는 변경: 현재 Supabase 기반 구성에 맞는 단순 health 응답으로 교체하거나 SQLAlchemy 의존성을 공식적으로 복구
- 연결되는 API 또는 화면: FastAPI 전체 앱 시작, `/api/v1/health`, 모든 백엔드 테스트
- 확인 방법: `python -m pytest`와 `python -m uvicorn app.main:app` 실행 시 `ModuleNotFoundError: sqlalchemy`가 발생하지 않아야 함

ROLE-BE-RECORDS 전용 테스트에서는 공통 파일을 수정하지 않기 위해 records 라우터만
테스트용 FastAPI 앱에 연결해 우회한다.

## 처리 결과

- 통합 담당자: goyojin
- `health.py`의 SQLAlchemy와 `get_db` 의존성 제거
- 공통 응답 형식으로 단순 liveness 응답 제공
- `/api/v1/health` HTTP 200 확인
- 전체 테스트와 Ruff 검사 통과
