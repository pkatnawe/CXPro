#!/usr/bin/env python3

"""
Apply database migration for the pending_invitations send_count column and partial unique index
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
    """Apply the pending_invitations send_count migration"""
    
    # Read migration file
    with open('../migrations/017_pending_invitations_send_count.sql', 'r') as f:
        migration_sql = f.read()
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Applying pending_invitations send_count migration...")
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("Migration applied successfully!")
        
        # Verify send_count column was added
        cursor.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pending_invitations'
            AND column_name = 'send_count'
        """)
        
        column = cursor.fetchone()
        if column:
            print(f"Added column: {column[0]} (type: {column[1]}, default: {column[2]})")
        
        # Verify partial unique index was created
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'pending_invitations'
            AND indexname = 'idx_pending_invitations_unique_email_project'
        """)
        
        index = cursor.fetchone()
        if index:
            print(f"Created index: {index[0]}")
            print(f"Index definition: {index[1]}")
        
        # Count existing pending invitations that would be affected
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pending_invitations 
            WHERE accepted_at IS NULL
        """)
        
        pending_count = cursor.fetchone()
        if pending_count:
            print(f"Number of pending invitations in table: {pending_count[0]}")
        
        # Verify default send_count value on existing rows
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pending_invitations 
            WHERE send_count = 1
        """)
        
        default_count = cursor.fetchone()
        if default_count:
            print(f"Rows with send_count = 1 (default): {default_count[0]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()