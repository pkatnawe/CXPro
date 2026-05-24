#!/usr/bin/env python3
"""
Apply the PDF ingestion migration for Slice-05.
Creates document_chunks and extracted_specs tables with pgvector support.
"""

import os
import psycopg2
from dotenv import load_dotenv

def apply_migration():
    # Load environment variables
    load_dotenv()
    
    # Database connection from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Read migration file
    migration_path = os.path.join(os.path.dirname(__file__), '..', 'migrations', '004_pdf_ingestion.sql')
    with open(migration_path, 'r') as f:
        migration_sql = f.read()
    
    # Apply migration
    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cur:
            print("Applying PDF ingestion migration...")
            cur.execute(migration_sql)
            conn.commit()
            print("Migration applied successfully!")
            
            # Verify tables were created
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('document_chunks', 'extracted_specs')
                ORDER BY table_name;
            """)
            
            tables = cur.fetchall()
            print(f"Created tables: {[t[0] for t in tables]}")
            
            # Verify pgvector extension
            cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
            vector_ext = cur.fetchone()
            if vector_ext:
                print("pgvector extension enabled successfully")
            else:
                print("WARNING: pgvector extension not found")

if __name__ == "__main__":
    apply_migration()