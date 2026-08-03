"""시점과 자료 종류에 따라 약속·계약·실제 근로조건을 비교한다."""

import re
from collections import defaultdict
from typing import Any
from uuid import uuid4

from app.schemas.comparisons import (
    ComparisonItem,
    ComparisonStatus,
    ComparisonValue,
    PayCalculation,
    RightsCheck,
    RightsCheckStatus,
)

MINIMUM_HOURLY_WAGES = {2024: 9_860, 2025: 10_030, 2026: 10_320}

PROMISED_TYPES = {"job_posting", "employer_message", "verbal_memo"}
CONTRACTED_TYPES = {"employment_contract"}
ACTUAL_TYPES = {
    "work_schedule",
    "attendance",
    "payslip",
    "bank_deposit",
    "workplace_notice",
}
ACTUAL_CONDITION_ALIASES = {
    "deposit_date": "pay_date",
    "deposit_amount": "net_pay",
}

CONDITION_LABELS = {
    "hourly_wage": "시급",
    "working_hours": "근무시간",
    "weekly_working_hours": "주 근로시간",
    "total_working_hours": "월 총 근로시간",
    "overtime_hours": "연장·야간·휴일근로",
    "break_time": "휴게시간",
    "pay_date": "급여 지급일",
    "probation": "수습기간",
    "weekly_holiday_pay": "주휴수당",
    "basic_pay": "기본급",
    "gross_pay": "지급액 합계",
    "deductions": "공제액",
    "net_pay": "실수령액",
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
        recorded_at=row.get("recorded_at"),
    )


def _pay_day(value: object) -> int | None:
    text = str(value)
    date_match = re.search(r"(?:\d{4}[./-])?(\d{1,2})[./-](\d{1,2})", text)
    if date_match:
        return int(date_match.group(2))
    day_match = re.search(r"(?:매월\s*)?(\d{1,2})\s*일", text)
    if day_match:
        return int(day_match.group(1))
    if isinstance(value, (int, float)) and 1 <= value <= 31:
        return int(value)
    return None


def _normalized(condition: str, value: ComparisonValue) -> tuple[str, str]:
    if condition == "pay_date":
        day = _pay_day(value.value)
        return (str(day) if day is not None else str(value.value), "day")
    normalized_value = str(value.value).strip().replace(",", "").replace(" ", "").lower()
    normalized_value = re.sub(r"[~～–—]", "-", normalized_value)
    unit = (value.unit or "").strip().lower()
    if unit in {"원", "won", "krw"}:
        unit = "krw"
    elif unit in {"hour", "hours", "시간", "hours_per_week", "hours_per_month"}:
        unit = "hours"
    elif unit in {"minute", "minutes", "분"}:
        unit = "minutes"
    return normalized_value, unit


def _status(condition: str, values: dict[str, ComparisonValue]) -> ComparisonStatus:
    if len(values) < 2:
        return ComparisonStatus.MISSING
    normalized = {_normalized(condition, value) for value in values.values()}
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


def _latest_value(item: ComparisonItem | None) -> ComparisonValue | None:
    if item is None:
        return None
    return item.actual or item.contracted or item.promised


def _number(value: ComparisonValue | None) -> float | None:
    if value is None or value.value is None:
        return None
    try:
        return float(str(value.value).replace(",", ""))
    except ValueError:
        return None


def _time_range_minutes(value: ComparisonValue | None) -> int | None:
    if value is None:
        return None
    match = re.search(r"(\d{1,2}):(\d{2})\s*[-~～]\s*(\d{1,2}):(\d{2})", str(value.value))
    if not match:
        return None
    start = int(match.group(1)) * 60 + int(match.group(2))
    end = int(match.group(3)) * 60 + int(match.group(4))
    if end < start:
        end += 24 * 60
    return end - start


def _minimum_wage_year(value: ComparisonValue) -> tuple[int | None, int | None]:
    match = re.match(r"(\d{4})", value.recorded_at or "")
    year = int(match.group(1)) if match else None
    return year, MINIMUM_HOURLY_WAGES.get(year) if year else None


