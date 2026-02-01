-- Unique partial index: ensure only one active scan exists per business.
-- Prevents duplicate enqueues and enforces "skip if already active" at DB level.
-- Used by POST /api/business-scans/enqueue.

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_scans_one_active_per_business
  ON public.business_scans (business_id)
  WHERE status IN ('queued', 'processing');
