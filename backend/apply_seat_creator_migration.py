#!/usr/bin/env python3

"""
Apply database migration 014 for seating project creator
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
    """Apply the seat project creator migration"""
    
    # Read migration file
    with open('../migrations/014_seat_project_creator.sql', 'r') as f:
        migration_sql = f.read()
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Applying migration 014_seat_project_creator...")
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("Migration applied successfully!")
        
        # Verify function was created
        cursor.execute("""
            SELECT proname, prokind, prosecdef 
            FROM pg_proc 
            WHERE proname = 'create_project_with_discipline'
        """)
        
        function_info = cursor.fetchone()
        if function_info:
            print(f"Function created: {function_info[0]}")
            print(f"Function kind: {function_info[1]}")
            print(f"Security definer: {function_info[2]}")
        else:
            print("WARNING: Function not found after migration")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()