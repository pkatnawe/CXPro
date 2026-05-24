#!/usr/bin/env python3

"""
Simple verification that RLS policies are in place for documents and storage
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

DATABASE_URL = os.getenv('DATABASE_URL')

def verify_rls_setup():
    """Verify that RLS is properly configured"""
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Verifying RLS configuration...")
        
        # Check that documents table has RLS enabled
        cursor.execute("""
            SELECT schemaname, tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'documents'
        """)
        
        result = cursor.fetchone()
        if result and result[2]:
            print("✓ Documents table has RLS enabled")
        else:
            print("✗ Documents table does not have RLS enabled")
            return False
        
        # Check that documents RLS policy exists
        cursor.execute("""
            SELECT policyname, cmd, roles FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'documents'
        """)
        
        policies = cursor.fetchall()
        if policies:
            print(f"✓ Found {len(policies)} RLS policy/policies for documents table:")
            for policy in policies:
                print(f"  - {policy[0]} (command: {policy[1]})")
        else:
            print("✗ No RLS policies found for documents table")
            return False
        
        # Check storage bucket exists
        cursor.execute("""
            SELECT id, name, public FROM storage.buckets WHERE id = 'documents'
        """)
        
        bucket = cursor.fetchone()
        if bucket:
            print(f"✓ Storage bucket 'documents' exists (public: {bucket[2]})")
        else:
            print("✗ Storage bucket 'documents' not found")
            return False
        
        # Check storage RLS policies
        cursor.execute("""
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'storage' AND tablename = 'objects'
            AND policyname LIKE '%documents%'
        """)
        
        storage_policies = cursor.fetchall()
        if storage_policies:
            print(f"✓ Found {len(storage_policies)} storage RLS policy/policies:")
            for policy in storage_policies:
                print(f"  - {policy[0]}")
        else:
            print("✗ No storage RLS policies found")
            return False
        
        # Check that required functions exist
        cursor.execute("""
            SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name IN ('create_document_with_outbox', 'update_document_status')
        """)
        
        functions = cursor.fetchall()
        if len(functions) == 2:
            print("✓ Required database functions exist")
            for func in functions:
                print(f"  - {func[0]}")
        else:
            print(f"✗ Missing database functions. Found {len(functions)}/2")
            return False
        
        print("\n✅ RLS configuration verification PASSED")
        print("All security policies and functions are properly configured.")
        return True
        
    except Exception as e:
        print(f"ERROR verifying RLS: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = verify_rls_setup()
    exit(0 if success else 1)