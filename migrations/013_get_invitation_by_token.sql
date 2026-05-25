-- Migration 013: get_invitation_by_token RPC
--
-- The accept-invite page needs to look up a pending_invitations row using
-- only the opaque token from the magic-link URL. The existing RLS policies
-- on pending_invitations restrict SELECT to OCAs of the org, which excludes
-- a brand-new invitee who has not yet been seated. They can't read their
-- own invitation.
--
-- The token is the credential here (32-byte url-safe random, unguessable),
-- so we expose a SECURITY DEFINER function that returns the invitation row
-- when called with a matching token. Anon and authenticated roles can call
-- it; the function bypasses RLS but only ever returns the single row whose
-- token argument matches. Listing all rows requires already knowing every
-- token, which is the intended security boundary.

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    org_id UUID,
    project_id UUID,
    role TEXT,
    discipline_scope_id UUID,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    project_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pi.id,
        pi.email,
        pi.org_id,
        pi.project_id,
        pi.role,
        pi.discipline_scope_id,
        pi.expires_at,
        pi.accepted_at,
        p.name AS project_name
    FROM pending_invitations pi
    LEFT JOIN projects p ON p.id = pi.project_id
    WHERE pi.token = p_token;
END;
$$;

ALTER FUNCTION get_invitation_by_token(TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION get_invitation_by_token IS
'Lookup a pending invitation by its opaque token. Bypasses RLS because the token IS the credential. Callable by anon and authenticated roles.';
