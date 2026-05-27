-- Migration: Extend memberships.role CHECK constraint to support 6 human role values
-- Description: Adds CM, field_technician, design_engineer, and owner_fm to the allowed role values
-- Author: Ralph Agent
-- Date: 2026-05-26

-- Drop the existing CHECK constraint on memberships.role
-- PostgreSQL requires dropping the existing constraint before adding a new one
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'memberships_role_check' 
        AND conrelid = 'memberships'::regclass
    ) THEN
        ALTER TABLE memberships DROP CONSTRAINT memberships_role_check;
    END IF;
END $$;

-- Add the new CHECK constraint with the extended role values
-- The 6 canonical human roles from docs/architecture.md:
-- - OCA: Owner's Commissioning Agent
-- - CM: Construction Manager  
-- - cx_engineer: Commissioning Engineer
-- - field_technician: Field Technician
-- - design_engineer: Design Engineer
-- - owner_fm: Owner/Facility Manager
ALTER TABLE memberships 
ADD CONSTRAINT memberships_role_check 
CHECK (role IN ('OCA', 'CM', 'cx_engineer', 'field_technician', 'design_engineer', 'owner_fm'));

-- Also update the pending_invitations table to accept the same 6 role values
DO $$
BEGIN
    -- Drop the old constraint on pending_invitations.role if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pending_invitations_role_check' 
        AND conrelid = 'pending_invitations'::regclass
    ) THEN
        ALTER TABLE pending_invitations DROP CONSTRAINT pending_invitations_role_check;
    END IF;
END $$;

-- Add the new CHECK constraint to pending_invitations with the extended role values
ALTER TABLE pending_invitations 
ADD CONSTRAINT pending_invitations_role_check 
CHECK (role IN ('OCA', 'CM', 'cx_engineer', 'field_technician', 'design_engineer', 'owner_fm'));

-- Verify the migration (no-op SELECT to confirm constraints are in place)
SELECT 
    'memberships.role constraint updated' AS status,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'memberships'::regclass 
AND conname = 'memberships_role_check'

UNION ALL

SELECT 
    'pending_invitations.role constraint updated' AS status,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'pending_invitations'::regclass 
AND conname = 'pending_invitations_role_check';