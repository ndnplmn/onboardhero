export default function KeyContactsPage() {
  const contacts = [
    { name: 'Sarah Kim', role: 'HR Operations Manager', type: 'HR Support', bio: 'Expert in benefits, payroll, and company policy. Here to help with your transition.', email: 'sarah.kim@onboardhero.com', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { name: 'Liam Evans', role: 'Staff Product Manager', type: 'Direct Manager', bio: 'Leading the Core Platform team. Focused on scalable integration architecture.', email: 'liam.evans@onboardhero.com', avatar: 'https://i.pravatar.cc/150?u=liam' },
    { name: 'Marcus Reed', role: 'Senior Product Designer', type: 'Social Buddy', bio: 'Your go-to for design systems, office snacks, and local coffee spots!', email: 'marcus.reed@onboardhero.com', avatar: 'https://i.pravatar.cc/150?u=marcus' },
    { name: 'Priya Mehta', role: 'Senior Frontend Engineer', type: 'Technical Mentor', bio: 'Helping you navigate our React 19 and Next.js 16 stack. Ping me for PR reviews.', email: 'priya.mehta@onboardhero.com', avatar: 'https://i.pravatar.cc/150?u=priya' },
  ]

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Support Network</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Key Contacts</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            The people here to support your integration and growth.
          </p>
        </div>
      </header>

      <div className="db-row col2">
        {contacts.map((contact, idx) => (
          <div key={idx} className="db-card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
             <img src={contact.avatar} alt={contact.name} style={{ width: '80px', height: '80px', borderRadius: '16px', border: '1px solid var(--border)' }} />
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                   <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--cyan)', display: 'block', marginBottom: '4px' }}>{contact.type}</span>
                      <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{contact.name}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 600 }}>{contact.role}</p>
                   </div>
                   <button className="btn btn-ghost btn-sm" title="Send Email">
                      <i className="fa-solid fa-envelope"></i>
                   </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text3)', lineHeight: '1.5', marginBottom: '16px' }}>
                   {contact.bio}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <button className="btn btn-outline btn-sm">Schedule Meet</button>
                   <button className="btn btn-outline btn-sm">Slack DM</button>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="db-card" style={{ marginTop: '40px', padding: '24px', borderStyle: 'dashed', borderColor: 'var(--border)', background: 'transparent' }}>
         <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--blue)' }}>
               <i className="fa-solid fa-headset"></i>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Need more help?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>Our 24/7 Global IT & HR Helpdesk is always available for urgent requests.</p>
            <button className="btn btn-primary btn-sm">Open Support Ticket</button>
         </div>
      </div>
    </div>
  )
}
