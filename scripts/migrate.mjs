/**
 * OnboardHero — Apply Missing Migrations via Supabase Management API
 *
 * Usage:
 *   node scripts/migrate.mjs --token=YOUR_ACCESS_TOKEN
 *
 * Get your access token at:
 *   https://supabase.com/dashboard/account/tokens
 *
 * Alternatively, paste the contents of scripts/apply-migrations.sql
 * directly into the Supabase SQL Editor:
 *   https://supabase.com/dashboard/project/xtmxlwvxikhbhsuewbaw/sql
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const PROJECT_REF = 'xtmxlwvxikhbhsuewbaw'
const __dir = dirname(fileURLToPath(import.meta.url))

const token = process.argv.find(a => a.startsWith('--token='))?.split('=')[1]

if (!token) {
  console.error('\n❌ Missing --token flag\n')
  console.error('Usage: node scripts/migrate.mjs --token=YOUR_ACCESS_TOKEN')
  console.error('\nGet your access token at: https://supabase.com/dashboard/account/tokens')
  console.error('\nOr paste scripts/apply-migrations.sql into the Supabase SQL Editor:')
  console.error(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql\n`)
  process.exit(1)
}

const sql = readFileSync(join(__dir, 'apply-migrations.sql'), 'utf8')

console.log('\n🔧 Applying migrations via Supabase Management API...\n')

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
)

if (!response.ok) {
  const body = await response.text()
  console.error(`❌ API error (${response.status}): ${body}`)
  console.error('\nIf this fails, paste scripts/apply-migrations.sql in the SQL Editor:')
  console.error(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql\n`)
  process.exit(1)
}

const result = await response.json()
console.log('✅ Migrations applied successfully!')
console.log('\nNow run: node scripts/seed-demo.mjs\n')
