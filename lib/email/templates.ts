const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.onboardhero.ai'

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OnboardHero</title>
</head>
<body style="margin:0;padding:0;background:#0D1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1117;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo / brand header -->
          <tr>
            <td style="padding-bottom:28px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#00C8E0,#1A6CF6);border-radius:12px;padding:10px 16px;display:inline-block;">
                    <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px;">⚡ OnboardHero</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#161B22;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#6E7681;">
                You're receiving this because you use OnboardHero.
              </p>
              <p style="margin:0;font-size:12px;color:#6E7681;">
                <a href="${APP_URL}/settings/notifications" style="color:#00C8E0;text-decoration:none;">Manage notifications</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/settings/notifications?unsubscribe=1" style="color:#6E7681;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

export function nudgeEmailTemplate({
  managerName,
  hireName,
  message,
  journeyId,
}: {
  managerName: string
  hireName: string
  message: string
  journeyId: string
}) {
  const content = `
    <div style="padding:32px 36px;">
      <!-- Alert badge -->
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:100px;padding:4px 12px;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:700;color:#F59E0B;letter-spacing:0.06em;text-transform:uppercase;">Action Needed</span>
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#E6EDF3;line-height:1.3;">
        Nudge for ${hireName}
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#8B949E;line-height:1.6;">
        Hi ${managerName}, Aura flagged ${hireName} as at-risk. We've prepared a suggested message below.
      </p>

      <!-- Message card -->
      <div style="background:#1C2333;border:1px solid rgba(255,255,255,0.06);border-left:4px solid #F59E0B;border-radius:8px;padding:18px 20px;margin-bottom:28px;">
        <p style="margin:0;font-size:14px;color:#C9D1D9;line-height:1.7;">${message}</p>
      </div>

      <!-- CTA button -->
      <a href="${APP_URL}/manager/dashboard?journey=${journeyId}"
         style="display:inline-block;background:linear-gradient(135deg,#00C8E0,#1A6CF6);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:0.01em;">
        View Journey &rarr;
      </a>
    </div>
  `
  return base(content)
}

export function managerWeeklyDigestTemplate({
  managerName,
  hires,
}: {
  managerName: string
  hires: {
    name:        string
    week:        number
    riskScore:   number
    taskPct:     number
    status:      string
  }[]
}) {
  const atRisk   = hires.filter(h => h.riskScore > 60)
  const onTrack  = hires.filter(h => h.riskScore <= 60 && h.status !== 'completed')
  const done     = hires.filter(h => h.status === 'completed')

  const hireRow  = (h: typeof hires[0]) => {
    const riskColor = h.riskScore > 60 ? '#EF4444' : h.riskScore > 30 ? '#F59E0B' : '#22C55E'
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#E6EDF3;font-weight:600;">${h.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8B949E;text-align:center;">Wk ${h.week}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8B949E;text-align:center;">${h.taskPct}% tasks</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;">
        <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;color:${riskColor};background:${riskColor}22;">Risk ${h.riskScore}</span>
      </td>
    </tr>`
  }

  const content = `
    <div style="padding:32px 36px;">
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,200,224,0.12);border:1px solid rgba(0,200,224,0.25);border-radius:100px;padding:4px 12px;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:700;color:#00C8E0;letter-spacing:0.06em;text-transform:uppercase;">Manager Digest</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#E6EDF3;line-height:1.3;">Your Team This Week</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#8B949E;line-height:1.6;">
        Hi ${managerName}, here's a snapshot of your ${hires.length} hire${hires.length !== 1 ? 's' : ''} this week.
      </p>

      ${atRisk.length > 0 ? `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#EF4444;text-transform:uppercase;letter-spacing:0.05em;">⚠ Action Required</p>
        <p style="margin:0;font-size:13px;color:#E6EDF3;line-height:1.5;">
          ${atRisk.map(h => `<strong>${h.name}</strong> (Week ${h.week}) needs a check-in — risk score ${h.riskScore}.`).join(' ')}
        </p>
      </div>` : ''}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <thead>
          <tr>
            <th style="padding:8px 0;font-size:10px;font-weight:700;color:#8B949E;text-transform:uppercase;letter-spacing:0.05em;text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);">Hire</th>
            <th style="padding:8px 0;font-size:10px;color:#8B949E;text-transform:uppercase;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">Stage</th>
            <th style="padding:8px 0;font-size:10px;color:#8B949E;text-transform:uppercase;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">Progress</th>
            <th style="padding:8px 0;font-size:10px;color:#8B949E;text-transform:uppercase;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1);">Risk</th>
          </tr>
        </thead>
        <tbody>${hires.map(hireRow).join('')}</tbody>
      </table>

      <p style="margin:0 0 20px;font-size:13px;color:#8B949E;">
        ${onTrack.length} on track · ${atRisk.length} need attention · ${done.length} completed
      </p>

      <a href="${APP_URL}/manager/hires"
         style="display:inline-block;background:linear-gradient(135deg,#00C8E0,#1A6CF6);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;">
        View My Hires &rarr;
      </a>
    </div>
  `
  return base(content)
}

export function weeklyDigestEmailTemplate({
  hrName,
  stats,
}: {
  hrName: string
  stats: {
    newJourneys: number
    milestonesReached: number
    atRiskCount: number
    avgCompletionRate: number
    activeJourneyCount: number
  }
}) {
  const riskColor = stats.atRiskCount > 0 ? '#EF4444' : '#22C55E'
  const riskBg    = stats.atRiskCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'

  const metricRow = (label: string, value: string, color = '#E6EDF3', bg = 'transparent') => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#8B949E;">${label}</td>
      <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;">
        <span style="display:inline-block;background:${bg};color:${color};font-size:14px;font-weight:700;padding:2px 10px;border-radius:6px;">${value}</span>
      </td>
    </tr>
  `

  const content = `
    <div style="padding:32px 36px;">
      <!-- Header -->
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,200,224,0.12);border:1px solid rgba(0,200,224,0.25);border-radius:100px;padding:4px 12px;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:700;color:#00C8E0;letter-spacing:0.06em;text-transform:uppercase;">Weekly Digest</span>
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#E6EDF3;line-height:1.3;">
        Onboarding Summary
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#8B949E;line-height:1.6;">
        Hi ${hrName}, here's what happened across your onboarding program this week.
      </p>

      <!-- Stats table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${metricRow('Active journeys', String(stats.activeJourneyCount), '#E6EDF3')}
        ${metricRow('New journeys started', String(stats.newJourneys), '#00C8E0', 'rgba(0,200,224,0.12)')}
        ${metricRow('Milestones reached', String(stats.milestonesReached), '#22C55E', 'rgba(34,197,94,0.12)')}
        ${metricRow('At-risk journeys', String(stats.atRiskCount), riskColor, riskBg)}
        ${metricRow('Avg. task completion', `${stats.avgCompletionRate}%`, '#E6EDF3')}
      </table>

      <!-- CTA -->
      <a href="${APP_URL}/hr/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#00C8E0,#1A6CF6);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;">
        View HR Dashboard &rarr;
      </a>
    </div>
  `
  return base(content)
}
