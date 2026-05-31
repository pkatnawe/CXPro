#!/usr/bin/env python3

"""
Apply database migration for Commissioning Execution tables (US-014)
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
    """Apply the commissioning execution migration"""

    with open('../migrations/019_commissioning_execution.sql', 'r') as f:
        migration_sql = f.read()

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected to database successfully")
        print("Applying commissioning execution migration...")

        cursor.execute(migration_sql)

        print("Migration applied successfully!")

        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('test_procedure_templates', 'asset_type_template_links', 'test_procedure_instances')
            ORDER BY table_name
        """)

        tables = cursor.fetchall()
        print(f"Created tables: {[table[0] for table in tables]}")

        cursor.execute("""
            SELECT schemaname, tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename IN ('test_procedure_templates', 'asset_type_template_links', 'test_procedure_instances')
            ORDER BY tablename
        """)

        rls_status = cursor.fetchall()
        for schema, table, rls_enabled in rls_status:
            print(f"Table {table}: RLS {'enabled' if rls_enabled else 'disabled'}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"ERROR applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()
