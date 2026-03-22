import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OnboardHero — Structured Onboarding. Better Integration.',
  description: 'Guide every new hire from day 1 to day 90. OnboardHero gives HR teams, managers, and new recruits exactly what they need.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
