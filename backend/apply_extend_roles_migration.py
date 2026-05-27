#!/usr/bin/env python3

"""
Apply database migration to extend membership roles to 6 canonical values
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
    """Apply the extend_membership_roles migration"""
    
    # Read migration file
    with open('../migrations/017_extend_membership_roles.sql', 'r') as f:
        migration_sql = f.read()
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Applying extend_membership_roles migration...")
        
        # Execute migration
        cursor.execute(migration_sql)
        
        print("Migration applied successfully!")
        
        # Verify memberships constraint was updated
        cursor.execute("""
            SELECT conname, pg_get_constraintdef(oid) AS constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'memberships'::regclass 
            AND conname = 'memberships_role_check'
        """)
        
        constraint = cursor.fetchone()
        if constraint:
            print(f"Updated memberships constraint: {constraint[0]}")
            print(f"  Definition: {constraint[1]}")
        
        # Verify pending_invitations constraint was updated  
        cursor.execute("""
            SELECT conname, pg_get_constraintdef(oid) AS constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'pending_invitations'::regclass 
            AND conname = 'pending_invitations_role_check'
        """)
        
        constraint = cursor.fetchone()
        if constraint:
            print(f"Updated pending_invitations constraint: {constraint[0]}")
            print(f"  Definition: {constraint[1]}")
        
        # Check existing data hasn't been affected
        cursor.execute("""
            SELECT COUNT(*) as count, role 
            FROM memberships 
            GROUP BY role
            ORDER BY role
        """)
        
        role_counts = cursor.fetchall()
        if role_counts:
            print("Existing membership roles preserved:")
            for count, role in role_counts:
                print(f"  {role}: {count} records")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()