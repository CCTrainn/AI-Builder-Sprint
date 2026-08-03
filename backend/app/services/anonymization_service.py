"""공동 경험 공유 전 로컬 익명화 미리보기.

원문을 저장하거나 외부 서비스로 전송하지 않는다.
"""

import re

from app.schemas.community import AnonymizePreviewData

PHONE_PATTERN = re.compile(r"(?<!\d)01[016789][ -]?\d{3,4}[ -]?\d{4}(?!\d)")
REGISTRATION_PATTERN = re.compile(r"(?<!\d)\d{6}[ -]?\d{7}(?!\d)")
ACCOUNT_PATTERN = re.compile(r"(?<!\d)\d{2,4}[ -]?\d{2,6}[ -]?\d{3,7}(?!\d)")
DATE_PATTERN = re.compile(r"(?<!\d)(20\d{2})[./년 -]+(\d{1,2})[./월 -]+(\d{1,2})일?(?!\d)")
MONEY_PATTERN = re.compile(r"(?<!\d)(\d{1,3}(?:,\d{3})+|\d{4,})\s*원")


def anonymize_preview(text: str) -> AnonymizePreviewData:
    anonymized = text
    transformations: list[str] = []
    replacements = [
        (PHONE_PATTERN, "[전화번호 제거]", "전화번호 제거"),
        (REGISTRATION_PATTERN, "[등록번호 제거]", "등록번호 제거"),
        (ACCOUNT_PATTERN, "[계좌정보 제거]", "계좌정보 형태 제거"),
        (DATE_PATTERN, "[정확한 날짜 제거]", "정확한 날짜 일반화"),
        (MONEY_PATTERN, "[정확한 금액 제거]", "정확한 금액 일반화"),
    ]
    for pattern, replacement, description in replacements:
        anonymized, count = pattern.subn(replacement, anonymized)
        if count:
            transformations.append(description)

    potentially_identifying = any(keyword in anonymized for keyword in ("식당", "카페", "지점", "학교", "사장님 이름"))
    if potentially_identifying:
        transformations.append("사업장·기관 식별 표현은 사용자 확인 필요")

    return AnonymizePreviewData(
        anonymized_text=anonymized,
        transformations=transformations,
        safe_to_preview=not potentially_identifying,
        notice="이 결과는 자동 게시되지 않으며 사용자가 최종 내용을 확인하고 동의해야 합니다.",
    )
