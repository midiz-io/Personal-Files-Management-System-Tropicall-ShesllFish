-- Migration: Enable anonymous public access for draft/rejected employees to fill details, and enable realtime updates

-- 1. Employees RLS policies for anonymous access
CREATE POLICY "Anonymous read employees" ON public.employees
  FOR SELECT TO anon
  USING (status IN ('draft'::public.file_status, 'rejected'::public.file_status));

CREATE POLICY "Anonymous update employees" ON public.employees
  FOR UPDATE TO anon
  USING (status IN ('draft'::public.file_status, 'rejected'::public.file_status))
  WITH CHECK (status IN ('draft'::public.file_status, 'submitted'::public.file_status));

-- 2. Storage objects RLS policies for anonymous uploads
CREATE POLICY "Anonymous upload photos" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (
    bucket_id IN ('employee-photos', 'employee-docs')
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.status IN ('draft'::public.file_status, 'rejected'::public.file_status)
    )
  );

CREATE POLICY "Anonymous update photos" ON storage.objects
  FOR UPDATE TO anon
  USING (
    bucket_id IN ('employee-photos', 'employee-docs')
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id::text = (storage.foldername(name))[1]
        AND e.status IN ('draft'::public.file_status, 'rejected'::public.file_status)
    )
  );

-- 3. Work sessions RLS policies for anonymous access (needed to start/stop the processing timer)
CREATE POLICY "Anonymous read sessions" ON public.work_sessions
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = work_sessions.employee_id
      AND e.status <> 'approved'::public.file_status
  ));

CREATE POLICY "Anonymous insert sessions" ON public.work_sessions
  FOR INSERT TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = work_sessions.employee_id
      AND e.status <> 'approved'::public.file_status
  ));

CREATE POLICY "Anonymous update sessions" ON public.work_sessions
  FOR UPDATE TO anon
  USING (EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = work_sessions.employee_id
      AND e.status <> 'approved'::public.file_status
  ));

-- 4. Enable realtime publication for employees table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    where pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;
END $$;
