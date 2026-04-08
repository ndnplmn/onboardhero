export default function CompanyWikiPage() {
  const categories = [
    { name: 'Culture & Values', icon: 'fa-heart', active: true },
    { name: 'Benefits & Perks', icon: 'fa-gift', active: false },
    { name: 'IT & Security', icon: 'fa-shield-halved', active: false },
    { name: 'Office Life', icon: 'fa-building-user', active: false },
    { name: 'Engineering Standards', icon: 'fa-code', active: false },
    { name: 'Product Roadmap', icon: 'fa-map-location-dot', active: false },
  ]

  const articles = [
    { title: 'The OnboardHero Mission', date: 'Updated 2 days ago', excerpt: 'Our goal is to make every new employee feel like a hero from day one...', category: 'Culture & Values' },
    { title: 'Bio-luminescent Design Principles', date: 'Updated 1 week ago', excerpt: 'How we use light and motion to create organic, living interfaces...', category: 'Engineering Standards' },
    { title: 'Remote-First Guidelines', date: 'Updated 1 month ago', excerpt: 'Best practices for asynchronous communication and distributed teamwork...', category: 'Culture & Values' },
    { title: 'Cybersecurity 101', date: 'Updated 3 days ago', excerpt: 'Essential security protocols for protecting company and client data...', category: 'IT & Security' },
  ]

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span className="sec-tag">Knowledge Hub</span>
            <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Company Wiki</h1>
            <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
              The definitive guide to everything at OnboardHero.
            </p>
          </div>
          <div style={{ width: '300px' }}>
             <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '13px' }}></i>
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px 10px 35px', fontSize: '13px', color: 'var(--text)' }} 
                />
             </div>
          </div>
        </div>
      </header>

      <div className="db-row col1-3">
        {/* Sidebar Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
           {categories.map((c, i) => (
             <div key={i} style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '12px', 
               padding: '12px 16px', 
               borderRadius: '12px', 
               background: c.active ? 'var(--blue-light)' : 'transparent',
               color: c.active ? 'var(--blue)' : 'var(--text2)',
               cursor: 'pointer',
               fontWeight: c.active ? 700 : 500,
               fontSize: '14px',
               border: c.active ? '1px solid var(--blue)' : '1px solid transparent'
             }}>
               <i className={`fa-solid ${c.icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
               {c.name}
             </div>
           ))}
        </div>

        {/* Content Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           {articles.map((a, i) => (
             <div key={i} className="db-card" style={{ padding: '24px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                   <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--cyan)' }}>{a.category}</span>
                   <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{a.date}</span>
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '12px', fontWeight: 800 }}>{a.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text3)', lineHeight: '1.6', marginBottom: '16px' }}>
                   {a.excerpt}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--blue)' }}>
                   Read Article <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }}></i>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
