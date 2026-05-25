-- Migration: Create redeem_pending_invitations function
-- This function redeems all unexpired, unaccepted pending invitations for a given user email

-- Create the function to redeem pending invitations
CREATE OR REPLACE FUNCTION redeem_pending_invitations(
    target_user_id UUID,
    target_email TEXT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation RECORD;
    redeemed_count INT := 0;
BEGIN
    -- Loop through all unexpired, unaccepted invitations matching the email
    FOR invitation IN 
        SELECT * FROM pending_invitations
        WHERE email = target_email
          AND expires_at > NOW()
          AND accepted_at IS NULL
    LOOP
        -- Create membership (org-level access)
        INSERT INTO memberships (user_id, org_id, role, created_at)
        VALUES (target_user_id, invitation.org_id, invitation.role, NOW())
        ON CONFLICT (user_id, org_id) DO NOTHING;
        
        -- Create participation (project-level access)
        INSERT INTO participations (user_id, project_id, created_at)
        VALUES (target_user_id, invitation.project_id, NOW())
        ON CONFLICT (user_id, project_id) DO NOTHING;
        
        -- Create assignment (discipline-level access) if discipline_scope_id is provided
        IF invitation.discipline_scope_id IS NOT NULL THEN
            INSERT INTO assignments (user_id, discipline_scope_id, created_at)
            VALUES (target_user_id, invitation.discipline_scope_id, NOW())
            ON CONFLICT (user_id, discipline_scope_id) DO NOTHING;
        END IF;
        
        -- Mark the invitation as accepted
        UPDATE pending_invitations
        SET accepted_at = NOW()
        WHERE id = invitation.id;
        
        redeemed_count := redeemed_count + 1;
    END LOOP;
    
    RETURN redeemed_count;
END;
$$;

-- Grant execute permission to authenticated users (needed for handle_new_user trigger)
GRANT EXECUTE ON FUNCTION redeem_pending_invitations TO authenticated;

-- Update handle_new_user trigger to call redeem_pending_invitations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    redemption_count INT;
BEGIN
    -- Original logic: Insert the user into public.users
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    -- NEW: Redeem any pending invitations for this user
    SELECT redeem_pending_invitations(NEW.id, NEW.email) INTO redemption_count;
    
    -- Log redemption count for debugging (optional, can be removed in production)
    IF redemption_count > 0 THEN
        RAISE NOTICE 'Redeemed % invitations for user %', redemption_count, NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the function for documentation
COMMENT ON FUNCTION redeem_pending_invitations IS 'Redeems all unexpired, unaccepted pending invitations for a given user email, creating the necessary memberships, participations, and assignments';