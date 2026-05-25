# Backend Development Guide

## FastAPI Patterns

- All protected endpoints use `Depends(security)` with `HTTPBearer` for JWT authentication
- Request models use Pydantic `BaseModel` classes  
- JWT tokens are verified via `supabase.auth.get_user(token)`
- Current user ID is extracted from the verified JWT

## Supabase Integration

- Client initialization: `create_client(url, service_key)` using `DATABASE_SECRET` env var
- **Important**: Supabase Python client methods are synchronous, not async
- For new users: `supabase.auth.admin.invite_user_by_email()`
- For existing users: `supabase.auth.sign_in_with_otp()` with magic link

## Service Architecture

- Create service classes that accept supabase client and db connection in `__init__`
- Use `asyncpg` for direct database operations
- Services handle both business logic and auth/permission checks

## Testing

- Integration tests use `asyncpg` for async database operations
- Use unique test data identifiers to avoid conflicts (e.g., 'test-org-inv')
- Mock Supabase client with `MagicMock` (sync), database with `AsyncMock` (async)
- Clean up test data thoroughly in finally blocks

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_SECRET`: Supabase service role key (full access)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `FRONTEND_URL`: Frontend URL for redirects (default: http://localhost:3000)