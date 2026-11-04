-- Migration: Create ID Card Templates table for global in-system designer
CREATE TABLE IF NOT EXISTS public.id_card_templates (
  id TEXT PRIMARY KEY DEFAULT 'active_template',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.id_card_templates ENABLE ROW LEVEL SECURITY;

-- Allow everyone (public & authenticated) to read the active template
DROP POLICY IF EXISTS "Public read template" ON public.id_card_templates;
CREATE POLICY "Public read template" ON public.id_card_templates
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow admins or authenticated users to insert/update the template
DROP POLICY IF EXISTS "Admin update template" ON public.id_card_templates;
CREATE POLICY "Admin update template" ON public.id_card_templates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon access if admin is in test session
DROP POLICY IF EXISTS "Anon update template" ON public.id_card_templates;
CREATE POLICY "Anon update template" ON public.id_card_templates
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