def _item_map(items: list[ComparisonItem] | None) -> dict[str, ComparisonItem]:
    return {candidate.condition: candidate for candidate in items or []}


def _record_difference(item: ComparisonItem) -> RightsCheck:
    if item.status == ComparisonStatus.DIFFERENT:
        return RightsCheck(
            status=RightsCheckStatus.NEEDS_CONFIRMATION,
            rule_code="record_difference",
            title="기록 간 조건 차이 추가 확인 필요",
            explanation="기록끼리 조건이 다릅니다. 적용 시점과 변경 합의 여부를 확인해야 합니다.",
            basis=[item.summary],
            missing_information=["실제 적용 시점", "조건 변경 합의 기록"],
        )
    if item.status in {ComparisonStatus.MISSING, ComparisonStatus.NEEDS_CONFIRMATION}:
        return RightsCheck(missing_information=item.confirmation_items or ["추가 비교 기록"])
    return RightsCheck(
        status=RightsCheckStatus.NO_MISMATCH_DETECTED,
        rule_code="record_consistency",
        title="현재 기록에서 차이 발견 안 됨",
        explanation="현재 비교 가능한 기록에서는 조건 차이가 발견되지 않았습니다.",
        basis=[item.summary],
    )


def _pay_estimate(items: dict[str, ComparisonItem]) -> PayCalculation | None:
    wage_item = items.get("hourly_wage")
    hours_item = items.get("total_working_hours")
    gross_item = items.get("gross_pay")
    if not wage_item or not hours_item:
        return None
    wage = _number(wage_item.contracted or wage_item.promised or wage_item.actual)
    hours = _number(_latest_value(hours_item))
    if wage is None or hours is None:
        return None
    overtime = _number(_latest_value(items.get("overtime_hours"))) or 0
    expected = round(wage * hours + wage * overtime * 0.5)
    recorded = _number(_latest_value(gross_item))
    recorded_amount = round(recorded) if recorded is not None else None
    return PayCalculation(
        label="단순 예상 지급액",
        formula=f"{wage:,.0f}원 × {hours:g}시간 + 연장 등 가산분 {wage * overtime * 0.5:,.0f}원",
        expected_amount=expected,
        recorded_amount=recorded_amount,
        difference=(recorded_amount - expected if recorded_amount is not None else None),
        caveats=["주휴수당과 별도 수당은 추출된 경우에만 반영", "세금·보험 등 공제 전 단순 계산"],
    )


