from fastapi import Header, HTTPException, Depends
from typing import Optional, Dict
import httpx
from app.core.config import settings


async def verify_supabase_token(authorization: str = Header(...)) -> Dict:
    """Verify JWT token from Supabase"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    # Verify with Supabase
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_ANON_KEY}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = response.json()
        return user_data


async def get_company_context(user_data: Dict = Depends(verify_supabase_token)) -> Dict:
    """Extract company_id and tenant context from user data"""
    # Get user metadata which should contain company_id
    user_metadata = user_data.get("user_metadata", {})
    company_id = user_metadata.get("company_id", user_data.get("id"))
    
    return {
        "user_id": user_data["id"],
        "company_id": company_id,
        "email": user_data.get("email", "")
    }


async def get_optional_company_context(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict]:
    """Get company context if authorization is provided, otherwise return None"""
    if not authorization:
        return None
    
    try:
        user_data = await verify_supabase_token(authorization)
        return await get_company_context(user_data)
    except HTTPException:
        return None

