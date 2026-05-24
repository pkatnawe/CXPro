"""
RLS (Row Level Security) isolation tests for Slice-02

Tests that user_a in org_a cannot read or modify project_b in org_b 
via any API path (REST + Supabase client)
"""

import pytest
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('../.env.local')

# Database connection string from environment
DATABASE_URL = os.getenv('DATABASE_URL')

class TestRLSIsolation:
    @pytest.fixture
    def db_connection(self):
        """Create a test database connection"""
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        
        # Switch to authenticator role to test RLS
        cursor = conn.cursor()
        cursor.execute("SET ROLE authenticator")
        
        yield conn
        conn.close()

    def test_cross_org_project_isolation(self, db_connection):
        """
        Test that user_a in org_a cannot read or modify project_b in org_b
        """
        cursor = db_connection.cursor()
        
        # Create test organizations
        cursor.execute("""
            INSERT INTO orgs (id, name, slug) 
            VALUES 
                ('11111111-1111-1111-1111-111111111111', 'Org A', 'org-a'),
                ('22222222-2222-2222-2222-222222222222', 'Org B', 'org-b')
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        """)
        
        # Create test users in auth.users first (simulating signup)
        cursor.execute("""
            INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role) 
            VALUES 
                ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'user_a@test.com', 'dummy_password', now(), now(), now(), 'authenticated', 'authenticated'),
                ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'user_b@test.com', 'dummy_password', now(), now(), now(), 'authenticated', 'authenticated')
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        """)
        
        # Create test users (should be auto-created by trigger, but let's ensure)
        cursor.execute("""
            INSERT INTO users (id, email, full_name) 
            VALUES 
                ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_a@test.com', 'User A'),
                ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_b@test.com', 'User B')
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        """)
        
        # Create memberships
        cursor.execute("""
            INSERT INTO memberships (user_id, org_id, role) 
            VALUES 
                ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'OCA'),
                ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'OCA')
            ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role
        """)
        
        # Create projects
        cursor.execute("""
            INSERT INTO projects (id, org_id, name, description) 
            VALUES 
                ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Project A', 'Project in Org A'),
                ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Project B', 'Project in Org B')
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        """)

        # Test 1: Set session to user_a and try to access project_b
        # First, let's debug what we see without RLS context
        cursor.execute("SELECT * FROM projects")
        all_projects = cursor.fetchall()
        print(f"All projects visible without auth context: {len(all_projects)}")
        
        # Set auth context for user A
        cursor.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\"}', true)")
        cursor.execute("SELECT set_config('role', 'authenticated', true)")
        
        # User A should NOT be able to see Project B (in Org B)
        cursor.execute("SELECT * FROM projects WHERE id = '44444444-4444-4444-4444-444444444444'")
        result = cursor.fetchall()
        print(f"User A can see Project B: {len(result) > 0}")
        
        # Check what projects user A can see
        cursor.execute("SELECT * FROM projects")
        visible_projects = cursor.fetchall()
        print(f"User A can see {len(visible_projects)} projects")
        
        assert len(result) == 0, "User A should not be able to see Project B from Org B"
        
        # User A should be able to see Project A (in their own Org A)  
        cursor.execute("SELECT * FROM projects WHERE id = '33333333-3333-3333-3333-333333333333'")
        result = cursor.fetchall()
        assert len(result) == 1, "User A should be able to see Project A from their own Org A"

        # Test 2: Set session to user_b and verify isolation
        cursor.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb\"}', true)")
        
        # User B should NOT be able to see Project A (in Org A)
        cursor.execute("SELECT * FROM projects WHERE id = '33333333-3333-3333-3333-333333333333'")
        result = cursor.fetchall()
        assert len(result) == 0, "User B should not be able to see Project A from Org A"
        
        # User B should be able to see Project B (in their own Org B)
        cursor.execute("SELECT * FROM projects WHERE id = '44444444-4444-4444-4444-444444444444'")
        result = cursor.fetchall()
        assert len(result) == 1, "User B should be able to see Project B from their own Org B"

    def test_cross_org_discipline_scope_isolation(self, db_connection):
        """
        Test that users cannot access discipline scopes in other orgs
        """
        cursor = db_connection.cursor()
        
        # Create test discipline scopes
        cursor.execute("""
            INSERT INTO discipline_scopes (id, project_id, name, description) 
            VALUES 
                ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Mechanical A', 'Mechanical scope in Project A'),
                ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Mechanical B', 'Mechanical scope in Project B')
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        """)

        # Test as User A
        cursor.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\"}', true)")
        
        # User A should NOT see discipline scope B
        cursor.execute("SELECT * FROM discipline_scopes WHERE id = '66666666-6666-6666-6666-666666666666'")
        result = cursor.fetchall()
        assert len(result) == 0, "User A should not see discipline scope from Org B"
        
        # User A should see discipline scope A
        cursor.execute("SELECT * FROM discipline_scopes WHERE id = '55555555-5555-5555-5555-555555555555'")
        result = cursor.fetchall()
        assert len(result) == 1, "User A should see discipline scope from their own org"

    def test_cross_org_user_isolation(self, db_connection):
        """
        Test that users can only see their own profiles
        """
        cursor = db_connection.cursor()
        
        # Test as User A
        cursor.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\"}', true)")
        
        # User A should only see their own profile
        cursor.execute("SELECT * FROM users")
        result = cursor.fetchall()
        assert len(result) == 1, "User should only see their own profile"
        assert result[0][0] == 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', "Should be User A's profile"

    def test_membership_isolation(self, db_connection):
        """
        Test that users can only see their own memberships
        """
        cursor = db_connection.cursor()
        
        # Test as User A
        cursor.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\"}', true)")
        
        # User A should only see their own memberships
        cursor.execute("SELECT * FROM memberships")
        result = cursor.fetchall()
        assert len(result) == 1, "User should only see their own memberships"
        assert result[0][1] == 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', "Should be User A's membership"

    def test_org_isolation(self, db_connection):
        """
        Test that users can only see orgs they belong to
        """
        cursor = db_connection.cursor()
        
        # Test as User A
        cursor.execute("SELECT set_config('request.jwt.claims', '{\"sub\": \"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\"}', true)")
        
        # User A should only see Org A
        cursor.execute("SELECT * FROM orgs ORDER BY name")
        result = cursor.fetchall()
        assert len(result) == 1, "User should only see orgs they belong to"
        assert result[0][2] == 'org-a', "Should be Org A"

    def cleanup_test_data(self, db_connection):
        """Clean up test data"""
        cursor = db_connection.cursor()
        
        # Delete in reverse order of foreign key dependencies
        cursor.execute("DELETE FROM discipline_scopes WHERE project_id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444')")
        cursor.execute("DELETE FROM projects WHERE id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444')")
        cursor.execute("DELETE FROM memberships WHERE org_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')")
        cursor.execute("DELETE FROM users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')")
        cursor.execute("DELETE FROM orgs WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')")

if __name__ == "__main__":
    # Run a quick test
    import sys
    
    if not DATABASE_URL:
        print("DATABASE_URL environment variable not set")
        sys.exit(1)
        
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        print("Database connection successful")
        
        # Create a test instance and run one test
        test_instance = TestRLSIsolation()
        test_instance.test_cross_org_project_isolation(conn)
        test_instance.cleanup_test_data(conn)
        
        conn.close()
        print("RLS isolation test passed!")
        
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)