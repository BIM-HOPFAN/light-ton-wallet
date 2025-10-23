-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to process NGNB swaps every minute
SELECT cron.schedule(
  'process-ngnb-swaps',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://iwnrzusyyfboidbhtgfd.supabase.co/functions/v1/ngnb-treasury',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"action": "process_swaps"}'::jsonb
    ) as request_id;
  $$
);