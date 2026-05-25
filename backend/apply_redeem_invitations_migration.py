#!/usr/bin/env python3

"""
Apply migration 011: Create redeem_pending_invitations function
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

def apply_migration():
    """Apply the redeem_pending_invitations migration"""
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return False
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("Applying migration 011_redeem_pending_invitations.sql...")
    
    # Read the migration file
    with open('../migrations/011_redeem_pending_invitations.sql', 'r') as f:
        migration_sql = f.read()
    
    try:
        # Execute the migration
        cursor.execute(migration_sql)
        print("✅ Migration applied successfully!")
        
        # Verify the function exists
        cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'redeem_pending_invitations'
        """)
        
        if cursor.fetchone():
            print("✅ redeem_pending_invitations function created")
        else:
            print("❌ redeem_pending_invitations function not found")
            return False
        
        # Verify handle_new_user was updated
        cursor.execute("""
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'handle_new_user'
        """)
        
        function_source = cursor.fetchone()
        if function_source and 'redeem_pending_invitations' in function_source[0]:
            print("✅ handle_new_user trigger updated to call redeem_pending_invitations")
        else:
            print("❌ handle_new_user trigger not updated properly")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    success = apply_migration()
    if success:
        print("\n🎉 Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
        exit(1)