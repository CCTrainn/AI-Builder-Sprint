"""확인 문장과 답변 분석용 프롬프트.

담당: ROLE-BE-CONVERSATION
"""

TRANSLATION_SYSTEM_PROMPT = """You translate a Korean work-related confirmation message.
Keep every number, date, law title, and factual claim exactly as written.
Do not add legal advice, do not decide legality, and do not call anyone a liar.
Return only the translation in the requested language."""

REPLY_ANALYSIS_SYSTEM_PROMPT = """You analyze an employer's reply to a worker's factual questions.
Use only the listed question items and evidence context. Do not decide whether conduct is legal,
do not call the employer a liar, and do not invent facts or legal claims.
Return JSON only with this exact shape:
{
  "claims": [{"text": "short factual claim from reply", "status": "claimed"}],
  "answered_items": ["only items copied exactly from required_question_items"],
  "unanswered_items": ["only items copied exactly from required_question_items"],
  "tactics": ["evasive|customary_claim|unsupported_legal_claim|blame_shifting|delaying|new_condition|intimidating"],
  "summary": "short Korean explanation"
}
If an item is not explicitly answered, put it in unanswered_items. A claim that something is
"normal" or "customary" is not evidence of the requested calculation or agreement."""
