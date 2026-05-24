#!/usr/bin/env python3

"""
Test RLS (Row Level Security) for documents and storage isolation
Verifies that users from different orgs cannot access each other's documents
"""

import psycopg2
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.local')

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

def create_test_users_and_orgs(cursor):
    """Create test users, orgs, and projects for isolation testing"""
    
    # Generate unique test suffix
    test_suffix = str(uuid.uuid4())[:8]
    
    # Create test users with unique IDs and emails
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    user_a_email = f'user_a_{test_suffix}@test.com'
    user_b_email = f'user_b_{test_suffix}@test.com'
    
    # Generate unique org slugs
    org_a_slug = f'test-org-a-{test_suffix}'
    org_b_slug = f'test-org-b-{test_suffix}'
    
    # Create orgs
    cursor.execute("""
        INSERT INTO orgs (id, name, slug) 
        VALUES (gen_random_uuid(), 'Test Org A', %s)
        RETURNING id
    """, (org_a_slug,))
    org_a_id = cursor.fetchone()[0]
    
    cursor.execute("""
        INSERT INTO orgs (id, name, slug) 
        VALUES (gen_random_uuid(), 'Test Org B', %s)
        RETURNING id
    """, (org_b_slug,))
    org_b_id = cursor.fetchone()[0]
    
    # Create auth.users entries first (required for foreign key)
    cursor.execute("""
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) 
        VALUES (%s, %s, 'dummy_password', now(), now(), now())
        ON CONFLICT (id) DO NOTHING
    """, (user_a_id, user_a_email))
    
    cursor.execute("""
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) 
        VALUES (%s, %s, 'dummy_password', now(), now(), now())
        ON CONFLICT (id) DO NOTHING
    """, (user_b_id, user_b_email))
    
    # Create users
    cursor.execute("""
        INSERT INTO users (id, email, full_name) 
        VALUES (%s, %s, 'User A')
    """, (user_a_id, user_a_email))
    
    cursor.execute("""
        INSERT INTO users (id, email, full_name) 
        VALUES (%s, %s, 'User B')
    """, (user_b_id, user_b_email))
    
    # Create memberships
    cursor.execute("""
        INSERT INTO memberships (user_id, org_id, role) 
        VALUES (%s, %s, 'OCA')
    """, (user_a_id, org_a_id))
    
    cursor.execute("""
        INSERT INTO memberships (user_id, org_id, role) 
        VALUES (%s, %s, 'OCA')
    """, (user_b_id, org_b_id))
    
    # Create projects
    cursor.execute("""
        INSERT INTO projects (id, org_id, name, description) 
        VALUES (gen_random_uuid(), %s, 'Project A', 'Test project for Org A')
        RETURNING id
    """, (org_a_id,))
    project_a_id = cursor.fetchone()[0]
    
    cursor.execute("""
        INSERT INTO projects (id, org_id, name, description) 
        VALUES (gen_random_uuid(), %s, 'Project B', 'Test project for Org B')
        RETURNING id
    """, (org_b_id,))
    project_b_id = cursor.fetchone()[0]
    
    # Create discipline scopes
    cursor.execute("""
        INSERT INTO discipline_scopes (project_id, name) 
        VALUES (%s, 'Mechanical')
    """, (project_a_id,))
    
    cursor.execute("""
        INSERT INTO discipline_scopes (project_id, name) 
        VALUES (%s, 'Mechanical')
    """, (project_b_id,))
    
    # Create participations
    cursor.execute("""
        INSERT INTO participations (user_id, project_id) 
        VALUES (%s, %s)
    """, (user_a_id, project_a_id))
    
    cursor.execute("""
        INSERT INTO participations (user_id, project_id) 
        VALUES (%s, %s)
    """, (user_b_id, project_b_id))
    
    return {
        'user_a': user_a_id,
        'user_b': user_b_id,
        'org_a': org_a_id,
        'org_b': org_b_id,
        'project_a': project_a_id,
        'project_b': project_b_id
    }

def set_user_context(cursor, user_id):
    """Set the current user context for RLS testing"""
    cursor.execute(f"SET LOCAL role postgres")
    cursor.execute(f"SET LOCAL request.jwt.claim.sub = '{user_id}'")

