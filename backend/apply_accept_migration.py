#!/usr/bin/env python3
"""
Apply migration 008_accept_draft.sql
"""

import asyncio
import asyncpg
import os
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cx_pro")


async def apply_migration():
    # Read migration file
    migration_path = Path(__file__).parent.parent / "migrations" / "008_accept_draft.sql"
    
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_path}")
        return False
    
    with open(migration_path, 'r') as f:
        migration_sql = f.read()
    
    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Apply migration
        print("Applying migration 008_accept_draft.sql...")
        await conn.execute(migration_sql)
        
        print("✅ Migration applied successfully!")
        
        # Verify functions exist
        functions = await conn.fetch("""
            SELECT proname 
            FROM pg_proc 
            WHERE proname IN ('accept_draft_test_procedure', 'record_feedback')
        """)
        
        print(f"✅ Functions created: {[f['proname'] for f in functions]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        return False
        
    finally:
        await conn.close()


if __name__ == "__main__":
    success = asyncio.run(apply_migration())
    exit(0 if success else 1)