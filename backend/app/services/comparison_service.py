"""시점과 자료 종류에 따라 약속·계약·실제 근로조건을 비교한다."""

from collections import defaultdict
from typing import Any
from uuid import uuid4

from app.schemas.comparisons import (
    ComparisonItem,
    ComparisonStatus,
    ComparisonValue,
)

PROMISED_TYPES = {"job_posting", "employer_message", "verbal_memo"}
CONTRACTED_TYPES = {"employment_contract"}
ACTUAL_TYPES = {
    "work_schedule",
    "attendance",
    "payslip",
    "bank_deposit",
    "workplace_notice",
}

CONDITION_LABELS = {
    "hourly_wage": "시급",
    "working_hours": "근무시간",
    "pay_date": "급여 지급일",
    "probation": "수습기간",
    "weekly_holiday_pay": "주휴수당",
}


def _role(record_type: str) -> str | None:
    if record_type in PROMISED_TYPES:
        return "promised"
    if record_type in CONTRACTED_TYPES:
        return "contracted"
    if record_type in ACTUAL_TYPES:
        return "actual"
    return None


def _comparison_value(row: dict[str, Any]) -> ComparisonValue:
    value = row.get("value_number")
    if value is None:
        value = row.get("value_text")
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return ComparisonValue(
        value=value,
        unit=row.get("unit"),
        record_id=row["record_id"],
    )


def _normalized(value: ComparisonValue) -> tuple[str, str]:
    normalized_value = str(value.value).strip().replace(",", "").replace(" ", "").lower()
    return normalized_value, (value.unit or "").strip().lower()


def _status(values: dict[str, ComparisonValue]) -> ComparisonStatus:
    if len(values) < 2:
        return ComparisonStatus.MISSING
    normalized = {_normalized(value) for value in values.values()}
    if any(value.value is None for value in values.values()):
        return ComparisonStatus.NEEDS_CONFIRMATION
    return ComparisonStatus.SAME if len(normalized) == 1 else ComparisonStatus.DIFFERENT


def _summary(condition: str, values: dict[str, ComparisonValue], status: ComparisonStatus) -> str:
    label = CONDITION_LABELS.get(condition, condition)
    if status == ComparisonStatus.SAME:
        return f"{label} 조건이 기록 사이에서 같습니다."
    if status == ComparisonStatus.DIFFERENT:
        return f"{label} 조건이 기록 사이에서 다릅니다. 적용 기준을 확인해 보세요."
    if status == ComparisonStatus.NEEDS_CONFIRMATION:
        return f"{label} 값이 명확하지 않아 추가 확인이 필요합니다."
    missing_roles = [
        label
        for key, label in (("promised", "약속"), ("contracted", "계약"), ("actual", "실제 기록"))
        if key not in values
    ]
    return f"{label}을 비교하려면 {', '.join(missing_roles)} 자료가 더 필요합니다."


def compare_record_conditions(rows: list[dict[str, Any]]) -> list[ComparisonItem]:
    """DB에서 읽은 기록·조건 행을 조건별 최신 값으로 비교한다."""

    grouped: dict[str, dict[str, tuple[str, ComparisonValue]]] = defaultdict(dict)
    for row in rows:
        role = _role(row["record_type"])
        if role is None:
            continue
        condition = row["condition_type"]
        candidate = (row.get("recorded_at") or "", _comparison_value(row))
        existing = grouped[condition].get(role)
        if existing is None or candidate[0] >= existing[0]:
            grouped[condition][role] = candidate

    results: list[ComparisonItem] = []
    for condition in sorted(grouped):
        values = {role: item[1] for role, item in grouped[condition].items()}
        status = _status(values)
        results.append(
            ComparisonItem(
                comparison_id=f"cmp_{uuid4().hex}",
                condition=condition,
                promised=values.get("promised"),
                contracted=values.get("contracted"),
                actual=values.get("actual"),
                status=status,
                summary=_summary(condition, values, status),
                confirmation_items=(
                    []
                    if status == ComparisonStatus.SAME
                    else [
                        "어느 기록의 조건이 현재 적용되는지",
                        "조건이 달라진 시점과 이유",
                    ]
                ),
            )
        )
    return results
