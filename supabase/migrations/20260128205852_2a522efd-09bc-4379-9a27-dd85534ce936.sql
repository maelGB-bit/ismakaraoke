-- Add new status value 'deleted_by_admin' to the coordinator_request_status enum
ALTER TYPE public.coordinator_request_status ADD VALUE IF NOT EXISTS 'deleted_by_admin';