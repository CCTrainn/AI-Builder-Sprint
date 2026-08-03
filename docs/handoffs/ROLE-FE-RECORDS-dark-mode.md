# 공통 다크모드 연결 요청

## 목적

모든 기능 화면에서 동일한 다크모드 토글을 제공한다. 토글은 사이드바 하단의
언어 선택 버튼 왼쪽에 배치하며, 기존 기능별 HTML과 JavaScript는 변경하지 않는다.

## 공통 변경 범위

- `frontend/shared/theme.js`: 테마 초기화, 토글 생성, 선택 저장
- `frontend/shared/theme.css`: `[data-theme="dark"]`로 격리된 공통 다크 스타일
- `frontend/shared/app.js`: 위 테마 모듈 import 및 사이드바 렌더 후 초기화

## 충돌 방지 기준

- 기존 사이드바 HTML 문자열과 언어 선택 이벤트는 수정하지 않는다.
- 테마 선택은 별도 키 `work_rights_theme_v1`로 `localStorage`에 저장한다.
- 스타일은 `[data-theme="dark"]` 범위에서만 적용해 라이트 모드를 유지한다.
- 기능별 HTML, CSS, JavaScript 파일은 수정하지 않는다.

## 확인 결과

- 전체 6개 기능 페이지에서 공통 진입점 연결 확인
- Chrome 헤드리스 렌더링 확인: 홈, 자료, 비교, 대화, 기록함, 공동 경험
- 데스크톱에서 다크모드 버튼이 언어 선택 버튼 왼쪽에 표시됨
- `git diff --check` 통과