def evaluate_rights_check(
    item: ComparisonItem,
    all_items: list[ComparisonItem] | None = None,
) -> RightsCheck:
    """숫자와 기록으로 확인 가능한 기준만 점검하고 예외는 확인 항목으로 남긴다."""

    latest = _latest_value(item)
    if latest is None or latest.value is None:
        return RightsCheck(missing_information=["비교할 금액 또는 근로조건 기록"])
    items = _item_map(all_items)

    if item.condition == "hourly_wage":
        wage = _number(latest)
        year, minimum_wage = _minimum_wage_year(latest)
        if wage is None:
            return RightsCheck(
                explanation="시급을 숫자로 확인할 수 없습니다.",
                missing_information=["숫자로 표시된 시급"],
            )
        if minimum_wage is None:
            return RightsCheck(
                rule_code="minimum_wage_year_unknown",
                explanation="자료 날짜에 해당하는 최저임금 기준이 준비되지 않았습니다.",
                basis=[f"기록된 시급: {wage:,.0f}원"],
                missing_information=["자료 적용 연도"],
            )
        basis = [f"기록된 시급: {wage:,.0f}원", f"{year}년 적용 최저임금: {minimum_wage:,}원"]
        if wage < minimum_wage:
            return RightsCheck(
                status=RightsCheckStatus.STANDARD_MISMATCH,
                rule_code=f"minimum_wage_{year}",
                title=f"{year}년 최저임금 기준과 기록이 다름",
                explanation=(
                    f"기록된 시급이 {year}년 최저임금보다 낮습니다. "
                    "수습 감액 등 적용 조건을 추가로 확인해야 합니다."
                ),
                basis=basis,
                missing_information=["계약기간", "수습 여부와 기간", "업무 종류"],
            )
        return RightsCheck(
            status=RightsCheckStatus.NO_MISMATCH_DETECTED,
            rule_code=f"minimum_wage_{year}",
            title="최저임금 수치 차이 발견 안 됨",
            explanation=f"기록된 시급은 {year}년 최저임금 이상입니다.",
            basis=basis,
        )

    if item.condition == "weekly_working_hours":
        hours = _number(latest)
        if hours is not None and hours > 40:
            return RightsCheck(
                status=RightsCheckStatus.NEEDS_CONFIRMATION,
                rule_code="weekly_hours_over_40",
                title="주 40시간 기준 추가 확인 필요",
                explanation="주 40시간을 넘는 기록이 있습니다. 연장근로 합의와 수당을 확인해야 합니다.",
                basis=[f"기록된 주 근로시간: {hours:g}시간", "법정 기준 근로시간: 주 40시간"],
                missing_information=["연장근로 합의", "연장근로수당", "사업장 상시근로자 수"],
            )

    if item.condition == "break_time":
        work_minutes = _time_range_minutes(_latest_value(items.get("working_hours")))
        break_minutes = _time_range_minutes(latest)
        if work_minutes is not None and break_minutes is not None:
            actual_work_minutes = max(0, work_minutes - break_minutes)
            required = 60 if actual_work_minutes >= 480 else 30 if actual_work_minutes >= 240 else 0
            basis = [
                f"휴게 제외 근로시간: 약 {actual_work_minutes // 60}시간 {actual_work_minutes % 60}분",
                f"기록된 휴게시간: {break_minutes}분",
            ]
            if break_minutes < required:
                return RightsCheck(
                    status=RightsCheckStatus.STANDARD_MISMATCH,
                    rule_code="minimum_break_time",
                    title="휴게시간 기준과 기록이 다름",
                    explanation=f"현재 시간 기록에는 최소 {required}분보다 짧은 휴게시간이 표시되어 있습니다.",
                    basis=basis,
                    missing_information=["휴게가 근로 도중 보장되었는지", "추가 휴게시간 기록"],
                )
            return RightsCheck(
                status=RightsCheckStatus.NO_MISMATCH_DETECTED,
                rule_code="minimum_break_time",
                title="휴게시간 수치 차이 발견 안 됨",
                explanation="현재 기록된 근로시간과 휴게시간의 수치가 최소기준 이상입니다.",
                basis=basis,
            )

    if item.condition == "weekly_holiday_pay":
        weekly_hours = _number(_latest_value(items.get("weekly_working_hours")))
        pay_value = str(latest.value).replace(" ", "")
        not_paid = pay_value in {"0", "미포함", "지급하지않음"}
        if weekly_hours is not None and weekly_hours >= 15 and not_paid:
            return RightsCheck(
                status=RightsCheckStatus.NEEDS_CONFIRMATION,
                rule_code="weekly_holiday_eligibility",
                title="주휴수당 적용 조건 추가 확인 필요",
                explanation="주 15시간 이상 기록과 주휴수당 미지급 표시가 함께 있습니다.",
                basis=[
                    f"기록된 주 근로시간: {weekly_hours:g}시간",
                    f"주휴수당 기록: {latest.value}",
                ],
                missing_information=[
                    "4주 평균 소정근로시간",
                    "해당 주 소정근로일 개근 여부",
                    "주휴수당 포함 계산 근거",
                ],
            )

    if item.condition == "overtime_hours":
        hours = _number(latest)
        wage = _number(_latest_value(items.get("hourly_wage")))
        if hours is not None and hours > 0:
            calculation = None
            if wage is not None:
                premium = round(wage * hours * 0.5)
                calculation = PayCalculation(
                    label="연장·야간·휴일 가산분 단순 예상액",
                    formula=f"{wage:,.0f}원 × {hours:g}시간 × 0.5",
                    expected_amount=premium,
                    caveats=["연장·야간·휴일 유형과 중복 여부에 따라 실제 계산이 달라질 수 있음"],
                )
            return RightsCheck(
                status=RightsCheckStatus.NEEDS_CONFIRMATION,
                rule_code="overtime_premium",
                title="가산수당 계산 근거 확인 필요",
                explanation="연장·야간·휴일근로 시간이 있어 가산수당 지급 기록을 확인해야 합니다.",
                basis=[f"기록된 시간: {hours:g}시간"],
                missing_information=[
                    "근로 유형별 시간",
                    "사업장 상시근로자 수",
                    "가산수당 지급 항목",
                ],
                calculation=calculation,
            )

    if item.condition == "gross_pay":
        calculation = _pay_estimate(items)
        if calculation is not None:
            if calculation.difference is not None and calculation.difference < 0:
                return RightsCheck(
                    status=RightsCheckStatus.NEEDS_CONFIRMATION,
                    rule_code="estimated_gross_pay_shortfall",
                    title="예상 지급액과 기록된 지급액 확인 필요",
                    explanation="추출된 시급과 근로시간으로 단순 계산한 금액보다 기록된 지급액이 적습니다.",
                    basis=[
                        f"단순 예상액: {calculation.expected_amount:,}원",
                        f"기록된 지급액: {calculation.recorded_amount:,}원",
                    ],
                    missing_information=[
                        "주휴수당",
                        "각종 수당",
                        "근로시간별 가산 여부",
                        "급여 계산식",
                    ],
                    calculation=calculation,
                )
            check = _record_difference(item)
            check.calculation = calculation
            return check

    if item.condition == "net_pay":
        gross = _number(_latest_value(items.get("gross_pay")))
        deductions = _number(_latest_value(items.get("deductions")))
        net = _number(latest)
        if gross is not None and deductions is not None and net is not None:
            expected = round(gross - deductions)
            recorded = round(net)
            calculation = PayCalculation(
                label="실수령액 기록 계산",
                formula=f"지급액 {gross:,.0f}원 - 공제액 {deductions:,.0f}원",
                expected_amount=expected,
                recorded_amount=recorded,
                difference=recorded - expected,
            )
            if recorded != expected:
                return RightsCheck(
                    status=RightsCheckStatus.NEEDS_CONFIRMATION,
                    rule_code="net_pay_calculation_difference",
                    title="실수령액 계산 기록 확인 필요",
                    explanation="지급액에서 공제액을 뺀 금액과 실수령액 또는 입금액이 다릅니다.",
                    basis=[f"계산상 실수령액: {expected:,}원", f"실제 기록: {recorded:,}원"],
                    missing_information=["추가 공제 또는 별도 지급 내역"],
                    calculation=calculation,
                )
            check = _record_difference(item)
            check.calculation = calculation
            return check

    if item.condition == "probation":
        check = _record_difference(item)
        check.status = RightsCheckStatus.NEEDS_CONFIRMATION
        check.rule_code = "probation_conditions"
        check.title = "수습 적용 조건 확인 필요"
        check.missing_information = ["근로계약기간", "수습기간", "업무 종류", "감액률"]
        return check

    return _record_difference(item)


def compare_record_conditions(rows: list[dict[str, Any]]) -> list[ComparisonItem]:
    """DB에서 읽은 기록·조건 행을 조건별 최신 값으로 비교한다."""

    grouped: dict[str, dict[str, tuple[str, ComparisonValue]]] = defaultdict(dict)
    for row in rows:
        role = _role(row["record_type"])
        if role is None:
            continue
        condition = row["condition_type"]
        if row["record_type"] == "payslip" and condition == "net_pay":
            role = "contracted"
        if role == "actual":
            condition = ACTUAL_CONDITION_ALIASES.get(condition, condition)
        candidate = (row.get("recorded_at") or "", _comparison_value(row))
        existing = grouped[condition].get(role)
        if existing is None or candidate[0] >= existing[0]:
            grouped[condition][role] = candidate

    results: list[ComparisonItem] = []
    for condition in sorted(grouped):
        values = {role: item[1] for role, item in grouped[condition].items()}
        status = _status(condition, values)
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
                    else ["어느 기록의 조건이 현재 적용되는지", "조건이 달라진 시점과 이유"]
                ),
            )
        )
    return results
