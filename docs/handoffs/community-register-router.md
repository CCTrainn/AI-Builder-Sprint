# 공동 경험 API 라우터 등록 요청

담당: `ROLE-COMMUNITY-EXPERIENCE`

현재 공동 경험 API는 로컬 가공 데이터만 사용하며 Supabase를 호출하지 않는다.
통합 담당자는 팀 승인 후 `backend/app/api/router.py`에 다음 라우터를 등록한다.

```python
from app.api.routes import community

api_router.include_router(community.router, prefix="/community", tags=["community"])
```

등록 전에도 `backend/tests/test_community.py`는 독립 FastAPI 앱에 라우터를 연결해
동작을 검증한다.
