import { generateText, stepCountIs } from 'ai'
import { model } from '@/lib/ai/groq'
import { createRiskDetectorConfig } from '@/lib/ai/presets/risk-detector'
import { createSupabaseServer } from '@/lib/db/supabase-server'

export const maxDuration = 60

export async function POST() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify HR role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'hr') {
    return Response.json(
      { error: 'Forbidden: HR role required' },
      { status: 403 }
    )
  }

  const config = createRiskDetectorConfig()

  try {
    const result = await generateText({
      model,
      system: config.systemPrompt,
      prompt:
        'Run a full risk analysis scan across all active onboarding journeys. For each journey, analyze task completion rates, chat sentiment, and activity levels. Calculate weighted risk scores, update them, and create alerts for any high-risk employees (score > 70). Provide a summary of your findings.',
      tools: config.tools,
      stopWhen: stepCountIs(5),
    })

    return Response.json({
      success: true,
      summary: result.text,
      scannedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Risk scan error:', error)
    return Response.json(
      { error: 'Risk scan failed', details: error.message },
      { status: 500 }
    )
  }
}
