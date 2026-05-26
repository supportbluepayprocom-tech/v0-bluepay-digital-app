-- ============================================
-- BLUEPAY PRO V30 - Daily Reminder Email Cron Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up
-- automatic daily reminder emails at 8:00 AM UTC
-- ============================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 3: Remove existing job if it exists (for clean setup)
SELECT cron.unschedule('daily-reminder-email-job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-reminder-email-job'
);

-- Step 4: Create the daily cron job
-- This runs every day at 8:00 AM UTC
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with actual values

SELECT cron.schedule(
  'daily-reminder-email-job',           -- Unique job name
  '0 8 * * *',                          -- 8:00 AM UTC every day
  $$
  SELECT
    net.http_post(
      url := 'https://rykdsszbtjvnoycmialc.supabase.co/functions/v1/daily-reminder-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- ALTERNATIVE: If the above doesn't work with current_setting,
-- use this version with hardcoded service role key (less secure):
-- ============================================
/*
SELECT cron.schedule(
  'daily-reminder-email-job',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://rykdsszbtjvnoycmialc.supabase.co/functions/v1/daily-reminder-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check if the job was created
SELECT * FROM cron.job WHERE jobname = 'daily-reminder-email-job';

-- Check recent job executions (after some time)
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================
-- Management Commands
-- ============================================

-- To pause/disable the job:
-- UPDATE cron.job SET active = false WHERE jobname = 'daily-reminder-email-job';

-- To resume the job:
-- UPDATE cron.job SET active = true WHERE jobname = 'daily-reminder-email-job';

-- To completely remove the job:
-- SELECT cron.unschedule('daily-reminder-email-job');

-- To change the schedule (e.g., 9 AM instead of 8 AM):
-- First unschedule, then re-create with new time:
-- SELECT cron.unschedule('daily-reminder-email-job');
-- SELECT cron.schedule('daily-reminder-email-job', '0 9 * * *', $$ ... $$);
