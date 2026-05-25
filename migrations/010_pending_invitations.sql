-- Create pending_invitations table for storing unredeemed invites
CREATE TABLE pending_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OCA', 'cx_engineer')),
    discipline_scope_id UUID REFERENCES discipline_scopes(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast redemption lookup
CREATE INDEX idx_pending_invitations_redemption ON pending_invitations(email, expires_at, accepted_at);

-- Enable RLS on pending_invitations
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_invitations

-- OCAs of the org can SELECT invitations for their org
CREATE POLICY "OCA can view org invitations" ON pending_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships 
            WHERE memberships.user_id = auth.uid() 
            AND memberships.org_id = pending_invitations.org_id
            AND memberships.role = 'OCA'
        )
    );

-- OCAs of the org can INSERT invitations for their org
CREATE POLICY "OCA can create org invitations" ON pending_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships 
            WHERE memberships.user_id = auth.uid() 
            AND memberships.org_id = pending_invitations.org_id
            AND memberships.role = 'OCA'
        )
    );