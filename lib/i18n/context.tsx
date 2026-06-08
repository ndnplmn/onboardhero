'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en, { Translations } from './en'
import es from './es'

type Language = 'en' | 'es'

const DICTIONARIES: Record<Language, Translations> = { en, es }
const STORAGE_KEY = 'onboardhero_lang'

// Resolves nested keys like 'hr.dashboard.title' from the dictionary
function resolve(obj: any, path: string): string {
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path
    cur = cur[p]
  }
  return typeof cur === 'string' ? cur : path
}

interface LanguageContextValue {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved === 'en' || saved === 'es') setLangState(saved)
  }, [])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback((key: string) => resolve(DICTIONARIES[lang], key), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() {
  return useContext(LanguageContext)
}
