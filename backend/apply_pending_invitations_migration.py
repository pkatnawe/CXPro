#!/usr/bin/env python3

"""
Apply database migration for the pending_invitations table
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

def apply_migration():
    """Apply the pending_invitations migration"""
    
    # Read migration file
    with open('../migrations/010_pending_invitations.sql', 'r') as f:
        migration_sql = f.read()
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Applying pending_invitations migration...")
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("Migration applied successfully!")
        
        # Verify table was created
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'pending_invitations'
        """)
        
        table = cursor.fetchone()
        if table:
            print(f"Created table: {table[0]}")
        
        # Verify index was created
        cursor.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'pending_invitations'
            AND indexname = 'idx_pending_invitations_redemption'
        """)
        
        index = cursor.fetchone()
        if index:
            print(f"Created index: {index[0]}")
        
        # Test RLS is enabled
        cursor.execute("""
            SELECT rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'pending_invitations'
        """)
        
        rls_status = cursor.fetchone()
        if rls_status:
            print(f"Table pending_invitations: RLS {'enabled' if rls_status[0] else 'disabled'}")
        
        # Verify unique constraint on token
        cursor.execute("""
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
            AND table_name = 'pending_invitations'
            AND constraint_type = 'UNIQUE'
        """)
        
        constraints = cursor.fetchall()
        if constraints:
            print(f"Unique constraints: {[c[0] for c in constraints]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()