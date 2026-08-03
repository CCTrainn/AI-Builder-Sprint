"""Supabase를 사용하지 않는 공동 경험 로컬 데모 서비스.

담당: ROLE-COMMUNITY-EXPERIENCE
"""

from collections import defaultdict

from app.schemas.community import (
    ExperienceCase,
    ExperienceGraphData,
    ExperienceMatchData,
    ExperienceMatchRequest,
    ExperienceOutcome,
    GraphEdge,
    GraphNode,
    SimilarExperience,
)

PROBLEM_LABELS = {
    "hourly_wage_difference": "계약 시급과 실제 시급 차이",
    "delayed_payment": "급여 지급 지연",
    "working_hours_changed": "근무시간 변경",
}

REPLY_LABELS = {
    "probation_claim": "수습기간이라 그래요",
    "customary_claim": "원래 다 그렇게 해요",
    "delay_promise": "다음 달에 줄게요",
    "schedule_changed": "바쁠 때는 더 일해야 해요",
    "evasive_reply": "나중에 이야기해요",
}

ACTION_LABELS = {
    "asked_probation_period": "수습 적용 기간 확인",
    "requested_wage_calculation": "시급 계산 근거 요청",
    "requested_payment_date": "정확한 지급일 요청",
    "shared_bank_record": "입금 기록 확인",
    "asked_schedule_in_writing": "근무시간 변경을 서면 확인",
    "compared_contract_hours": "계약 시간과 실제 시간 비교",
}

EVIDENCE_LABELS = {
    "employment_contract": "근로계약서",
    "payslip": "급여명세서",
    "bank_record": "입금 기록",
    "work_schedule": "근무표",
    "job_posting": "채용공고",
    "message": "고용주 대화",
}


def _case(
    number: int,
    problem_type: str,
    industry: str,
    evidence: list[str],
    replies: list[str],
    actions: list[str],
    outcome: ExperienceOutcome,
    summary: str,
    helpful: str,
    lesson: str,
) -> ExperienceCase:
    return ExperienceCase(
        experience_id=f"demo_exp_{number:02d}",
        problem_type=problem_type,
        problem_label=PROBLEM_LABELS[problem_type],
        industry_category=industry,
        region_bucket="지역 비공개",
        evidence_types=evidence,
        reply_patterns=replies,
        actions=actions,
        outcome=outcome,
        outcome_summary=summary,
        helpful_action=helpful,
        lesson=lesson,
    )


