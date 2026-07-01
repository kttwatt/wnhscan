-- Scan batches and pending queue (replaces localStorage persistence).

CREATE TABLE IF NOT EXISTS public.scan_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments (id),
  user_id uuid NOT NULL REFERENCES auth.users (id),
  mode text NOT NULL CHECK (mode = ANY (ARRAY['instant_scan'::text, 'queue_scan'::text])),
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scan_batches_department_saved_at_idx
  ON public.scan_batches (department_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS public.scan_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.scan_batches (id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  barcode text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  verified boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS scan_batch_items_batch_id_idx
  ON public.scan_batch_items (batch_id);

CREATE TABLE IF NOT EXISTS public.pending_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments (id),
  item_code text NOT NULL,
  item_name text NOT NULL,
  barcode text NOT NULL,
  item_group text NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity > 0),
  pending_since timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users (id),
  UNIQUE (department_id, item_code)
);

CREATE INDEX IF NOT EXISTS pending_queue_items_department_idx
  ON public.pending_queue_items (department_id, pending_since DESC);

ALTER TABLE public.scan_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_queue_items ENABLE ROW LEVEL SECURITY;

-- scan_batches
DROP POLICY IF EXISTS scan_batches_select ON public.scan_batches;
CREATE POLICY scan_batches_select ON public.scan_batches
  FOR SELECT TO authenticated
  USING (user_has_department(department_id));

DROP POLICY IF EXISTS scan_batches_insert ON public.scan_batches;
CREATE POLICY scan_batches_insert ON public.scan_batches
  FOR INSERT TO authenticated
  WITH CHECK (user_has_department(department_id) AND user_id = auth.uid());

-- scan_batch_items (via parent batch)
DROP POLICY IF EXISTS scan_batch_items_select ON public.scan_batch_items;
CREATE POLICY scan_batch_items_select ON public.scan_batch_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scan_batches b
      WHERE b.id = batch_id AND user_has_department(b.department_id)
    )
  );

DROP POLICY IF EXISTS scan_batch_items_insert ON public.scan_batch_items;
CREATE POLICY scan_batch_items_insert ON public.scan_batch_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scan_batches b
      WHERE b.id = batch_id
        AND user_has_department(b.department_id)
        AND b.user_id = auth.uid()
    )
  );

-- pending_queue_items
DROP POLICY IF EXISTS pending_queue_select ON public.pending_queue_items;
CREATE POLICY pending_queue_select ON public.pending_queue_items
  FOR SELECT TO authenticated
  USING (user_has_department(department_id));

DROP POLICY IF EXISTS pending_queue_insert ON public.pending_queue_items;
CREATE POLICY pending_queue_insert ON public.pending_queue_items
  FOR INSERT TO authenticated
  WITH CHECK (user_has_department(department_id));

DROP POLICY IF EXISTS pending_queue_update ON public.pending_queue_items;
CREATE POLICY pending_queue_update ON public.pending_queue_items
  FOR UPDATE TO authenticated
  USING (user_has_department(department_id))
  WITH CHECK (user_has_department(department_id));

DROP POLICY IF EXISTS pending_queue_delete ON public.pending_queue_items;
CREATE POLICY pending_queue_delete ON public.pending_queue_items
  FOR DELETE TO authenticated
  USING (user_has_department(department_id));
