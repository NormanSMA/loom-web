import { useEffect, useState } from 'react';
import { ArrowUpRight, Star, Volume2, VolumeX } from 'lucide-react';
import {
  COPY,
  DEFAULT_LANG,
  isLang,
  LANG_EVENT,
  LANG_STORAGE_KEY,
  LINKS,
  readStoredLang,
  type Lang,
} from '../data/content';
import {
  isLandingSoundEnabled,
  LANDING_SOUND_EVENT,
  toggleLandingSound,
} from '../scripts/sound';

export function Navbar() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const initial = readStoredLang();
    setLang(initial);
    setSoundOn(isLandingSoundEnabled());
    document.documentElement.lang = initial;

    const handleLangEvent = (event: Event) => {
      if (event instanceof CustomEvent && isLang(event.detail)) {
        setLang(event.detail);
      }
    };

    const handleSoundEvent = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === 'boolean') {
        setSoundOn(event.detail);
      }
    };

    window.addEventListener(LANG_EVENT, handleLangEvent);
    window.addEventListener(LANDING_SOUND_EVENT, handleSoundEvent);
    return () => {
      window.removeEventListener(LANG_EVENT, handleLangEvent);
      window.removeEventListener(LANDING_SOUND_EVENT, handleSoundEvent);
    };
  }, []);

  const toggleLang = () => {
    const next: Lang = lang === 'es' ? 'en' : 'es';
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures in restricted contexts.
    }
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent<Lang>(LANG_EVENT, { detail: next }));
  };

  const t = COPY[lang].navbar;

  return (
    <header className="fixed inset-x-3 top-3 z-40 mx-auto max-w-6xl rounded-2xl loom-glass-panel px-3 py-2 sm:px-4">
      <nav aria-label="Primary" className="flex items-center justify-between gap-2">
        <a
          href="#hero"
          aria-label={t.brand}
          className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-1.5 text-xs font-semibold tracking-[0.16em] text-[var(--text-primary)] transition-colors hover:text-[var(--accent-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] sm:text-sm"
        >
          <img src="/favicon.svg" alt="Loom" className="h-7 w-7 shrink-0 rounded-lg" />
          <span className="font-mono whitespace-nowrap">{t.brand}</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          <a
            href="#carret-section"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
          >
            {t.links.reel}
          </a>
          <a
            href="#estudio"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
          >
            {t.links.studio}
          </a>
          <a
            href="#enrutador"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
          >
            {t.links.router}
          </a>
          <a
            href="#descargar"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
          >
            {t.links.download}
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t.langToggleAria}
            aria-pressed={lang === 'en'}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 font-mono text-xs font-medium tracking-wider text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.98] sm:px-3"
          >
            <span className={lang === 'es' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
              ES
            </span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className={lang === 'en' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
              EN
            </span>
          </button>

          <button
            type="button"
            onClick={toggleLandingSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? t.soundOnAria : t.soundOffAria}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:bg-[var(--bg-glass-strong)] disabled:opacity-50 aria-pressed:text-[var(--text-primary)] motion-reduce:transition-none"
          >
            {soundOn ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
          </button>

          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic=""
            className="loom-magnetic inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-blue-soft)] px-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.98] sm:px-3.5 sm:text-sm"
          >
            <Star className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.githubCta}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
          </a>
        </div>
      </nav>
    </header>
  );
}