def test_document_isolation(cursor, test_data):
    """Test that documents are properly isolated between orgs"""
    
    print("\n--- Testing Document RLS Isolation ---")
    
    # Create document in Project A (as User A)
    set_user_context(cursor, test_data['user_a'])
    
    cursor.execute("""
        SELECT create_document_with_outbox(%s, 'test-doc-a.pdf', 'Test Document A.pdf', 1024000, 'application/pdf', 'projects/%s/documents/test-doc-a.pdf', %s)
    """, (test_data['project_a'], test_data['project_a'], test_data['user_a']))
    
    doc_a_id = cursor.fetchone()[0]
    print(f"✓ Created document in Project A: {doc_a_id}")
    
    # Create document in Project B (as User B)
    set_user_context(cursor, test_data['user_b'])
    
    cursor.execute("""
        SELECT create_document_with_outbox(%s, 'test-doc-b.pdf', 'Test Document B.pdf', 2048000, 'application/pdf', 'projects/%s/documents/test-doc-b.pdf', %s)
    """, (test_data['project_b'], test_data['project_b'], test_data['user_b']))
    
    doc_b_id = cursor.fetchone()[0]
    print(f"✓ Created document in Project B: {doc_b_id}")
    
    # Test User A can see their own document but not User B's
    set_user_context(cursor, test_data['user_a'])
    
    cursor.execute("SELECT id, filename FROM documents WHERE id = %s", (doc_a_id,))
    result = cursor.fetchone()
    if result:
        print("✓ User A can see their own document")
    else:
        print("✗ FAIL: User A cannot see their own document")
        return False
    
    cursor.execute("SELECT id, filename FROM documents WHERE id = %s", (doc_b_id,))
    result = cursor.fetchone()
    if result:
        print("✗ FAIL: User A can see User B's document - RLS VIOLATION!")
        return False
    else:
        print("✓ User A cannot see User B's document (correctly blocked)")
    
    # Test User B can see their own document but not User A's
    set_user_context(cursor, test_data['user_b'])
    
    cursor.execute("SELECT id, filename FROM documents WHERE id = %s", (doc_b_id,))
    result = cursor.fetchone()
    if result:
        print("✓ User B can see their own document")
    else:
        print("✗ FAIL: User B cannot see their own document")
        return False
    
    cursor.execute("SELECT id, filename FROM documents WHERE id = %s", (doc_a_id,))
    result = cursor.fetchone()
    if result:
        print("✗ FAIL: User B can see User A's document - RLS VIOLATION!")
        return False
    else:
        print("✓ User B cannot see User A's document (correctly blocked)")
    
    # Test listing documents shows only own org's documents
    set_user_context(cursor, test_data['user_a'])
    cursor.execute("SELECT COUNT(*) FROM documents")
    count_a = cursor.fetchone()[0]
    
    set_user_context(cursor, test_data['user_b'])
    cursor.execute("SELECT COUNT(*) FROM documents")
    count_b = cursor.fetchone()[0]
    
    if count_a == 1 and count_b == 1:
        print("✓ Each user sees exactly 1 document (their own)")
    else:
        print(f"✗ FAIL: User A sees {count_a} documents, User B sees {count_b} documents")
        return False
    
    return True

def test_outbox_events(cursor, test_data):
    """Test that outbox events were created correctly"""
    
    print("\n--- Testing Outbox Event Creation ---")
    
    # Check that document_uploaded events were created
    cursor.execute("""
        SELECT COUNT(*) FROM outbox WHERE event_type = 'document_uploaded'
    """)
    event_count = cursor.fetchone()[0]
    
    if event_count >= 2:
        print(f"✓ Found {event_count} document_uploaded events in outbox")
    else:
        print(f"✗ FAIL: Expected at least 2 document_uploaded events, found {event_count}")
        return False
    
    # Check event data structure
    cursor.execute("""
        SELECT event_data FROM outbox WHERE event_type = 'document_uploaded' LIMIT 1
    """)
    event_data = cursor.fetchone()[0]
    
    required_fields = ['document_id', 'project_id', 'filename', 'storage_path', 'uploaded_by', 'timestamp']
    for field in required_fields:
        if field not in event_data:
            print(f"✗ FAIL: Missing required field '{field}' in outbox event data")
            return False
    
    print("✓ Outbox event data contains all required fields")
    return True

def cleanup_test_data(cursor):
    """Clean up test data"""
    print("--- Cleaning up test data ---")
    
    try:
        # Clean up in reverse dependency order
        cursor.execute("DELETE FROM outbox WHERE event_type = 'document_uploaded'")
        cursor.execute("DELETE FROM documents WHERE filename LIKE 'test-doc-%'")
        cursor.execute("DELETE FROM assignments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')")
        cursor.execute("DELETE FROM participations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')")
        cursor.execute("DELETE FROM discipline_scopes WHERE project_id IN (SELECT id FROM projects WHERE name LIKE 'Project %')")
        cursor.execute("DELETE FROM projects WHERE name LIKE 'Project %'")
        cursor.execute("DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')")
        cursor.execute("DELETE FROM users WHERE email LIKE '%@test.com'")
        cursor.execute("DELETE FROM auth.users WHERE email LIKE '%@test.com'")
        cursor.execute("DELETE FROM orgs WHERE name LIKE 'Test Org %'")
        
        print("✓ Test data cleaned up")
    except Exception as e:
        print(f"Warning during cleanup: {e}")
        # Continue anyway

def run_rls_tests():
    """Run all RLS tests"""
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        print("Starting RLS isolation tests...")
        
        # Clean up any existing test data first
        cleanup_test_data(cursor)
        
        # Create test data
        test_data = create_test_users_and_orgs(cursor)
        print("✓ Test data created")
        
        # Run tests
        test_results = []
        
        test_results.append(test_document_isolation(cursor, test_data))
        test_results.append(test_outbox_events(cursor, test_data))
        
        # Clean up
        cleanup_test_data(cursor)
        
        # Report results
        passed_tests = sum(test_results)
        total_tests = len(test_results)
        
        print(f"\n--- TEST RESULTS ---")
        print(f"Passed: {passed_tests}/{total_tests}")
        
        if passed_tests == total_tests:
            print("✅ ALL TESTS PASSED - RLS is working correctly!")
            return True
        else:
            print("❌ SOME TESTS FAILED - RLS violations detected!")
            return False
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR running tests: {e}")
        return False

if __name__ == "__main__":
    success = run_rls_tests()
    exit(0 if success else 1)