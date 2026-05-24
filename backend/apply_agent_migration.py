"""Apply Slice-06 agent execution migration."""

import asyncio
import asyncpg
import os
from pathlib import Path


async def apply_migration():
    """Apply the agent execution migration."""
    # Load environment variables
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / ".env.local"
    load_dotenv(env_path)
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in environment")
        return False
        
    # Read migration file
    migration_path = Path(__file__).parent.parent / "migrations" / "005_agent_execution.sql"
    if not migration_path.exists():
        print(f"Error: Migration file not found at {migration_path}")
        return False
        
    migration_sql = migration_path.read_text()
    
    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)
        
        print("Applying Slice-06 agent execution migration...")
        
        # Execute migration
        await conn.execute(migration_sql)
        
        print("✅ Migration applied successfully")
        
        # Verify tables exist
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('agent_runs', 'test_procedure_instances', 'citations')
            ORDER BY table_name
        """)
        
        print("\nCreated tables:")
        for table in tables:
            print(f"  - {table['table_name']}")
            
        # Verify functions
        functions = await conn.fetch("""
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name IN ('create_test_procedure_with_citations', 'record_ai_refusal')
            ORDER BY routine_name
        """)
        
        print("\nCreated functions:")
        for func in functions:
            print(f"  - {func['routine_name']}")
            
        await conn.close()
        return True
        
    except Exception as e:
        print(f"Error applying migration: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(apply_migration())
    exit(0 if success else 1)