import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { playLandingSound } from '../scripts/sound';

type Lang = 'es' | 'en';
type IslandState = 'thinking' | 'reading' | 'analysing' | 'debugging';

interface FrameCopy {
  readonly title: string;
  readonly subtitle: string;
}

interface OrbitalNode {
  readonly id: string;
  readonly name: string;
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly ring: 'inner' | 'outer';
  readonly accent: string;
}

const ORBITAL_NODES: readonly OrbitalNode[] = [
  { id: 'claude', name: 'Claude', src: '/brands/claude.svg', x: 50, y: 15, ring: 'outer', accent: '#f59e0b' },
  { id: 'codex', name: 'Codex', src: '/brands/codex.svg', x: 80, y: 29, ring: 'outer', accent: '#22c55e' },
  { id: 'gemini', name: 'Gemini', src: '/brands/gemini.svg', x: 84, y: 66, ring: 'outer', accent: '#3b82f6' },
  { id: 'antigravity', name: 'Antigravity', src: '/brands/antigravity.svg', x: 58, y: 86, ring: 'outer', accent: '#60a5fa' },
  { id: 'opencode', name: 'OpenCode', src: '/brands/opencode.svg', x: 22, y: 80, ring: 'outer', accent: '#a1a1aa' },
  { id: 'omniroute', name: 'OmniRoute', src: '/brands/omniroute.svg', x: 15, y: 45, ring: 'outer', accent: '#3b82f6' },
  { id: 'claudehub', name: 'ClaudeHub', src: '/brands/claudehub.png', x: 31, y: 22, ring: 'inner', accent: '#22c55e' },
];

const WORKTREE_LANES = [
  { branch: '.loom/worktrees/core-daemon', gate: 'fmt + clippy', status: 'PASS', y: 44, color: '#3b82f6' },
  { branch: '.loom/worktrees/privacy-gate', gate: '42 tests', status: 'PASS', y: 96, color: '#22c55e' },
  { branch: '.loom/worktrees/tauri-island', gate: '0 warnings', status: 'LIVE', y: 148, color: '#60a5fa' },
] as const;

const EQUALIZER_BARS: readonly number[] = [3, 5, 4, 6, 7, 5, 6, 4, 7, 6, 5, 7, 4, 6];
const EQUALIZER_ROWS = [6, 5, 4, 3, 2, 1, 0] as const;
const RING_DOTS = Array.from({ length: 24 }, (_, idx) => idx);

const ISLAND_PILLS: Record<IslandState, { es: string; en: string; dotClass: string; activeCells: readonly number[] }> = {
  thinking: {
    es: 'Pensando...',
    en: 'Thinking...',
    dotClass: 'bg-[var(--accent-green)]',
    activeCells: [0, 2, 4, 6, 8],
  },
  reading: {
    es: 'Leyendo docs',
    en: 'Reading docs',
    dotClass: 'bg-[var(--accent-red)]',
    activeCells: [1, 3, 4, 5, 7],
  },
  analysing: {
    es: 'Analizando',
    en: 'Analysing',
    dotClass: 'bg-[var(--accent-blue)]',
    activeCells: [0, 1, 2, 3, 5, 6, 7, 8],
  },
  debugging: {
    es: 'Depurando',
    en: 'Debugging',
    dotClass: 'bg-[var(--accent-amber)]',
    activeCells: [0, 4, 8, 2, 6],
  },
};

const COPY: Record<
  Lang,
  {
    headline: string;
    frames: readonly [FrameCopy, FrameCopy, FrameCopy, FrameCopy, FrameCopy];
    worktreeBadge: string;
    worktreeSummary: string;
    orbitCenter: string;
    orbitCaption: string;
    privacyBlocked: string;
    privacyTarget: string;
    privacyShield: string;
    telemetryCol: string;
    telemetryRing: string;
    telemetryGates: string;
    islandShortcut: string;
    islandCaption: string;
  }
