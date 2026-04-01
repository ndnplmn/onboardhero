export const MOCK_JOURNEY: Record<string, any> = {
  week1: {
    label: 'Week 1',
    meetings: [
      { day: '05', mon: 'OCT', title: 'Coffee with your Buddy', time: '10:00 AM', contact: 'Sarah Miller' },
      { day: '06', mon: 'OCT', title: 'Team Introduction', time: '11:30 AM', contact: 'David Chen' },
      { day: '08', mon: 'OCT', title: 'IT Setup Support', time: '2:00 PM', contact: 'Tech Team' }
    ],
    resources: [
      { id: 'res-welcome', title: 'Company Handbook 2024', type: 'PDF Document', icon: 'fa-solid fa-book-open' },
      { id: 'res-it', title: 'IT & Security Guidelines', type: 'SharePoint Link', icon: 'fa-solid fa-shiel-halved' },
      { id: 'res-values', title: 'Culture & Values Guide', type: 'Video Presentation', icon: 'fa-solid fa-play' }
    ],
    expectations: [
      'Complete all mandatory training modules',
      'Meet with your direct manager for 1:1',
      'Set up your development environment',
      'Introduce yourself in the #general Slack channel'
    ],
    equipment: [
      { icon: 'fa-solid fa-laptop', label: 'MacBook Pro 16"', status: 'done' },
      { icon: 'fa-solid fa-keyboard', label: 'Magic Keyboard & Mouse', status: 'done' },
      { icon: 'fa-solid fa-id-card', label: 'Office Access Badge', status: 'pending' },
      { icon: 'fa-solid fa-network-wired', label: 'Corporate VPN Access', status: 'pending' }
    ]
  },
  week2: {
    label: 'Week 2',
    meetings: [
      { day: '12', mon: 'OCT', title: 'Role Specific Sync', time: '9:30 AM', contact: 'David Chen' },
      { day: '14', mon: 'OCT', title: 'HR Benefits Overview', time: '3:00 PM', contact: 'Elena Rodriguez' }
    ],
    resources: [
      { id: 'res-product', title: 'Product Roadmap Q4', type: 'Miro Board', icon: 'fa-solid fa-map' },
      { id: 'res-tools', title: 'Internal Tooling Wiki', type: 'Confluence', icon: 'fa-solid fa-file-code' }
    ],
    expectations: [
      'Start your first sprint tasks',
      'Request access to all necessary repositories',
      'Shadow 2 customer discovery calls'
    ]
  },
  week3: {
    label: 'Week 3',
    meetings: [
      { day: '19', mon: 'OCT', title: 'Project Kickoff', time: '2:00 PM', contact: 'Alex Rivera' }
    ],
    resources: [
      { id: 'res-brand', title: 'Brand Identity Assets', type: 'Google Drive', icon: 'fa-solid fa-palette' }
    ],
    expectations: [
      'Deliver your first PR for review',
      'Participate in the bi-weekly town hall meeting'
    ]
  },
  week4: {
    label: 'Week 4',
    meetings: [
      { day: '26', mon: 'OCT', title: 'Month 1 Performance Review', time: '11:00 AM', contact: 'David Chen' }
    ],
    resources: [],
    expectations: [
      'Complete the Month 1 feedback survey',
      'Prepare your goals for the next quarter'
    ]
  },
  month2: {
    label: 'Month 2',
    meetings: [],
    resources: [],
    expectations: ['Take full ownership of your core functional area.']
  },
  month3: {
    label: 'Month 3',
    meetings: [],
    resources: [],
    expectations: ['Complete your final probation review.']
  }
}

export const MOCK_CONTACTS = [
  { name: 'Sarah Miller', role: 'Onboarding Buddy', dept: 'Operations', tag: 'Direct Help', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { name: 'David Chen', role: 'Direct Manager', dept: 'Engineering', tag: 'Reporting', avatar: 'https://i.pravatar.cc/150?u=david' },
  { name: 'Elena Rodriguez', role: 'HR Business Partner', dept: 'HR & People', tag: 'Support', avatar: 'https://i.pravatar.cc/150?u=elena' }
]