DEMO_EXPERIENCES = [
    _case(1, "hourly_wage_difference", "음식점", ["employment_contract", "payslip"], ["probation_claim"], ["asked_probation_period", "requested_wage_calculation"], ExperienceOutcome.PARTIALLY_RESOLVED, "계산표를 받았지만 차액 지급은 확인 중", "수습 기간과 계산 근거를 함께 질문함", "지급 약속과 실제 입금은 구분해야 함"),
    _case(2, "hourly_wage_difference", "카페", ["employment_contract", "bank_record"], ["customary_claim"], ["requested_wage_calculation"], ExperienceOutcome.RESOLVED, "계약 시급 기준으로 차액을 받음", "계약서의 시급을 근거로 계산표를 요청함", "감정적인 표현보다 기록의 숫자가 도움이 됨"),
    _case(3, "hourly_wage_difference", "편의점", ["job_posting", "payslip"], ["probation_claim"], ["asked_probation_period"], ExperienceOutcome.UNRESOLVED, "수습 조건 근거를 받지 못함", "채용공고와 급여명세서 차이를 먼저 정리함", "계약서가 없어 적용 조건 확인이 어려웠음"),
    _case(4, "hourly_wage_difference", "음식점", ["employment_contract", "payslip", "message"], ["evasive_reply"], ["requested_wage_calculation"], ExperienceOutcome.IN_PROGRESS, "계산 근거 답변을 기다리는 중", "질문을 서면으로 남김", "답변 기한을 함께 물어볼 필요가 있음"),
    _case(5, "delayed_payment", "물류", ["bank_record", "message"], ["delay_promise"], ["requested_payment_date", "shared_bank_record"], ExperienceOutcome.RESOLVED, "확정 지급일에 미지급액을 받음", "입금 기록과 정확한 지급일을 함께 확인함", "다음 달이라는 표현보다 날짜 확인이 중요했음"),
    _case(6, "delayed_payment", "음식점", ["payslip", "bank_record"], ["delay_promise"], ["requested_payment_date"], ExperienceOutcome.PARTIALLY_RESOLVED, "일부 금액만 지급됨", "받아야 할 금액과 지급된 금액을 나눠 질문함", "부분 지급 후 남은 금액을 다시 기록해야 함"),
    _case(7, "delayed_payment", "카페", ["employment_contract", "message"], ["evasive_reply"], ["requested_payment_date"], ExperienceOutcome.UNRESOLVED, "지급일 답변을 받지 못함", "대화를 계속 기록함", "입금 기록이 없어 지급 여부 설명이 약했음"),
    _case(8, "delayed_payment", "청소", ["bank_record", "message"], ["customary_claim"], ["shared_bank_record", "requested_payment_date"], ExperienceOutcome.IN_PROGRESS, "지급 계획을 다시 확인하는 중", "미입금 기간을 짧게 정리함", "여러 달 기록을 한 번에 정리할 필요가 있음"),
    _case(9, "working_hours_changed", "음식점", ["employment_contract", "work_schedule"], ["schedule_changed"], ["asked_schedule_in_writing", "compared_contract_hours"], ExperienceOutcome.PARTIALLY_RESOLVED, "다음 주 근무표부터 시간이 조정됨", "계약 시간과 변경 시간을 표로 비교함", "이전 초과 시간 정산은 별도로 확인해야 함"),
    _case(10, "working_hours_changed", "편의점", ["work_schedule", "message"], ["customary_claim"], ["asked_schedule_in_writing"], ExperienceOutcome.RESOLVED, "합의한 시간대로 근무표가 변경됨", "변경 동의 여부를 서면으로 답해 달라고 요청함", "구두 설명보다 변경된 근무표가 중요했음"),
    _case(11, "working_hours_changed", "물류", ["employment_contract", "work_schedule"], ["schedule_changed"], ["compared_contract_hours"], ExperienceOutcome.UNRESOLVED, "추가 근무가 계속됨", "실제 근무시간을 날짜별로 기록함", "고용주 답변 기록이 없어 대화 흐름이 끊겼음"),
    _case(12, "working_hours_changed", "카페", ["job_posting", "work_schedule", "message"], ["evasive_reply"], ["asked_schedule_in_writing"], ExperienceOutcome.IN_PROGRESS, "변경 이유와 기간 답변을 기다리는 중", "채용공고 시간과 현재 근무표를 함께 제시함", "변경 종료 시점을 반드시 물어봐야 함"),
    _case(13, "hourly_wage_difference", "제조", ["employment_contract", "payslip", "bank_record"], ["customary_claim"], ["requested_wage_calculation"], ExperienceOutcome.RESOLVED, "급여 계산표를 확인한 뒤 차액을 받음", "계약 시급과 입금액을 월별로 정리함", "월마다 같은 방식으로 기록을 남기는 것이 도움이 됐음"),
    _case(14, "delayed_payment", "숙박", ["employment_contract", "bank_record", "message"], ["delay_promise"], ["requested_payment_date", "shared_bank_record"], ExperienceOutcome.IN_PROGRESS, "두 차례 나누어 지급하겠다는 일정을 확인함", "미입금 금액과 지급 예정일을 한 문장으로 질문함", "지급 일정이 바뀔 때마다 새 날짜를 기록해야 함"),
    _case(15, "working_hours_changed", "농축산", ["job_posting", "work_schedule", "message"], ["schedule_changed"], ["asked_schedule_in_writing", "compared_contract_hours"], ExperienceOutcome.PARTIALLY_RESOLVED, "휴일 근무 횟수는 줄었고 이전 기록은 확인 중", "채용공고와 실제 근무표의 휴일을 비교함", "근무일뿐 아니라 쉬기로 한 날도 기록해야 함"),
]