> = {
  es: {
    headline: 'Cinco fotogramas de orquestación local sin fricción.',
    frames: [
      {
        title: 'Rieles paralelos por worktree',
        subtitle: 'Cada agente trabaja aislado y cruza compuertas antes de integrar.',
      },
      {
        title: 'Malla multi-modelo sincronizada',
        subtitle: 'Enrutamiento activo entre proveedores locales y remotos.',
      },
      {
        title: 'Circuito ciego de secretos',
        subtitle: 'Bloqueo estricto de rutas sensibles y cabeceras no loopback.',
      },
      {
        title: 'Telemetría matriz de puntos',
        subtitle: 'Pulso de carga por agente y anillo de salud en tiempo real.',
      },
      {
        title: 'Isla flotante de escritorio',
        subtitle: 'Notch superior con estado vivo y atajo global de bandeja.',
      },
    ],
    worktreeBadge: '42 tests · 0 warnings',
    worktreeSummary: 'Aislamiento Git verificable',
    orbitCenter: 'LOOM',
    orbitCaption: '7 adaptadores activos sobre bus local',
    privacyBlocked: 'BLOQUEADO EN PROVEEDORES GRATUITOS',
    privacyTarget: 'Bus loopback verificado',
    privacyShield: 'Filtro .env / .pem / .key activo',
    telemetryCol: 'COL',
    telemetryRing: 'GATES',
    telemetryGates: '100%',
    islandShortcut: 'Ctrl+Shift+L · Bandeja Tauri v2',
    islandCaption: 'Selecciona un estado para simular el notch',
  },
  en: {
    headline: 'Five frames of frictionless local orchestration.',
    frames: [
      {
        title: 'Parallel worktree rails',
        subtitle: 'Every agent runs isolated and clears quality gates before merge.',
      },
      {
        title: 'Synchronized multi-agent mesh',
        subtitle: 'Live routing across local binaries and model providers.',
      },
      {
        title: 'Zero-leak secret circuit',
        subtitle: 'Strict blocking for sensitive paths and non-loopback hosts.',
      },
      {
        title: 'Dot-matrix live telemetry',
        subtitle: 'Per-agent pulse equalizer and concentric gate health ring.',
      },
      {
        title: 'Frameless desktop island',
        subtitle: 'Top-notch live state indicator with global tray shortcut.',
      },
    ],
    worktreeBadge: '42 tests · 0 warnings',
    worktreeSummary: 'Verifiable Git isolation',
    orbitCenter: 'LOOM',
    orbitCaption: '7 active adapters on local bus',
    privacyBlocked: 'BLOCKED ON FREE TIER PROVIDERS',
    privacyTarget: 'Verified loopback bus',
    privacyShield: 'Active .env / .pem / .key shield',
    telemetryCol: 'COL',
    telemetryRing: 'GATES',
    telemetryGates: '100%',
    islandShortcut: 'Ctrl+Shift+L · Tauri v2 Tray',
    islandCaption: 'Pick a state to preview the notch',
  },
};

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'es';
  try {
    return localStorage.getItem('loom.landing.lang') === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

function handleSpotlightMove(e: ReactPointerEvent<HTMLElement>): void {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export function CarretReel() {
  const [lang, setLang] = useState<Lang>('es');
  const [activeFrame, setActiveFrame] = useState<number>(0);
  const [hoveredCol, setHoveredCol] = useState<number>(4);
  const [islandState, setIslandState] = useState<IslandState>('thinking');
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLang(readInitialLang());
    const onLang = (event: Event) => {
      if (event instanceof CustomEvent && (event.detail === 'es' || event.detail === 'en')) {
        setLang(event.detail);
      }
    };
    window.addEventListener('loom:lang', onLang);
    return () => window.removeEventListener('loom:lang', onLang);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.dataset.carretReady = '';
    if (typeof IntersectionObserver === 'undefined') return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-carret-card]'));
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            const idx = cards.indexOf(entry.target as HTMLElement);
            if (idx !== -1) {
              bestRatio = entry.intersectionRatio;
              bestIdx = idx;
            }
          }
        }
        if (bestIdx !== -1) {
          setActiveFrame(bestIdx);
        }
      },
      { threshold: [0.35, 0.6, 0.85] },
    );

    for (const card of cards) {
      observer.observe(card);
    }
    return () => observer.disconnect();
  }, []);

  const t = COPY[lang];
  const counterLabel = `0${activeFrame + 1} / 05`;
  const [frame0, frame1, frame2, frame3, frame4] = t.frames;
  const activeColVal = EQUALIZER_BARS[hoveredCol] ?? 6;
  const activeIslandMeta = ISLAND_PILLS[islandState];

  const scrollToCard = (index: number): void => {
    playLandingSound('shutter');
    setActiveFrame(index);
    const track = trackRef.current;
    if (!track) return;
    const target = track.querySelectorAll<HTMLElement>('[data-carret-card]').item(index);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const selectIslandState = (next: IslandState): void => {
    if (next !== islandState) playLandingSound('shutter');
    setIslandState(next);
    window.dispatchEvent(new CustomEvent('loom:state-accent', { detail: next }));
  };

  return (
    <section id="carret-section" className="relative overflow-hidden py-16 md:py-24">
      <style>{`
        @keyframes loomCarretPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .loom-carret-dot-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: loomCarretPulse 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .loom-carret-dot-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
            {t.headline}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5" role="group" aria-label="Reel frame selector">
            {t.frames.map((frame, idx) => {
              const isSelected = activeFrame === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToCard(idx)}
                  aria-label={frame.title}
                  aria-pressed={isSelected}
                  className={`min-h-11 min-w-11 rounded-lg border font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] ${
                    isSelected
                      ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  0{idx + 1}
                </button>
              );
            })}
          </div>
          <span
            data-carret-counter
            className="font-mono text-sm tracking-widest text-[var(--accent-blue)]"
          >
            {counterLabel}
          </span>
        </div>
      </div>

      <div className="loom-sprocket-rail mb-4" aria-hidden="true" />

      <div className="overflow-hidden">
        <div
          id="carret-track"
          ref={trackRef}
          className="flex flex-col gap-5 px-4 md:w-max md:flex-row md:gap-8 md:px-12"
        >
          <article
            data-carret-card
            data-spotlight
            onPointerMove={handleSpotlightMove}
            className="w-full max-w-[820px] shrink-0 rounded-3xl p-6 loom-glass-panel loom-spotlight md:w-[76vw] md:p-8 lg:w-[62vw]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
                  <img src="/brands/git.svg" alt="Git" className="h-5 w-5" loading="lazy" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {frame0.title}
                </h3>
              </div>
              <span className="rounded-full border border-[var(--accent-green)]/30 bg-[var(--accent-green-soft)] px-3 py-1 font-mono text-xs text-[var(--accent-green)]">
                {t.worktreeBadge}
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/80 p-4">
              <svg
                viewBox="0 0 640 190"
                className="h-auto w-full"
                role="img"
                aria-label={t.worktreeSummary}
              >
                <line
                  x1="28"
                  y1="96"
                  x2="138"
                  y2="96"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="2.5"
                />
                <circle cx="34" cy="96" r="6" fill="#f4f4f6" />
                <text x="26" y="122" fill="#a1a1aa" fontSize="11" fontFamily="monospace">
                  main
                </text>

                {WORKTREE_LANES.map((lane, idx) => {
                  const pathD = `M 138 96 C 185 96, 185 ${lane.y}, 238 ${lane.y} L 468 ${lane.y}`;
                  return (
                    <g key={lane.branch}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={lane.color}
                        strokeWidth="2.2"
                        className="loom-thread-flow"
                      />
                      <circle cx="238" cy={lane.y} r="5" fill={lane.color} />
                      <circle
                        cx="474"
                        cy={lane.y}
                        r="5.5"
                        fill="#22c55e"
                        className="loom-carret-dot-pulse"
                        style={{ animationDelay: `${idx * 240}ms` }}
                      />
                      <text x="252" y={lane.y - 10} fill="#f4f4f6" fontSize="11.5" fontFamily="monospace">
                        {lane.branch}
                      </text>
                      <rect
                        x="488"
                        y={lane.y - 11}
                        width="136"
                        height="22"
                        rx="11"
                        fill="rgba(34, 197, 94, 0.1)"
                        stroke="rgba(34, 197, 94, 0.34)"
                        strokeWidth="1"
                      />
                      <text x="556" y={lane.y + 4} textAnchor="middle" fill="#22c55e" fontSize="10.5" fontFamily="monospace">
                        {lane.gate} · {lane.status}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <span>{frame0.subtitle}</span>
              <span className="font-mono text-[var(--text-muted)]">{t.worktreeSummary}</span>
            </div>
          </article>

          <article
            data-carret-card
            data-spotlight
            onPointerMove={handleSpotlightMove}
            className="w-full max-w-[820px] shrink-0 rounded-3xl p-6 loom-glass-panel loom-spotlight md:w-[76vw] md:p-8 lg:w-[62vw]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {frame1.title}
              </h3>
              <span className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)]">
                {t.orbitCaption}
              </span>
            </div>

            <div className="relative mt-6 h-[270px] w-full overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/80 sm:h-[300px]">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.35"
                  strokeDasharray="1.5 1.5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="23"
                  fill="none"
                  stroke="rgba(59,130,246,0.22)"
                  strokeWidth="0.35"
                />
                {ORBITAL_NODES.map((node) => (
                  <line
                    key={node.id}
                    x1="50"
                    y1="50"
                    x2={node.x}
                    y2={node.y}
                    stroke={node.accent}
                    strokeWidth="0.45"
                    className="loom-thread-flow"
                  />
                ))}
              </svg>

              <div className="absolute left-1/2 top-1/2 flex h-16 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-2xl border border-[var(--accent-blue)]/60 bg-[var(--bg-elevated)] shadow-lg">
                <img src="/favicon.svg" alt="" className="h-5 w-5 shrink-0 rounded-md" />
                <span className="font-mono text-xs font-semibold tracking-widest text-[var(--text-primary)]">
                  {t.orbitCenter}
                </span>
              </div>

              {ORBITAL_NODES.map((node) => (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-glass-strong)] px-2.5 py-1.5 backdrop-blur-md"
                >
                  <img
                    src={node.src}
                    alt={node.name}
                    className="h-4 w-4 shrink-0 rounded-sm object-contain sm:h-5 sm:w-5"
                    loading="lazy"
                  />
                  <span className="hidden font-mono text-[11px] text-[var(--text-primary)] sm:inline">
                    {node.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-[var(--text-secondary)]">{frame1.subtitle}</p>
          </article>

          <article
            data-carret-card
            data-spotlight
            onPointerMove={handleSpotlightMove}
            className="w-full max-w-[820px] shrink-0 rounded-3xl p-6 loom-glass-panel loom-spotlight md:w-[76vw] md:p-8 lg:w-[62vw]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {frame2.title}
              </h3>
              <span className="rounded-full border border-[var(--accent-blue)]/30 bg-[var(--accent-blue-soft)] px-3 py-1 font-mono text-xs text-[var(--accent-blue)]">
                127.0.0.1:4320
              </span>
            </div>

            <div className="mt-6 grid gap-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/85 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <div className="rounded-xl border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-red)]">
                  {t.privacyBlocked}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-xs text-[var(--text-primary)]">
                  <span className="rounded border border-[var(--accent-red)]/30 px-2 py-0.5">.env*</span>
                  <span className="rounded border border-[var(--accent-red)]/30 px-2 py-0.5">.pem</span>
                  <span className="rounded border border-[var(--accent-red)]/30 px-2 py-0.5">.key</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 py-1">
                <svg viewBox="0 0 88 42" className="h-9 w-20" aria-hidden="true">
                  <line
                    x1="4"
                    y1="21"
                    x2="32"
                    y2="21"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x="32"
                    y="7"
                    width="24"
                    height="28"
                    rx="6"
                    fill="#11131a"
                    stroke="#3b82f6"
                    strokeWidth="1.8"
                  />
                  <path d="M44 14v14M38 21h12" stroke="#22c55e" strokeWidth="1.8" />
                  <line
                    x1="56"
                    y1="21"
                    x2="84"
                    y2="21"
                    stroke="#22c55e"
                    strokeWidth="2"
                    className="loom-thread-flow"
                  />
                </svg>
                <span className="font-mono text-[10px] tracking-widest text-[var(--accent-green)]">
                  PRIVACY_GATE
                </span>
              </div>

              <div className="rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green-soft)] p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-green)]">
                  {t.privacyTarget}
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">
                  127.0.0.1:4320
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  {t.privacyShield}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs">
              <span className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--text-primary)]">
                Host 403 Guard
              </span>
              <span className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--text-primary)]">
                QR 120s
              </span>
              <span className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--text-primary)]">
                TOTP
              </span>
              <span className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[var(--accent-green)]">
                .env filter
              </span>
            </div>

            <p className="mt-4 text-xs text-[var(--text-secondary)]">{frame2.subtitle}</p>
          </article>

          <article
            data-carret-card
            data-spotlight
            onPointerMove={handleSpotlightMove}
            className="w-full max-w-[820px] shrink-0 rounded-3xl p-6 loom-glass-panel loom-spotlight md:w-[76vw] md:p-8 lg:w-[62vw]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {frame3.title}
              </h3>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {t.telemetryCol} {String(hoveredCol + 1).padStart(2, '0')} · {activeColVal}/7
              </span>
            </div>

            <div className="mt-6 grid gap-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/85 p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:items-center">
              <div className="grid grid-cols-14 gap-0.5 sm:gap-1" role="group" aria-label="Dot matrix equalizer">
                {EQUALIZER_BARS.map((height, colIdx) => {
                  const isFocused = hoveredCol === colIdx;
                  return (
                    <button
                      key={`eq-col-${colIdx}`}
                      type="button"
                      onMouseEnter={() => setHoveredCol(colIdx)}
                      onFocus={() => setHoveredCol(colIdx)}
                      onClick={() => setHoveredCol(colIdx)}
                      aria-label={`${t.telemetryCol} ${colIdx + 1}: ${height}/7`}
                      aria-pressed={isFocused}
                      className={`flex min-h-11 flex-col items-center justify-between rounded-md p-0.5 transition-colors sm:p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] ${
                        isFocused ? 'bg-[var(--accent-blue-soft)]' : 'hover:bg-white/5'
                      }`}
                    >
                      {EQUALIZER_ROWS.map((rowLevel) => {
                        const lit = rowLevel < height;
                        const isPeak = rowLevel === height - 1;
                        return (
                          <span
                            key={`eq-${colIdx}-${rowLevel}`}
                            className={`h-1.5 w-1.5 rounded-full transition-colors sm:h-2 sm:w-2 ${
                              !lit
                                ? 'bg-[var(--dot-inactive)]'
                                : isFocused
                                  ? 'bg-[var(--accent-green)]'
                                  : isPeak
                                    ? 'bg-[var(--accent-blue)]'
                                    : 'bg-[var(--text-primary)]/80'
                            }`}
                          />
                        );
                      })}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
                    {RING_DOTS.map((idx) => {
                      const angle = (idx / 24) * Math.PI * 2 - Math.PI / 2;
                      const outerX = 60 + Math.cos(angle) * 48;
                      const outerY = 60 + Math.sin(angle) * 48;
                      const innerX = 60 + Math.cos(angle) * 36;
                      const innerY = 60 + Math.sin(angle) * 36;
                      return (
                        <g key={`ring-${idx}`}>
                          <circle cx={outerX} cy={outerY} r="2.2" fill="#22c55e" />
                          <circle
                            cx={innerX}
                            cy={innerY}
                            r="1.6"
                            fill={idx % 2 === 0 ? '#3b82f6' : 'rgba(255,255,255,0.2)'}
                          />
                        </g>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono text-xl font-semibold text-[var(--text-primary)]">
                      {t.telemetryGates}
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-[var(--accent-green)]">
                      {t.telemetryRing}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--text-secondary)]">{frame3.subtitle}</p>
          </article>

          <article
            data-carret-card
            data-spotlight
            onPointerMove={handleSpotlightMove}
            className="w-full max-w-[820px] shrink-0 rounded-3xl p-6 loom-glass-panel loom-spotlight md:w-[76vw] md:p-8 lg:w-[62vw]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {frame4.title}
              </h3>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {t.islandShortcut}
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/90 p-4">
              <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-b-2xl rounded-t-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div
                    className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-void)] p-1.5"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 9 }, (_, cell) => {
                      const active = activeIslandMeta.activeCells.includes(cell);
                      return (
                        <span
                          key={`island-cell-${cell}`}
                          className={`h-2 w-2 rounded-[2px] transition-all ${
                            active
                              ? `scale-100 opacity-100 ${activeIslandMeta.dotClass}`
                              : 'scale-75 bg-[var(--dot-inactive)] opacity-45'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                      LOOM_ISLAND
                    </p>
                    <p className="truncate font-mono text-xs text-[var(--text-primary)]">
                      {activeIslandMeta[lang]}
                    </p>
                  </div>
                </div>
                <span className="rounded border border-[var(--border-hairline)] bg-[var(--bg-void)] px-2 py-1 font-mono text-[10px] text-[var(--accent-blue)]">
                  127.0.0.1
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {(Object.keys(ISLAND_PILLS) as IslandState[]).map((key) => {
                  const meta = ISLAND_PILLS[key];
                  const selected = islandState === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectIslandState(key)}
                      aria-pressed={selected}
                      className={`min-h-11 rounded-full border px-3.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] ${
                        selected
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--text-primary)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {meta[lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
              <span>{frame4.subtitle}</span>
              <span className="font-mono text-[var(--text-muted)]">{t.islandCaption}</span>
            </div>
          </article>
        </div>
      </div>

      <div className="loom-sprocket-rail mt-4" aria-hidden="true" />
    </section>
  );
}

export default CarretReel;
