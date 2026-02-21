-- Migration: Verification Queue for retry mechanism
-- This creates a queue table for background-processing verification tasks with retry support.

CREATE TABLE IF NOT EXISTS verification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  platform_url TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('initial', 'refresh', 'retry')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'exhausted')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_vq_status_next ON verification_queue(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_vq_profile_platform ON verification_queue(profile_id, platform);

-- Ensure only one active task per profile+platform (queued or processing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vq_active_task 
  ON verification_queue(profile_id, platform) 
  WHERE status IN ('queued', 'processing');
