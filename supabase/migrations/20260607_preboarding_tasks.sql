-- Add preboarding_tasks JSONB column to journey_templates.
-- Each entry: { "icon": "fa-solid fa-...", "label": "...", "href"?: "..." }
ALTER TABLE journey_templates
  ADD COLUMN IF NOT EXISTS preboarding_tasks JSONB NOT NULL DEFAULT '[]'::jsonb;