def list_demo_experiences() -> list[ExperienceCase]:
    return [item.model_copy(deep=True) for item in DEMO_EXPERIENCES]


def get_experience(experience_id: str) -> ExperienceCase | None:
    return next(
        (item.model_copy(deep=True) for item in DEMO_EXPERIENCES if item.experience_id == experience_id),
        None,
    )


def _intersection_score(current: list[str], past: list[str], weight: int) -> tuple[int, bool]:
    matched = bool(set(current) & set(past))
    return (weight if matched else 0), matched


def match_experiences(request: ExperienceMatchRequest) -> ExperienceMatchData:
    matches: list[SimilarExperience] = []
    for experience in DEMO_EXPERIENCES:
        score = 0
        reasons: list[str] = []
        if experience.problem_type == request.problem_type:
            score += 40
            reasons.append("같은 문제 유형")
        reply_score, reply_match = _intersection_score(request.reply_patterns, experience.reply_patterns, 25)
        score += reply_score
        if reply_match:
            reasons.append("비슷한 고용주 답변")
        evidence_score, evidence_match = _intersection_score(request.evidence_types, experience.evidence_types, 15)
        score += evidence_score
        if evidence_match:
            reasons.append("같은 종류의 기록을 보유")
        if request.current_stage is not None and experience.outcome == request.current_stage:
            score += 10
            reasons.append("같은 진행 상태")
        if request.industry_category and experience.industry_category == request.industry_category:
            score += 5
            reasons.append("같은 업종 대분류")
        if score >= 40:
            matches.append(SimilarExperience(experience=experience, score=score, similarity_reasons=reasons))

    matches.sort(key=lambda item: (-item.score, item.experience.experience_id))
    return ExperienceMatchData(
        matches=matches[: request.limit],
        total_demo_experiences=len(DEMO_EXPERIENCES),
        notice="현재 결과는 실제 사용자가 아닌 완전히 가공된 시연용 경험입니다.",
    )


def build_experience_graph(center_problem_type: str | None = None) -> ExperienceGraphData:
    nodes: dict[str, GraphNode] = {}
    edges: dict[tuple[str, str, str], int] = defaultdict(int)

    def add_category(node_id: str, node_type: str, label: str) -> None:
        if node_id in nodes:
            nodes[node_id].count += 1
        else:
            nodes[node_id] = GraphNode(node_id=node_id, node_type=node_type, label=label)

    for experience in DEMO_EXPERIENCES:
        problem_id = f"problem:{experience.problem_type}"
        add_category(problem_id, "problem", experience.problem_label)
        experience_node_id = f"experience:{experience.experience_id}"
        nodes[experience_node_id] = GraphNode(
            node_id=experience_node_id,
            node_type="experience",
            label="익명 경험",
            experience_id=experience.experience_id,
            description=experience.outcome_summary,
        )
        edges[(problem_id, experience_node_id, "has_experience")] += 1

        for reply in experience.reply_patterns:
            reply_id = f"reply:{reply}"
            add_category(reply_id, "reply", REPLY_LABELS[reply])
            edges[(experience_node_id, reply_id, "received_reply")] += 1
        for action in experience.actions:
            action_id = f"action:{action}"
            add_category(action_id, "action", ACTION_LABELS[action])
            edges[(experience_node_id, action_id, "used_action")] += 1
        for evidence in experience.evidence_types:
            evidence_id = f"evidence:{evidence}"
            add_category(evidence_id, "evidence", EVIDENCE_LABELS[evidence])
            edges[(experience_node_id, evidence_id, "used_evidence")] += 1

    center = f"problem:{center_problem_type}" if center_problem_type in PROBLEM_LABELS else None
    return ExperienceGraphData(
        nodes=list(nodes.values()),
        edges=[GraphEdge(source=source, target=target, relation=relation, weight=weight) for (source, target, relation), weight in edges.items()],
        center_node_id=center,
        privacy_notice="그래프는 가공된 익명 경험만 사용하며 개인과 사업장 식별 정보를 포함하지 않습니다.",
    )
