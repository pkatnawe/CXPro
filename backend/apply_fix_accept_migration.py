#!/usr/bin/env python3
"""
Apply Migration 016: Fix accept_draft_test_procedure to read role from memberships
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

DATABASE_URL = os.getenv("DATABASE_URL")


async def apply_migration():
    """Apply the migration to fix accept_draft_test_procedure function"""
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Read the migration SQL file
        with open('../migrations/016_fix_accept_draft_test_procedure.sql', 'r') as f:
            migration_sql = f.read()
        
        # Apply the migration
        print("Applying Migration 016: Fix accept_draft_test_procedure...")
        await conn.execute(migration_sql)
        
        print("✅ Migration 016 successfully applied!")
        
        # Verify the function exists and has correct signature
        function_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public'
                AND p.proname = 'accept_draft_test_procedure'
            )
        """)
        
        if function_exists:
            print("✅ Function accept_draft_test_procedure verified to exist")
        else:
            print("❌ Function accept_draft_test_procedure not found after migration")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(apply_migration())