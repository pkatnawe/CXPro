"""
Deep module: database client/connection factories.
Narrow public API for Supabase and asyncpg access.
"""

import os
import asyncpg
from supabase import create_client, Client


def get_supabase_client() -> Client:
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    supabase_key = os.getenv("DATABASE_SECRET", "")
    return create_client(supabase_url, supabase_key)


async def get_db_connection() -> asyncpg.Connection:
    database_url = os.getenv("DATABASE_URL")
    return await asyncpg.connect(database_url)
