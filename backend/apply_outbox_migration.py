#!/usr/bin/env python3
"""
Apply outbox dispatcher migration - Slice-04 infrastructure setup
"""

import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def apply_migration():
    """Apply the outbox dispatcher migration"""
    
    # Get database connection string
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    print("Connecting to database...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("Reading migration file...")
        
        # Read the migration file
        migration_file = '../migrations/003_outbox_dispatcher.sql'
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        print("Applying migration...")
        
        # Execute the migration
        cur.execute(migration_sql)
        
        # Commit the transaction
        conn.commit()
        
        print("Migration applied successfully!")
        
        # Test the functions work
        print("Testing migration...")
        
        # Test get_unprocessed_outbox_events function
        cur.execute("SELECT COUNT(*) FROM get_unprocessed_outbox_events('test_subscriber', 10)")
        result = cur.fetchone()
        print(f"get_unprocessed_outbox_events function works: {result[0]} unprocessed events")
        
        # Test mark_event_dispatched function with real outbox event
        cur.execute("""
            INSERT INTO outbox (event_type, event_data) 
            VALUES ('test_event', '{}') 
            RETURNING id
        """)
        test_event_id = cur.fetchone()[0]
        
        cur.execute("SELECT mark_event_dispatched(%s, 'test_subscriber')", (test_event_id,))
        result = cur.fetchone()
        print(f"mark_event_dispatched function works: {result[0]}")
        
        # Cleanup test data
        cur.execute("DELETE FROM outbox_dispatches WHERE outbox_id = %s", (test_event_id,))
        cur.execute("DELETE FROM outbox WHERE id = %s", (test_event_id,))
        conn.commit()
        
        print("All tests passed!")
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    apply_migration()