import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, Terminal } from 'lucide-react';
import {
  COPY,
  DEFAULT_LANG,
  DOWNLOAD_MODE_IDS,
  DOWNLOAD_MODES,
  isLang,
  LANG_EVENT,
  LINKS,
  readStoredLang,
  type DownloadModeId,
  type Lang,
} from '../data/content';
import { playLandingSound } from '../scripts/sound';

export function DownloadPortal() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [modeId, setModeId] = useState<DownloadModeId>('desktop');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLang(readStoredLang());
    const handleLangEvent = (event: Event) => {
      if (event instanceof CustomEvent && isLang(event.detail)) {
        setLang(event.detail);
      }
    };
    window.addEventListener(LANG_EVENT, handleLangEvent);
    return () => {
      window.removeEventListener(LANG_EVENT, handleLangEvent);
    };
  }, []);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const t = COPY[lang].downloadPortal;
  const activeMode = DOWNLOAD_MODES[modeId];
  const snippet = activeMode.snippet[lang];

  const handleSelectMode = (nextMode: DownloadModeId) => {
    if (nextMode !== modeId) playLandingSound('click');
    setModeId(nextMode);
    setCopied(false);
  };

  const handleCopy = async () => {
    playLandingSound('chime', 'copy');
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="descargar"
      aria-labelledby="descargar-heading"
      className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6"
    >
      <div className="loom-glass-panel loom-spotlight relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="descargar-heading"
            className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl"
          >
            {t.headline}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <div
            role="tablist"
            aria-label={t.modeSelectorLabel}
            className="grid grid-cols-1 gap-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/80 p-1.5 sm:grid-cols-3"
          >
            {DOWNLOAD_MODE_IDS.map((id) => {
              const mode = DOWNLOAD_MODES[id];
              const isActive = id === modeId;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectMode(id)}
                  className={`min-h-11 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.99] ${
                    isActive
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border-strong)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mode.label[lang]}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            className="mt-4 overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                <Terminal className="h-3.5 w-3.5 shrink-0 text-[var(--accent-blue)]" aria-hidden="true" />
                <span className="truncate">{activeMode.filename}</span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 font-mono text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--accent-green)]" aria-hidden="true" />
                    <span>{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <p className="mb-3 text-xs text-[var(--text-muted)]">{activeMode.description[lang]}</p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[var(--text-primary)] sm:text-sm">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic=""
            className="loom-magnetic inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue)] px-6 text-sm font-semibold text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.98] sm:w-auto"
          >
            <span>{t.primaryCta}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>

          <a
            href={LINKS.desktopActions}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.98] sm:w-auto"
          >
            <Download className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
            <span>{t.secondaryCta}</span>
          </a>
        </div>

        <p className="mt-6 text-center font-mono text-xs tracking-wider text-[var(--text-muted)]">
          {t.stackBadge}
        </p>
      </div>
    </section>
  );
}
