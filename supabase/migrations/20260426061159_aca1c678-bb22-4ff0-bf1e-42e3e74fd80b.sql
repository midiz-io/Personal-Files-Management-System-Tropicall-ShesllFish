
-- Shorten new invite expiry to 24 hours
ALTER TABLE public.invites
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '24 hours');

-- Service Letters table
CREATE TYPE public.letter_type AS ENUM ('final_service', 'recommendation');

CREATE TABLE public.service_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  letter_type public.letter_type NOT NULL,
  letter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recipient TEXT,
  recipient_address TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  positions JSONB DEFAULT '[]'::jsonb,
  joined_date DATE,
  last_day DATE,
  notice_until DATE,
  hr_manager_name TEXT DEFAULT 'D.K.N.Jayamanne',
  hr_manager_title TEXT DEFAULT 'Manager Human Resources',
  pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage letters select" ON public.service_letters FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage letters insert" ON public.service_letters FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage letters update" ON public.service_letters FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage letters delete" ON public.service_letters FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees view own letters" ON public.service_letters FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = service_letters.employee_id AND e.user_id = auth.uid()));

CREATE TRIGGER touch_service_letters BEFORE UPDATE ON public.service_letters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('service-letters', 'service-letters', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Service letters public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'service-letters');
CREATE POLICY "Admins upload service letters" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-letters' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update service letters" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-letters' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete service letters" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-letters' AND public.has_role(auth.uid(), 'admin'));
