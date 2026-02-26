'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import translations from '@/lib/translations';

const LangContext = createContext(null);

export function LangProvider({ children }) {
    const [lang, setLang] = useState('en');

    useEffect(() => {
        const saved = localStorage.getItem('ssst_lang');
        if (saved === 'hi' || saved === 'en') setLang(saved);
    }, []);

    const toggleLang = () => {
        const next = lang === 'en' ? 'hi' : 'en';
        setLang(next);
        localStorage.setItem('ssst_lang', next);
    };

    // Translation helper — t('key') returns the string in current language
    const t = (key, vars = {}) => {
        const str = translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
        // Simple variable substitution: t('showingResults', { count: 5 }) → 'Showing 5 results'
        return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
    };

    return (
        <LangContext.Provider value={{ lang, toggleLang, t }}>
            <div lang={lang === 'hi' ? 'hi' : 'en'}>
                {children}
            </div>
        </LangContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error('useLang must be used inside LangProvider');
    return ctx;
}
