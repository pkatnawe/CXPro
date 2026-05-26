-- Add send_count column to pending_invitations table
-- This tracks how many times an invitation has been sent (for resend cap enforcement)
DO $$
BEGIN
    -- Add send_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pending_invitations' 
        AND column_name = 'send_count'
    ) THEN
        ALTER TABLE pending_invitations 
        ADD COLUMN send_count INT NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Create partial unique index to enforce one open invite per (email, project_id)
-- This prevents duplicate pending invitations while allowing multiple accepted invitations
DO $$
BEGIN
    -- Drop existing index if it exists (to be idempotent)
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_pending_invitations_unique_email_project'
    ) THEN
        DROP INDEX idx_pending_invitations_unique_email_project;
    END IF;
END $$;

-- Create the partial unique index
-- This ensures only one pending (non-accepted) invitation per email/project combination
CREATE UNIQUE INDEX idx_pending_invitations_unique_email_project 
ON pending_invitations(email, project_id) 
WHERE accepted_at IS NULL;