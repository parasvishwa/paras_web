'use client';

import { LOCALES, useI18n } from '@/lib/i18n/I18nContext';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#8B7355] mb-1">
        {t('selectLanguage')}
      </p>
      <div className="flex gap-2 flex-wrap">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              locale === l.code
                ? 'bg-[#8B7355] text-white border-[#8B7355]'
                : 'bg-white text-[#5C4A2A] border-[#D4B896] hover:border-[#8B7355]'
            }`}
          >
            {l.nativeLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
