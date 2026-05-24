-- Fix "Database error saving new user" on signup.
-- The handle_new_user() trigger inserts into public.users during the auth signup
-- transaction, when auth.uid() is still NULL. The "Users can insert own profile"
-- RLS policy then rejects the insert. SECURITY DEFINER alone does not bypass RLS;
-- the owning role must have BYPASSRLS. In Supabase, postgres has BYPASSRLS.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER FUNCTION handle_new_user() OWNER TO postgres;
