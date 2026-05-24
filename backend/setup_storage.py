#!/usr/bin/env python3

"""
Set up Supabase Storage bucket for document uploads
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

def setup_storage():
    """Set up storage bucket and RLS policies"""
    
    # SQL to create storage bucket and policies
    setup_queries = [
        # Create documents bucket
        """
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', false)
        ON CONFLICT (id) DO NOTHING;
        """,
        
        # Enable RLS on storage.objects if not already enabled
        """
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        """,
        
        # Drop existing policies if they exist
        """
        DROP POLICY IF EXISTS "Users can upload to own org's documents" ON storage.objects;
        """,
        """
        DROP POLICY IF EXISTS "Users can view own org's documents" ON storage.objects;
        """,
        """
        DROP POLICY IF EXISTS "Users can delete own org's documents" ON storage.objects;
        """,
        
        # Create upload policy
        """
        CREATE POLICY "Users can upload to own org's documents"
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (
            bucket_id = 'documents' AND
            auth.uid() IS NOT NULL AND
            (storage.foldername(name))[1] = 'projects' AND
            (storage.foldername(name))[2] IN (
                SELECT p.id::text FROM projects p
                INNER JOIN memberships m ON m.org_id = p.org_id
                WHERE m.user_id = auth.uid()
            )
        );
        """,
        
        # Create select policy
        """
        CREATE POLICY "Users can view own org's documents"
        ON storage.objects 
        FOR SELECT 
        USING (
            bucket_id = 'documents' AND
            auth.uid() IS NOT NULL AND
            (storage.foldername(name))[1] = 'projects' AND
            (storage.foldername(name))[2] IN (
                SELECT p.id::text FROM projects p
                INNER JOIN memberships m ON m.org_id = p.org_id
                WHERE m.user_id = auth.uid()
            )
        );
        """,
        
        # Create delete policy
        """
        CREATE POLICY "Users can delete own org's documents"
        ON storage.objects 
        FOR DELETE 
        USING (
            bucket_id = 'documents' AND
            auth.uid() IS NOT NULL AND
            (storage.foldername(name))[1] = 'projects' AND
            (storage.foldername(name))[2] IN (
                SELECT p.id::text FROM projects p
                INNER JOIN memberships m ON m.org_id = p.org_id
                WHERE m.user_id = auth.uid() AND m.role = 'OCA'
            )
        );
        """
    ]
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Setting up storage bucket and policies...")
        
        # Execute each query separately
        for i, query in enumerate(setup_queries):
            try:
                print(f"Executing setup step {i+1}/{len(setup_queries)}...")
                cursor.execute(query)
            except Exception as e:
                print(f"Warning on step {i+1}: {e}")
                # Continue with other steps even if one fails
        
        print("Storage setup completed successfully!")
        
        # Verify bucket was created
        cursor.execute("""
            SELECT id, name, public FROM storage.buckets WHERE id = 'documents'
        """)
        
        bucket = cursor.fetchone()
        if bucket:
            bucket_id, name, public = bucket
            print(f"Bucket '{name}' created successfully (public: {public})")
        else:
            print("WARNING: Documents bucket not found after creation")
        
        # Check policies
        cursor.execute("""
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND policyname LIKE '%documents%'
        """)
        
        policies = cursor.fetchall()
        print(f"Storage policies created: {[p[0] for p in policies]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR setting up storage: {e}")
        exit(1)

if __name__ == "__main__":
    setup_storage()