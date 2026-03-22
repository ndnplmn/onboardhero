import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'

export const dynamic = 'force-dynamic'

export default async function ResourcesPage() {
  const user = await getUser()
  const { resources } = await getHireDashboardData(user.id)

  const iconMap: Record<string, string> = {
    document: 'fa-file-lines',
    video: 'fa-video',
    link: 'fa-link',
    contact: 'fa-user',
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>Resources</h1>
      {resources.length === 0 ? (
        <p style={{ color: 'var(--text3)' }}>No resources available yet.</p>
      ) : (
        <div className="hc-employees">
          {resources.map((r: any) => (
            <div key={r.id} className="hc-emp">
              <i className={`fa-solid ${iconMap[r.type] || 'fa-file'}`}
                 style={{ color: 'var(--cyan)', fontSize: '1.2rem', width: '26px', textAlign: 'center' }}></i>
              <div className="hce-info">
                <strong>{r.title}</strong>
                <span>{r.type} {r.ai_generated ? '· AI Generated' : ''}</span>
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                  Open <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
