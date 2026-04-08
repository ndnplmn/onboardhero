const MOCK_FEEDBACK = [
  { id: 'f1', from: 'Marcus Reed', role: 'Senior Product Designer', date: 'Oct 12, 2026', content: 'The technical onboarding documentation is top-notch. I felt very supported by the IT team during the first week.', rating: 5, category: 'Technical' },
  { id: 'f2', from: 'Priya Mehta', role: 'Frontend Engineer', date: 'Oct 10, 2026', content: 'The social buddy system is great, but I think the Week 2 orientation could be a bit more focused on architecture.', rating: 4, category: 'Social' },
  { id: 'f3', from: 'Sarah Kim', role: 'HR Operations', date: 'Oct 05, 2026', content: 'The leadership simulation was incredibly helpful for understanding the company culture. Highly recommend it!', rating: 5, category: 'Culture' },
  { id: 'f4', from: 'James Wilson', role: 'Sales Account Exec', date: 'Sep 28, 2026', content: 'Final onboarding process was smooth. The integration radar provided clear visibility into my progress.', rating: 5, category: 'Process' },
]

export default function ManagerFeedbackPage() {
  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Sentiment Analysis</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Team Feedback</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Read and respond to feedback from your new hires to improve the onboarding experience.
          </p>
        </div>
      </header>

      <div className="db-row col3" style={{ marginBottom: '30px' }}>
         <div className="db-card">
            <div className="db-card-bd" style={{ textAlign: 'center', padding: '20px' }}>
               <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--font-display)' }}>4.8/5</div>
               <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Avg. Satisfaction Score</div>
            </div>
         </div>
         <div className="db-card">
            <div className="db-card-bd" style={{ textAlign: 'center', padding: '20px' }}>
               <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-display)' }}>92%</div>
               <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Positive Sentiment</div>
            </div>
         </div>
         <div className="db-card">
            <div className="db-card-bd" style={{ textAlign: 'center', padding: '20px' }}>
               <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--aqua)', fontFamily: 'var(--font-display)' }}>12</div>
               <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Responses this month</div>
            </div>
         </div>
      </div>

      <div className="db-row">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {MOCK_FEEDBACK.map(f => (
            <div key={f.id} className="db-card" style={{ padding: '24px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                     <img src={`https://i.pravatar.cc/150?u=${f.from}`} alt={f.from} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                     <div>
                        <strong style={{ display: 'block', fontSize: '15px' }}>{f.from}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{f.role} • {f.category}</span>
                     </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ display: 'flex', gap: '2px', color: 'var(--amber)', marginBottom: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                           <i key={i} className={`fa-solid fa-star ${i < f.rating ? '' : 'fa-regular'}`} style={{ fontSize: '12px' }}></i>
                        ))}
                     </div>
                     <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{f.date}</span>
                  </div>
               </div>
               <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '16px' }}>
                  "{f.content}"
               </p>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline btn-sm">Respond</button>
                  <button className="btn btn-ghost btn-sm">Flag for HR</button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
