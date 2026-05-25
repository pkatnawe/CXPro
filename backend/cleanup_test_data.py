#!/usr/bin/env python3
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv('../.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

async def cleanup():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("DELETE FROM pending_invitations WHERE email IN ('newuser@test.com', 'existing@test.com')")
        await conn.execute("DELETE FROM assignments WHERE user_id IN (SELECT id FROM users WHERE email IN ('oca@test.com', 'newuser@test.com', 'existing@test.com', 'non-oca@test.com'))")
        await conn.execute("DELETE FROM participations WHERE user_id IN (SELECT id FROM users WHERE email IN ('oca@test.com', 'newuser@test.com', 'existing@test.com', 'non-oca@test.com'))")
        await conn.execute("DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email IN ('oca@test.com', 'newuser@test.com', 'existing@test.com', 'non-oca@test.com'))")
        await conn.execute("DELETE FROM discipline_scopes WHERE project_id IN (SELECT id FROM projects WHERE org_id IN (SELECT id FROM orgs WHERE slug = 'test-org'))")
        await conn.execute("DELETE FROM projects WHERE org_id IN (SELECT id FROM orgs WHERE slug = 'test-org')")
        await conn.execute("DELETE FROM users WHERE email IN ('oca@test.com', 'newuser@test.com', 'existing@test.com', 'non-oca@test.com')")
        await conn.execute("DELETE FROM auth.users WHERE email IN ('oca@test.com', 'newuser@test.com', 'existing@test.com', 'non-oca@test.com')")
        await conn.execute("DELETE FROM orgs WHERE slug = 'test-org'")
        print("Cleanup complete")
    finally:
        await conn.close()

asyncio.run(cleanup())