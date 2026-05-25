-- Migration 012: restore BYPASSRLS owner + search_path on handle_new_user.
--
-- Background: migration 005_fix_handle_new_user.sql fixed "Database error
-- saving new user" by setting `SET search_path = public` and `ALTER FUNCTION
-- handle_new_user() OWNER TO postgres` so the function runs as postgres
-- (which has BYPASSRLS) and resolves table names from public.
--
-- Migration 011_redeem_pending_invitations.sql redefined handle_new_user to
-- also call redeem_pending_invitations(), but silently dropped both
-- safeguards. Since CREATE OR REPLACE FUNCTION resets ownership to the
-- creating role and does not carry forward search_path config, signups
-- started failing again.
--
-- This migration restores both configurations on the version of
-- handle_new_user from migration 011 (which still has the redeem logic).

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    redemption_count INT;
BEGIN
    -- Insert the user into public.users
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );

    -- Redeem any pending invitations for this user
    SELECT redeem_pending_invitations(NEW.id, NEW.email) INTO redemption_count;

    IF redemption_count > 0 THEN
        RAISE NOTICE 'Redeemed % invitations for user %', redemption_count, NEW.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make the function owned by postgres so it runs with BYPASSRLS.
-- Without this, the RLS policy on public.users rejects the insert during
-- the auth signup transaction (when auth.uid() is still NULL).
ALTER FUNCTION handle_new_user() OWNER TO postgres;
