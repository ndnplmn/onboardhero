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
      { day: '26', mon: 'OCT', title: 'Month 1 Alignment Sync', time: '11:00 AM', contact: 'David Chen' }
    ],
    resources: [
      { id: 'res-feedback', title: 'Self-Reflection Framework', type: 'Notion', icon: 'fa-solid fa-lightbulb' }
    ],
    expectations: [
      'Complete your first independent task end-to-end',
      'Submit the Month 1 Employee Experience survey',
      'Finalize your OKRs for the remainder of the quarter'
    ]
  },
  month2: {
    label: 'Month 2',
    meetings: [
      { day: '15', mon: 'NOV', title: 'Cross-functional Collaboration', time: '3:30 PM', contact: 'Product Team' }
    ],
    resources: [
      { id: 'res-deep-dive', title: 'System Architecture Deep Dive', type: 'Technical Doc', icon: 'fa-solid fa-microchip' },
      { id: 'res-user', title: 'User Persona Research', type: 'Miro', icon: 'fa-solid fa-users' }
    ],
    expectations: [
      'Contribute to a major project feature',
      'Lead a team ritual (e.g., Standup or Retro)',
      'Shadow 1-on-1 customer interview sessions'
    ]
  },
  month3: {
    label: 'Month 3',
    meetings: [
      { day: '10', mon: 'DEC', title: 'Probation Milestone Review', time: '10:00 AM', contact: 'David Chen' },
      { day: '15', mon: 'DEC', title: 'Career Growth Planning', time: '4:00 PM', contact: 'Manager' }
    ],
    resources: [
      { id: 'res-growth', title: 'Leadership & Development Path', type: 'HR Portal', icon: 'fa-solid fa-arrow-trend-up' }
    ],
    expectations: [
      'Fully own a specific product area or process',
      'Present a proposal for a process improvement',
      'Mentor a newer hire or peer in a specific domain'
    ]
  }
}

export const MOCK_CONTACTS = [
  { name: 'Sarah Miller', role: 'Onboarding Buddy', dept: 'Operations', tag: 'Direct Help', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { name: 'David Chen', role: 'Direct Manager', dept: 'Engineering', tag: 'Reporting', avatar: 'https://i.pravatar.cc/150?u=david' },
  { name: 'Elena Rodriguez', role: 'HR Business Partner', dept: 'HR & People', tag: 'Support', avatar: 'https://i.pravatar.cc/150?u=elena' }
]
