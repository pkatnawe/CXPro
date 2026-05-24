#!/usr/bin/env python3
"""Apply eval_runs migration to create tables for AI evaluation tracking."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env.local')

def apply_migration():
    """Apply the eval_runs migration."""
    
    # Get Supabase credentials
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url or not service_key:
        print("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        print("Make sure .env.local is properly configured")
        sys.exit(1)
    
    # Create Supabase client with service role key
    supabase: Client = create_client(url, service_key)
    
    # Read migration file
    migration_path = Path(__file__).parent.parent / 'migrations' / '009_eval_runs.sql'
    with open(migration_path, 'r') as f:
        migration_sql = f.read()
    
    try:
        # Execute migration
        print("🚀 Applying eval_runs migration...")
        result = supabase.rpc('exec_sql', {'query': migration_sql}).execute()
        print("✅ Migration applied successfully!")
        
        # Create initial baseline for main branch
        print("📊 Creating initial baseline metrics...")
        baseline_sql = """
        INSERT INTO baseline_metrics (
            branch_name,
            pass_rate,
            avg_citation_recall,
            avg_checklist_coverage,
            fixtures_total,
            run_id,
            git_commit,
            updated_at
        ) VALUES (
            'main',
            0.8,  -- Initial baseline 80% pass rate
            0.75, -- Initial baseline 75% citation recall
            0.75, -- Initial baseline 75% checklist coverage
            10,   -- 10 fixtures
            'initial',
            'baseline',
            NOW()
        ) ON CONFLICT (branch_name) DO NOTHING;
        """
        supabase.rpc('exec_sql', {'query': baseline_sql}).execute()
        print("✅ Initial baseline created!")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)