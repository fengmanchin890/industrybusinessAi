"""
Tenant Management API
Handles company/tenant administration, user management, and usage analytics
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import httpx
from app.core.config import settings
from app.core.multi_tenant import get_company_context

router = APIRouter(prefix="/tenant", tags=["tenant"])


class CompanyInfo(BaseModel):
    id: str
    name: str
    subscription_tier: str
    industry: Optional[str] = None
    settings: Dict[str, Any] = {}
    created_at: datetime
    user_count: int
    module_count: int


class UserInvite(BaseModel):
    email: EmailStr
    role: str = "member"  # admin | member | viewer
    name: Optional[str] = None


class UserRole(BaseModel):
    role: str  # admin | member | viewer


class UsageStats(BaseModel):
    period: str  # 'day' | 'week' | 'month'
    api_requests: int
    ai_requests: int
    total_tokens: int
    total_cost_usd: float
    cache_hit_rate: float
    avg_latency_ms: float
    by_module: Dict[str, Any]
    by_model: Dict[str, Any]
    top_users: List[Dict[str, Any]]


@router.get("/info", response_model=CompanyInfo)
async def get_company_info(context: Dict = Depends(get_company_context)):
    """Get current company information and statistics"""
    try:
        async with httpx.AsyncClient() as client:
            # Get company details
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/companies",
                params={"id": f"eq.{context['company_id']}", "select": "*"},
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Company not found")
            
            companies = response.json()
            if not companies:
                raise HTTPException(status_code=404, detail="Company not found")
            
            company = companies[0]
            
            # Count users
            user_response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/user_companies",
                params={"company_id": f"eq.{context['company_id']}", "select": "count"},
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Prefer": "count=exact"
                },
                timeout=10.0
            )
            
            # Count installed modules
            module_response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/installed_modules",
                params={"company_id": f"eq.{context['company_id']}", "select": "count"},
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Prefer": "count=exact"
                },
                timeout=10.0
            )
            
            user_count = int(user_response.headers.get('Content-Range', '0-0/0').split('/')[-1])
            module_count = int(module_response.headers.get('Content-Range', '0-0/0').split('/')[-1])
            
            return CompanyInfo(
                id=company['id'],
                name=company['name'],
                subscription_tier=company.get('subscription_tier', 'free'),
                industry=company.get('industry'),
                settings=company.get('settings', {}),
                created_at=company['created_at'],
                user_count=user_count,
                module_count=module_count
            )
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch company info: {str(e)}")


@router.get("/users")
async def get_company_users(context: Dict = Depends(get_company_context)):
    """Get all users in the company"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/user_companies",
                params={
                    "company_id": f"eq.{context['company_id']}",
                    "select": "user_id,role,created_at,auth.users(email,raw_user_meta_data)"
                },
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch users")
            
            return {"users": response.json()}
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.post("/users/invite")
async def invite_user(
    invite: UserInvite,
    context: Dict = Depends(get_company_context)
):
    """Invite a new user to the company"""
    try:
        async with httpx.AsyncClient() as client:
            # Create user invitation
            # In production, this would send an email invitation
            # For now, we'll just create a pending invitation record
            
            response = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/user_invitations",
                json={
                    "company_id": context['company_id'],
                    "email": invite.email,
                    "role": invite.role,
                    "invited_by": context['user_id'],
                    "status": "pending"
                },
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                timeout=10.0
            )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(status_code=500, detail="Failed to create invitation")
            
            return {
                "success": True,
                "message": f"Invitation sent to {invite.email}",
                "invitation": response.json()
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to invite user: {str(e)}")


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: UserRole,
    context: Dict = Depends(get_company_context)
):
    """Update user's role in the company"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/user_companies",
                params={
                    "company_id": f"eq.{context['company_id']}",
                    "user_id": f"eq.{user_id}"
                },
                json={"role": role.role},
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to update user role")
            
            return {"success": True, "message": "User role updated"}
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user role: {str(e)}")


@router.delete("/users/{user_id}")
async def remove_user(
    user_id: str,
    context: Dict = Depends(get_company_context)
):
    """Remove user from company"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{settings.SUPABASE_URL}/rest/v1/user_companies",
                params={
                    "company_id": f"eq.{context['company_id']}",
                    "user_id": f"eq.{user_id}"
                },
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                },
                timeout=10.0
            )
            
            if response.status_code != 204:
                raise HTTPException(status_code=500, detail="Failed to remove user")
            
            return {"success": True, "message": "User removed from company"}
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove user: {str(e)}")


