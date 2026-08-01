"""OCR 텍스트에서 비교에 필요한 근로조건을 규칙 기반으로 추출한다."""

import re

from app.schemas.records import ExtractedCondition


def _condition(
    condition_type: str,
    match: re.Match[str],
    value: float | str | None,
    unit: str | None = None,
    confidence: float = 0.9,
) -> ExtractedCondition:
    return ExtractedCondition(
        type=condition_type,
        value=value,
        unit=unit,
        confidence=confidence,
        source_text=" ".join(match.group(0).split()),
    )


def _money_condition(
    text: str,
    label_pattern: str,
    condition_type: str,
    *,
    confidence: float = 0.94,
) -> ExtractedCondition | None:
    match = re.search(
        rf"{label_pattern}\s*[:：]?\s*(\d{{1,3}}(?:,\d{{3}})+|\d+)\s*원",
        text,
    )
    if not match:
        return None
    return _condition(
        condition_type,
        match,
        int(match.group(1).replace(",", "")),
        "KRW",
        confidence,
    )


def extract_conditions(
    text: str,
    document_type: str | None = None,
) -> list[ExtractedCondition]:
    normalized = text.replace("\u00a0", " ")
    conditions: list[ExtractedCondition] = []

    wage = re.search(
        r"(?:시급|시간급|시간당(?:\s*임금)?)[^\d]{0,12}(\d{1,3}(?:,\d{3})+|\d{4,6})\s*원?",
        normalized,
    )
    if wage:
        conditions.append(
            _condition("hourly_wage", wage, int(wage.group(1).replace(",", "")), "KRW")
        )

    schedule = re.search(
        r"(?:월|화|수|목|금|토|일)요일\s+"
        r"([01]?\d|2[0-3]):(\d{2})\s+"
        r"([01]?\d|2[0-3]):(\d{2})\s+"
        r"(없음|(?:[01]?\d|2[0-3]):\d{2}\s*[~～-]\s*(?:[01]?\d|2[0-3]):\d{2})",
        normalized,
    )
    hours = schedule or re.search(
        r"(?:근로시간|근무시간|업무시간)\s*[:：]?\s*"
        r"([01]?\d|2[0-3])\s*[:시]\s*(\d{2})?\s*"
        r"(?:부터|~|～|-)\s*"
        r"([01]?\d|2[0-3])\s*[:시]\s*(\d{2})?",
        normalized,
    )
    if hours:
        start = f"{int(hours.group(1)):02d}:{hours.group(2) or '00'}"
        end = f"{int(hours.group(3)):02d}:{hours.group(4) or '00'}"
        conditions.append(_condition("working_hours", hours, f"{start}-{end}", None, 0.88))

    break_time = re.search(
        r"(?:월|화|수|목|금|토|일)요일\s+"
        r"(?:[01]?\d|2[0-3]):\d{2}\s+"
        r"(?:[01]?\d|2[0-3]):\d{2}\s+"
        r"((?:[01]?\d|2[0-3]):\d{2}\s*[~～-]\s*(?:[01]?\d|2[0-3]):\d{2})",
        normalized,
    )
    if break_time:
        break_value = (
            re.sub(r"\s+", "", break_time.group(1)).replace("~", "-").replace("～", "-")
        )
        conditions.append(_condition("break_time", break_time, break_value, None, 0.9))

    weekly_hours = re.search(r"(?:합계\s*)?주\s*\d+\s*일\s*주\s*(\d+(?:\.\d+)?)\s*시간", normalized)
    if weekly_hours:
        conditions.append(
            _condition(
                "weekly_working_hours",
                weekly_hours,
                float(weekly_hours.group(1)),
                "hours_per_week",
                0.94,
            )
        )

    pay_date = re.search(
        r"(?:임금\s*지급일|급여일|지급일)[^\d]{0,12}(?:매월\s*)?(\d{1,2})\s*일",
        normalized,
    )
    if pay_date:
        conditions.append(_condition("pay_date", pay_date, int(pay_date.group(1)), "day"))

    probation = re.search(r"(?:수습|수습기간)\s*(?:은|:)?\s*(\d{1,2})\s*(개월|주)", normalized)
    if probation:
        unit = "month" if probation.group(2) == "개월" else "week"
        conditions.append(
            _condition("probation", probation, int(probation.group(1)), unit, 0.92)
        )

    weekly = re.search(
        r"주휴\s*수당[^.]{0,40}?"
        r"(포함|미포함|별도\s*(?:지급|계산)|지급하지\s*않음|"
        r"\d{1,3}(?:,\d{3})*\s*원)",
        normalized,
    )
    if weekly:
        raw_value = weekly.group(1).replace(" ", "")
        amount = re.search(r"\d[\d,]*", raw_value)
        value: int | str = int(amount.group(0).replace(",", "")) if amount else raw_value
        unit = "KRW" if amount else None
        conditions.append(_condition("weekly_holiday_pay", weekly, value, unit, 0.86))

    if document_type == "payslip":
        total_hours = re.search(r"총\s*근로시간\s*(\d+(?:\.\d+)?)\s*시간", normalized)
        if total_hours:
            conditions.append(
                _condition(
                    "total_working_hours",
                    total_hours,
                    float(total_hours.group(1)),
                    "hours_per_month",
                    0.96,
                )
            )

        overtime = re.search(
            r"연장[·ㆍ,\s]*야간[·ㆍ,\s]*휴일근로\s*(\d+(?:\.\d+)?)\s*시간",
            normalized,
        )
        if overtime:
            conditions.append(
                _condition(
                    "overtime_hours",
                    overtime,
                    float(overtime.group(1)),
                    "hours_per_month",
                    0.95,
                )
            )

        money_fields = (
            (r"기본급(?!\s*계산)", "basic_pay"),
            (r"지급액\s*계", "gross_pay"),
            (r"공제액\s*계", "deductions"),
            (r"실수령액", "net_pay"),
        )
        for label_pattern, condition_type in money_fields:
            extracted = _money_condition(normalized, label_pattern, condition_type)
            if extracted:
                conditions.append(extracted)

        if re.search(r"수습기간\s*적용", normalized):
            probation_applied = re.search(r"수습기간\s*적용", normalized)
            if probation_applied:
                conditions.append(
                    _condition(
                        "probation",
                        probation_applied,
                        "applied_without_details",
                        None,
                        0.9,
                    )
                )

    if document_type == "job_posting":
        posting_patterns = (
            (
                "employment_period",
                r"근무기간\s*\n?\s*(\d{4}[./-]\d{1,2}[./-]\d{1,2}\s*(?:~|\-|–|—)\s*\d{4}[./-]\d{1,2}[./-]\d{1,2})",
                None,
                0.95,
            ),
            (
                "work_days",
                r"근무요일\s*\n?\s*([^\n]+)",
                None,
                0.92,
            ),
            (
                "working_hours",
                r"근무시간\s*\n?\s*(?:평일\s*)?((?:[01]?\d|2[0-3]):\d{2}\s*(?:~|\-|–|—)\s*(?:[01]?\d|2[0-3]):\d{2})",
                None,
                0.94,
            ),
            (
                "break_time",
                r"휴게시간\s*\n?\s*(?:[^\d\n]*\s*)?((?:[01]?\d|2[0-3]):\d{2}\s*(?:~|\-|–|—)\s*(?:[01]?\d|2[0-3]):\d{2})",
                None,
                0.93,
            ),
            (
                "job_duties",
                r"업무\s*\n?\s*([^\n]+)",
                None,
                0.9,
            ),
        )
        existing_types = {condition.type for condition in conditions}
        for condition_type, pattern, unit, confidence in posting_patterns:
            if condition_type in existing_types:
                continue
            match = re.search(pattern, normalized)
            if match:
                value = re.sub(r"\s+", " ", match.group(1)).strip().replace("~", "-")
                conditions.append(_condition(condition_type, match, value, unit, confidence))

        if "pay_date" not in existing_types:
            posting_pay_date = re.search(r"(?:급여[^\n]*\n?)?[^\n]{0,60}?매월\s*(\d{1,2})일", normalized)
            if posting_pay_date:
                conditions.append(
                    _condition("pay_date", posting_pay_date, int(posting_pay_date.group(1)), "day", 0.92)
                )

    if document_type in {"work_schedule", "attendance"}:
        table_rows = re.finditer(
            r"(?P<date>\d{1,2}/\d{1,2}\s*\([월화수목금토일]\))\s*\n"
            r"(?P<scheduled>(?:[01]?\d|2[0-3]):\d{2}\s*(?:~|\-|–|—)\s*"
            r"(?:[01]?\d|2[0-3]):\d{2}|휴무)\s*\n"
            r"(?P<actual>(?:(?:[01]?\d|2[0-3]):\d{2}\s*(?:~|\-|–|—)\s*"
            r"(?:[01]?\d|2[0-3]):\d{2})|-)\s*\n"
            r"(?P<break>(?:(?:[01]?\d|2[0-3]):\d{2}\s*(?:~|\-|–|—)\s*"
            r"(?:[01]?\d|2[0-3]):\d{2})|없음|-)\s*\n"
            r"(?P<duration>(?:\d+\s*시간(?:\s*\d+\s*분)?)|-)\s*\n"
            r"(?P<status>[^\n]+)",
            normalized,
        )
        for row in table_rows:
            if row.group("actual") == "-":
                continue
            source = " ".join(row.group(0).split())
            conditions.append(
                ExtractedCondition(
                    type="attendance_date",
                    value=row.group("date"),
                    confidence=0.96,
                    source_text=source,
                )
            )
            if row.group("scheduled") != "휴무":
                conditions.append(
                    ExtractedCondition(
                        type="scheduled_working_hours",
                        value=re.sub(r"\s+", "", row.group("scheduled")).replace("~", "-"),
                        confidence=0.93,
                        source_text=source,
                    )
                )
            conditions.append(
                ExtractedCondition(
                    type="working_hours",
                    value=re.sub(r"\s+", "", row.group("actual")).replace("~", "-"),
                    confidence=0.95,
                    source_text=source,
                )
            )
            duration = re.search(r"(\d+)\s*시간(?:\s*(\d+)\s*분)?", row.group("duration"))
            if duration:
                minutes = int(duration.group(1)) * 60 + int(duration.group(2) or 0)
                conditions.append(
                    ExtractedCondition(
                        type="actual_working_minutes",
                        value=minutes,
                        unit="minutes",
                        confidence=0.95,
                        source_text=source,
                    )
                )

        actual_time = re.search(
            r"(?:실제\s*)?(?:출퇴근|근무)\s*[:：]?\s*"
            r"([01]?\d|2[0-3])\s*[:시]\s*(\d{2})\s*"
            r"(?:~|\-|–|—)\s*"
            r"([01]?\d|2[0-3])\s*[:시]\s*(\d{2})",
            normalized,
        )
        if actual_time:
            start = f"{int(actual_time.group(1)):02d}:{actual_time.group(2)}"
            end = f"{int(actual_time.group(3)):02d}:{actual_time.group(4)}"
            conditions.append(
                _condition("working_hours", actual_time, f"{start}-{end}", None, 0.92)
            )

        actual_weekly_hours = re.search(
            r"(?:이번\s*주\s*)?(?:실제\s*)?근무\s*합계\s*[:：]?\s*"
            r"(\d+(?:\.\d+)?)\s*시간(?:\s*(\d+)\s*분)?",
            normalized,
        )
        if actual_weekly_hours:
            hours = float(actual_weekly_hours.group(1))
            minutes = int(actual_weekly_hours.group(2) or 0)
            conditions.append(
                _condition(
                    "weekly_working_hours",
                    actual_weekly_hours,
                    round(hours + minutes / 60, 2),
                    "hours_per_week",
                    0.94,
                )
            )

    if document_type == "bank_deposit":
        transactions = re.finditer(
            r"(?P<date>\d{1,4}[./-]\d{1,2}(?:[./-]\d{1,2})?\s+\d{1,2}:\d{2})\s*"
            r"입금\s+(?P<sender>[가-힣A-Za-z0-9()\s]{1,40}?)\s*"
            r"(?:\+|＋)\s*(?P<amount>\d{1,3}(?:,\d{3})+|\d+)\s*원",
            normalized,
        )
        for transaction in transactions:
            source = " ".join(transaction.group(0).split())
            conditions.extend(
                [
                    ExtractedCondition(
                        type="deposit_date",
                        value=transaction.group("date"),
                        confidence=0.95,
                        source_text=source,
                    ),
                    ExtractedCondition(
                        type="deposit_sender",
                        value=transaction.group("sender").strip(),
                        confidence=0.9,
                        source_text=source,
                    ),
                    ExtractedCondition(
                        type="deposit_amount",
                        value=int(transaction.group("amount").replace(",", "")),
                        unit="KRW",
                        confidence=0.96,
                        source_text=source,
                    ),
                ]
            )

    return conditions
