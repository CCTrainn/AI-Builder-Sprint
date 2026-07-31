"""Upstage Document Parse를 이용해 근로자료에서 텍스트를 추출한다."""

from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import ClassVar

import httpx

from app.core.config import get_settings

UPSTAGE_DOCUMENT_URL = "https://api.upstage.ai/v1/document-digitization"


class OCRServiceError(RuntimeError):
    """사용자에게 내부 응답을 노출하지 않는 OCR 공통 오류."""


class OCRConfigurationError(OCRServiceError):
    """OCR API 키가 설정되지 않았거나 유효하지 않을 때 발생한다."""


class OCRRequestError(OCRServiceError):
    """OCR 제공자가 요청을 처리하지 못했을 때 발생한다."""


@dataclass(frozen=True)
class OCRResult:
    text: str
    html: str
    model: str | None = None


class _PlainTextParser(HTMLParser):
    _BLOCK_TAGS: ClassVar[set[str]] = {
        "br",
        "div",
        "h1",
        "h2",
        "h3",
        "h4",
        "li",
        "p",
        "table",
        "td",
        "th",
        "tr",
    }

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in self._BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self._BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def get_text(self) -> str:
        lines = (" ".join(line.split()) for line in "".join(self.parts).splitlines())
        return "\n".join(line for line in lines if line)


def html_to_text(value: str) -> str:
    parser = _PlainTextParser()
    parser.feed(value)
    return parser.get_text()


def _safe_upload_name(filename: str, content_type: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in {".pdf", ".jpg", ".jpeg", ".png", ".webp"}:
        suffix = {
            "application/pdf": ".pdf",
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(content_type, ".pdf")
    return f"document{suffix}"


async def parse_document(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    client: httpx.AsyncClient | None = None,
) -> OCRResult:
    api_key = get_settings().upstage_api_key.strip()
    if not api_key:
        raise OCRConfigurationError("UPSTAGE_API_KEY가 설정되지 않았습니다.")

    owns_client = client is None
    request_client = client or httpx.AsyncClient(timeout=120)
    try:
        response = await request_client.post(
            UPSTAGE_DOCUMENT_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            files={
                "document": (
                    _safe_upload_name(filename, content_type),
                    file_bytes,
                    content_type,
                )
            },
            data={"ocr": "force", "model": "document-parse"},
        )
    except httpx.HTTPError as exc:
        raise OCRRequestError("OCR 서버에 연결하지 못했습니다.") from exc
    finally:
        if owns_client:
            await request_client.aclose()

    if response.status_code in {401, 403}:
        raise OCRConfigurationError("UPSTAGE_API_KEY가 유효하지 않습니다.")
    if response.is_error:
        raise OCRRequestError(f"OCR 처리에 실패했습니다. (HTTP {response.status_code})")

    try:
        payload = response.json()
        content = payload.get("content") or {}
        html = content.get("html") or ""
        text = content.get("text") or html_to_text(html)
    except (AttributeError, ValueError) as exc:
        raise OCRRequestError("OCR 응답 형식을 읽을 수 없습니다.") from exc

    if not text.strip():
        raise OCRRequestError("문서에서 읽을 수 있는 텍스트를 찾지 못했습니다.")

    return OCRResult(text=text.strip(), html=html, model=payload.get("model"))
