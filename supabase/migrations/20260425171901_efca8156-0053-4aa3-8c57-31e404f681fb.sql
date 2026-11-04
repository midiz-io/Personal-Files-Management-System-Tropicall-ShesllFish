CREATE TYPE public.app_role AS ENUM ('admin', 'employee');
CREATE TYPE public.file_status AS ENUM ('draft','submitted','approved','rejected');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  photo_url TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile + employee role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Default employee role unless admin email
  IF NEW.email = 'admin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Employees personal file
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE,

  -- Basic
  full_name TEXT,
  nic TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Employment
  designation TEXT,
  department TEXT,
  branch TEXT,
  date_of_joining DATE,

  -- Documents
  photo_url TEXT,
  nic_copy_url TEXT,
  certificates_url TEXT,
  bank_passbook_url TEXT,
  gs_certificate_url TEXT,

  -- Bank / EPF
  bank_name TEXT,
  bank_account_no TEXT,
  bank_branch TEXT,
  epf_number TEXT,
  etf_number TEXT,

  -- Workflow
  status file_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  signature_url TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own record" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all employees" ON public.employees FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Employees insert own" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employees update own when not approved" ON public.employees FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status <> 'approved');
CREATE POLICY "Admins update employees" ON public.employees FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete employees" ON public.employees FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Invites
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  created_by UUID REFERENCES auth.users(id),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites select" ON public.invites FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage invites insert" ON public.invites FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage invites update" ON public.invites FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage invites delete" ON public.invites FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Public can validate a token (used during signup) via a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.validate_invite(_token TEXT)
RETURNS TABLE (valid BOOLEAN, invite_id UUID, email TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT (i.used_at IS NULL AND i.expires_at > now()) AS valid, i.id, i.email
  FROM public.invites i WHERE i.token = _token LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_invite(_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  SELECT id INTO _id FROM public.invites
   WHERE token = _token AND used_at IS NULL AND expires_at > now()
   FOR UPDATE;
  IF _id IS NULL THEN
    RETURN FALSE;
  END IF;
  UPDATE public.invites SET used_at = now(), used_by = auth.uid() WHERE id = _id;
  RETURN TRUE;
END;
$$;

-- Work sessions for live timer
CREATE TABLE public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON public.work_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all sessions" ON public.work_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own sessions" ON public.work_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.work_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Public verification function (returns minimal info only for approved employees)
CREATE OR REPLACE FUNCTION public.verify_employee(_employee_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  designation TEXT,
  employee_code TEXT,
  photo_url TEXT,
  registered_at TIMESTAMPTZ,
  status TEXT,
  signature_url TEXT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.id, e.full_name, e.designation, e.employee_code, e.photo_url,
         e.created_at AS registered_at, e.status::text, e.signature_url
  FROM public.employees e
  WHERE e.id = _employee_id AND e.status = 'approved'
$$;

GRANT EXECUTE ON FUNCTION public.verify_employee(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_invite(TEXT) TO authenticated;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('employee-docs','employee-docs', true),
  ('employee-photos','employee-photos', true),
  ('signatures','signatures', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read employee photos" ON storage.objects FOR SELECT USING (bucket_id IN ('employee-photos','employee-docs','signatures'));
CREATE POLICY "Authenticated upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('employee-photos','employee-docs','signatures'));
CREATE POLICY "Owner update objects" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner or admin delete objects" ON storage.objects FOR DELETE TO authenticated USING (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'));