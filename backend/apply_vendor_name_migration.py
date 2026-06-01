#!/usr/bin/env python3

"""
Apply database migration for asset vendor_name column (US-001)
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('../.env.local')

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

def apply_migration():
    """Apply the vendor_name migration"""

    with open('../migrations/020_asset_vendor_name.sql', 'r') as f:
        migration_sql = f.read()

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected to database successfully")
        print("Applying vendor_name migration...")

        cursor.execute(migration_sql)

        print("Migration applied successfully!")

        cursor.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'assets'
            AND column_name = 'vendor_name'
        """)

        columns = cursor.fetchall()
        if columns:
            print(f"Column verified: {columns[0][0]} ({columns[0][1]})")
        else:
            print("WARNING: vendor_name column not found after migration")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()
