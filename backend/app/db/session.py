"""Supabase 연결을 추가할 공통 모듈.

서비스 역할 키는 백엔드 환경변수에서만 읽고 프론트엔드에 전달하지 않는다.
"""
from supabase import create_client, Client
from app.core.config import get_settings

settings = get_settings()

# 프론트엔드에 노출되지 않는 안전한 백엔드 전용 Supabase 클라이언트
supabase: Client = create_client(
    supabase_url=settings.supabase_url,
    supabase_key=settings.supabase_service_role_key or settings.supabase_anon_key
)