#!/usr/bin/env python3

"""
Apply database migration for documents and outbox tables (Slice-03)
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
    """Apply the documents and outbox migration"""
    
    # Read migration file
    with open('../migrations/002_documents_outbox.sql', 'r') as f:
        migration_sql = f.read()
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Applying documents and outbox migration...")
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("Migration applied successfully!")
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('documents', 'outbox', 'outbox_dispatches')
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"Created tables: {[table[0] for table in tables]}")
        
        # Test RLS is enabled
        cursor.execute("""
            SELECT schemaname, tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('documents', 'outbox', 'outbox_dispatches')
            ORDER BY tablename
        """)
        
        rls_status = cursor.fetchall()
        for schema, table, rls_enabled in rls_status:
            print(f"Table {table}: RLS {'enabled' if rls_enabled else 'disabled'}")
        
        # Verify functions were created
        cursor.execute("""
            SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name IN ('create_document_with_outbox', 'update_document_status')
            ORDER BY routine_name
        """)
        
        functions = cursor.fetchall()
        print(f"Created functions: {[func[0] for func in functions]}")
        
        # Verify indexes were created
        cursor.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_documents_%' OR indexname LIKE 'idx_outbox_%'
            ORDER BY indexname
        """)
        
        indexes = cursor.fetchall()
        print(f"Created indexes: {[idx[0] for idx in indexes]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()