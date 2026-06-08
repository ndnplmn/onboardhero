import { loadSettings } from './actions'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function HRSettingsPage() {
  const savedSettings = await loadSettings()
  return <SettingsClient initialSettings={savedSettings} />
}
