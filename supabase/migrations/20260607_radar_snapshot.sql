-- Add radar_snapshot column to pulse_checks so IntegrationRadar history
-- is persisted per-user across devices instead of localStorage-only.
ALTER TABLE pulse_checks
  ADD COLUMN IF NOT EXISTS radar_snapshot JSONB;
-- radar_snapshot shape: [{ "label": "Social", "value": 72 }, ...]
