from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.db.session import supabase

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    try:
        # Supabase Auth 로그인 요청
        res = supabase.auth.sign_in_with_password({
            "email": req.email, 
            "password": req.password
        })
        # 성공 시 프론트엔드에 토큰과 유저 정보 전달
        return {
            "success": True, 
            "data": {
                "token": res.session.access_token, 
                "email": res.user.email
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인에 실패했습니다. 이메일이나 비밀번호를 확인해주세요."
        )