@router.get("/usage", response_model=UsageStats)
async def get_usage_statistics(
    period: str = "day",
    context: Dict = Depends(get_company_context)
):
    """Get company usage statistics for a given period"""
    try:
        # Calculate time range
        now = datetime.utcnow()
        if period == "day":
            start_time = now - timedelta(days=1)
        elif period == "week":
            start_time = now - timedelta(weeks=1)
        elif period == "month":
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(days=1)
        
        async with httpx.AsyncClient() as client:
            # Get API requests
            api_response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/api_requests",
                params={
                    "company_id": f"eq.{context['company_id']}",
                    "created_at": f"gte.{start_time.isoformat()}",
                    "select": "count"
                },
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Prefer": "count=exact"
                },
                timeout=10.0
            )
            
            api_requests = int(api_response.headers.get('Content-Range', '0-0/0').split('/')[-1])
            
            # Get AI usage logs
            ai_response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/ai_usage_logs",
                params={
                    "company_id": f"eq.{context['company_id']}",
                    "created_at": f"gte.{start_time.isoformat()}",
                    "select": "*"
                },
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                },
                timeout=10.0
            )
            
            ai_logs = ai_response.json()
            
            # Aggregate statistics
            total_tokens = sum(log.get('total_tokens', 0) for log in ai_logs)
            total_cost = sum(float(log.get('cost_usd', 0)) for log in ai_logs)
            cached_count = sum(1 for log in ai_logs if log.get('cached'))
            cache_hit_rate = cached_count / len(ai_logs) if ai_logs else 0
            avg_latency = sum(log.get('latency_ms', 0) for log in ai_logs) / len(ai_logs) if ai_logs else 0
            
            # Aggregate by model
            by_model: Dict[str, Any] = {}
            for log in ai_logs:
                model = log.get('model', 'unknown')
                if model not in by_model:
                    by_model[model] = {"count": 0, "tokens": 0, "cost": 0}
                by_model[model]["count"] += 1
                by_model[model]["tokens"] += log.get('total_tokens', 0)
                by_model[model]["cost"] += float(log.get('cost_usd', 0))
            
            # Aggregate by operation (module)
            by_module: Dict[str, Any] = {}
            for log in ai_logs:
                operation = log.get('operation', 'unknown')
                if operation not in by_module:
                    by_module[operation] = {"count": 0, "tokens": 0, "cost": 0}
                by_module[operation]["count"] += 1
                by_module[operation]["tokens"] += log.get('total_tokens', 0)
                by_module[operation]["cost"] += float(log.get('cost_usd', 0))
            
            # Top users
            user_usage: Dict[str, Any] = {}
            for log in ai_logs:
                user_id = log.get('user_id', 'unknown')
                if user_id not in user_usage:
                    user_usage[user_id] = {"user_id": user_id, "count": 0, "tokens": 0, "cost": 0}
                user_usage[user_id]["count"] += 1
                user_usage[user_id]["tokens"] += log.get('total_tokens', 0)
                user_usage[user_id]["cost"] += float(log.get('cost_usd', 0))
            
            top_users = sorted(user_usage.values(), key=lambda x: x['count'], reverse=True)[:10]
            
            return UsageStats(
                period=period,
                api_requests=api_requests,
                ai_requests=len(ai_logs),
                total_tokens=total_tokens,
                total_cost_usd=total_cost,
                cache_hit_rate=cache_hit_rate,
                avg_latency_ms=avg_latency,
                by_module=by_module,
                by_model=by_model,
                top_users=top_users
            )
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch usage stats: {str(e)}")


@router.patch("/settings")
async def update_company_settings(
    settings_update: Dict[str, Any],
    context: Dict = Depends(get_company_context)
):
    """Update company settings"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/companies",
                params={"id": f"eq.{context['company_id']}"},
                json={"settings": settings_update},
                headers={
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to update settings")
            
            return {
                "success": True,
                "message": "Settings updated",
                "settings": response.json()[0].get('settings', {})
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")



