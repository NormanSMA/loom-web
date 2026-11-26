import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { playLandingSound } from '../scripts/sound';

type Lang = 'es' | 'en';
type AgentState = 'thinking' | 'reading' | 'analysing' | 'debugging';
type FolderId = 'loom' | 'claudehub' | 'ecopulse';

interface FolderBrand {
  readonly name: string;
  readonly src: string;
}

interface FolderProject {
  readonly id: FolderId;
  readonly name: string;
  readonly tabCode: string;
  readonly summaryEs: string;
  readonly summaryEn: string;
  readonly worktreePath: string;
  readonly lastGate: string;
  readonly activeSession: string;
  readonly brands: readonly FolderBrand[];
}

interface StateDefinition {
  readonly id: AgentState;
  readonly labelEs: string;
  readonly labelEn: string;
  readonly detailEs: string;
  readonly detailEn: string;
  readonly accentClass: string;
  readonly badgeClass: string;
}

const FOLDERS: readonly FolderProject[] = [
  {
    id: 'loom',
    name: 'Loom',
    tabCode: 'CORE_RUST',
    summaryEs: 'Orquestador local, daemon HTTP y servidor MCP.',
    summaryEn: 'Local orchestrator, HTTP daemon, and MCP server.',
    worktreePath: '.loom/worktrees/loom-core-sync',
    lastGate: 'cargo test · 41 pass · 0 warn',
    activeSession: 'sess_9f2a · claude + codex',
    brands: [
      { name: 'Claude', src: '/brands/claude.svg' },
      { name: 'Codex', src: '/brands/codex.svg' },
      { name: 'Gemini', src: '/brands/gemini.svg' },
      { name: 'Antigravity', src: '/brands/antigravity.svg' },
    ],
  },
  {
    id: 'claudehub',
    name: 'ClaudeHub',
    tabCode: 'ISLAND_UI',
    summaryEs: 'Notch interactivo, estado vivo y ruteo de sesiones.',
    summaryEn: 'Interactive notch, live state, and session routing.',
    worktreePath: '.loom/worktrees/claudehub-island',
    lastGate: 'pnpm web:typecheck · 0 errors',
    activeSession: 'sess_4c18 · claudehub + opencode',
    brands: [
      { name: 'ClaudeHub', src: '/brands/claudehub.png' },
      { name: 'Claude', src: '/brands/claude.svg' },
      { name: 'OpenCode', src: '/brands/opencode.svg' },
    ],
  },
  {
    id: 'ecopulse',
    name: 'EcoPulse',
    tabCode: 'TELEMETRY',
    summaryEs: 'Sensores locales, auditoria de energia y trazas.',
    summaryEn: 'Local sensors, energy audit, and trace streams.',
    worktreePath: '.loom/worktrees/ecopulse-metrics',
    lastGate: 'pnpm web:build · dist verified',
    activeSession: 'sess_7e03 · gemini + antigravity',
    brands: [
      { name: 'Gemini', src: '/brands/gemini.svg' },
      { name: 'Antigravity', src: '/brands/antigravity.svg' },
      { name: 'Claude', src: '/brands/claude.svg' },
    ],
  },
];

const AGENT_STATES: readonly StateDefinition[] = [
  {
    id: 'thinking',
    labelEs: 'Pensando',
    labelEn: 'Thinking',
    detailEs: 'Evaluando grafo de dependencias y cuota por modelo.',
    detailEn: 'Evaluating dependency graph and model quota.',
    accentClass: 'border-[var(--accent-green)] bg-[var(--accent-green-soft)] text-[var(--text-primary)]',
    badgeClass: 'text-[var(--accent-green)]',
  },
  {
    id: 'reading',
    labelEs: 'Leyendo docs',
    labelEn: 'Reading Docs',
    detailEs: 'Indexando contrato local, esquemas y trazas de repo.',
    detailEn: 'Indexing local contract, schemas, and repo traces.',
    accentClass: 'border-[var(--accent-red)] bg-[var(--accent-red)]/15 text-[var(--text-primary)]',
    badgeClass: 'text-[var(--accent-red)]',
  },
  {
    id: 'analysing',
    labelEs: 'Analizando',
    labelEn: 'Analysing',
    detailEs: 'Cruzando capsula de contexto con filtro PrivacyGate.',
    detailEn: 'Cross-checking context capsule with PrivacyGate filter.',
    accentClass: 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--text-primary)]',
    badgeClass: 'text-[var(--accent-blue)]',
  },
  {
    id: 'debugging',
    labelEs: 'Depurando',
    labelEn: 'Debugging',
    detailEs: 'Ejecutando compuertas de lint, tipos y tests en worktree.',
    detailEn: 'Running lint, typecheck, and test gates inside worktree.',
    accentClass: 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--text-primary)]',
    badgeClass: 'text-[var(--accent-blue)]',
  },
];

const COPY: Record<
  Lang,
  {
    title: string;
    foldersHeading: string;
    drawerTitle: string;
    worktreeLabel: string;
    gateLabel: string;
    sessionLabel: string;
    playgroundHeading: string;
    playgroundHint: string;
    notchPrefix: string;
  }
> = {
  es: {
    title: 'Un estudio para tejer contextos, carpetas y estados vivos.',
    foldersHeading: 'CARPETAS_CONTEXTO',
    drawerTitle: 'INSPECTOR_PROYECTO',
    worktreeLabel: 'Worktree activo',
    gateLabel: 'Ultima compuerta',
    sessionLabel: 'Sesion activa',
    playgroundHeading: 'MODOS_ISLA_3D',
    playgroundHint: 'Toca o pasa el cursor para sincronizar la escena WebGL.',
    notchPrefix: 'LOOM_ISLAND',
  },
  en: {
    title: 'A studio for weaving contexts, folders, and live states.',
    foldersHeading: 'CONTEXT_FOLDERS',
    drawerTitle: 'PROJECT_INSPECTOR',
    worktreeLabel: 'Active worktree',
    gateLabel: 'Last verified gate',
    sessionLabel: 'Active session',
    playgroundHeading: '3D_ISLAND_MODES',
    playgroundHint: 'Hover or click any state to morph the WebGL scene.',
    notchPrefix: 'LOOM_ISLAND',
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

function StateMicroSvg({ state, size = 'sm' }: { readonly state: AgentState; readonly size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';

  if (state === 'thinking') {
    const delays = ['0ms', '140ms', '280ms', '140ms', '280ms', '420ms', '280ms', '420ms', '560ms'];
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0`} aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <rect
              key={`sq-${i}`}
              x={3 + col * 6.5}
              y={3 + row * 6.5}
              width="4.5"
              height="4.5"
              rx="1"
              fill="#22c55e"
              className="loom-sq-stagger"
              style={{ animationDelay: delays[i] ?? '0ms' }}
            />
          );
        })}
      </svg>
    );
  }

  if (state === 'reading') {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0`} aria-hidden="true">
        <polygon
          points="12,3 21,19 3,19"
          fill="rgba(239, 68, 68, 0.22)"
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="loom-tri-pulse"
        />
        <circle cx="12" cy="14" r="1.6" fill="#ef4444" />
      </svg>
    );
  }

  if (state === 'analysing') {
    return (
      <svg viewBox="0 0 24 24" className={`${dim} shrink-0`} aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="8"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.8"
          strokeDasharray="6 3 2 3"
          className="loom-glitch-ring"
        />
        <circle cx="12" cy="12" r="2.5" fill="#60a5fa" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={`${dim} shrink-0`} aria-hidden="true">
      {[0, 1, 2, 3].map((step) => (
        <rect
          key={`diag-${step}`}
          x={3 + step * 4.5}
          y={3 + step * 4.5}
          width="4"
          height="4"
          rx="1"
          fill="#3b82f6"
          className="loom-diag-cascade"
          style={{ animationDelay: `${step * 150}ms` }}
        />
      ))}
    </svg>
  );
}

export function GlassWorkbench() {
  const [lang, setLang] = useState<Lang>('es');
  const [selectedFolder, setSelectedFolder] = useState<FolderId>('loom');
  const [activeState, setActiveState] = useState<AgentState>('thinking');

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

  const t = COPY[lang];
  const inspectedProject = FOLDERS.find((f) => f.id === selectedFolder) ?? FOLDERS[0];
  const currentStateDef = AGENT_STATES.find((s) => s.id === activeState) ?? AGENT_STATES[0];

  const triggerAgentState = (state: AgentState): void => {
    setActiveState(state);
    window.dispatchEvent(new CustomEvent('loom:state-accent', { detail: state }));
  };

  return (
    <section id="estudio" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <style>{`
        @keyframes loomSqStagger {
          0%, 100% { opacity: 0.28; transform: scale(0.84); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes loomTriPulse {
          0%, 100% { opacity: 0.65; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes loomGlitchRing {
          0% { transform: rotate(0deg) scale(1); }
          45% { transform: rotate(160deg) scale(1.05); }
          50% { transform: rotate(172deg) translate(1px, -1px) scale(0.96); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes loomDiagCascade {
          0%, 100% { opacity: 0.3; transform: translate(0, 0); }
          50% { opacity: 1; transform: translate(1px, 1px); }
        }
        .loom-sq-stagger,
        .loom-tri-pulse,
        .loom-glitch-ring,
        .loom-diag-cascade {
          transform-box: fill-box;
          transform-origin: center;
        }
        .loom-sq-stagger { animation: loomSqStagger 1.5s ease-in-out infinite; }
        .loom-tri-pulse { animation: loomTriPulse 1.6s ease-in-out infinite; }
        .loom-glitch-ring { animation: loomGlitchRing 2.4s linear infinite; }
        .loom-diag-cascade { animation: loomDiagCascade 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .loom-sq-stagger,
          .loom-tri-pulse,
          .loom-glitch-ring,
          .loom-diag-cascade {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mb-10 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
          {t.title}
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* Left column — Interactive Dark-Glass Folders */}
        <div className="min-w-0 space-y-5">
          <p className="font-mono text-xs tracking-widest text-[var(--text-muted)]">
            {t.foldersHeading}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {FOLDERS.map((folder) => {
              const isSelected = selectedFolder === folder.id;
              return (
                <div key={folder.id} className="group relative pt-5">
                  {/* Top-left folder tab */}
                  <div
                    className={`absolute left-3 top-1 z-0 h-5 w-24 rounded-t-xl border border-b-0 px-2.5 pt-1 font-mono text-[10px] tracking-wider transition-colors ${
                      isSelected
                        ? 'border-[var(--accent-blue)]/60 bg-[var(--bg-elevated)] text-[var(--accent-blue)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    {folder.tabCode}
                  </div>

                  {/* Translucent tilted paper sheets peeking out */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-4 top-2.5 z-0 h-8 origin-bottom-left -rotate-2 rounded-t-xl border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-3 motion-reduce:transition-none"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-5 top-3 z-0 h-8 origin-bottom-right rotate-2 rounded-t-xl border border-white/10 bg-white/[0.06] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-3 motion-reduce:transition-none"
                  />

                  <button
                    type="button"
                    data-spotlight
                    onPointerMove={handleSpotlightMove}
                    onClick={() => {
                      if (!isSelected) playLandingSound('click');
                      setSelectedFolder(folder.id);
                    }}
                    aria-pressed={isSelected}
                    className={`relative z-10 flex min-h-44 w-full flex-col justify-between rounded-2xl p-4 text-left transition-transform duration-300 loom-glass-folder loom-spotlight group-hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] motion-reduce:transition-none ${
                      isSelected
                        ? 'border-[var(--accent-blue)]/70 ring-1 ring-[var(--accent-blue)]/40'
                        : 'hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                          {folder.name}
                        </h3>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isSelected ? 'bg-[var(--accent-green)]' : 'bg-[var(--dot-inactive)]'
                          }`}
                        />
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {lang === 'es' ? folder.summaryEs : folder.summaryEn}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-hairline)] pt-3">
                      {folder.brands.map((brand) => (
                        <span
                          key={brand.name}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-void)]/75"
                          title={brand.name}
                        >
                          <img
                            src={brand.src}
                            alt={brand.name}
                            className="h-4 w-4 object-contain"
                            loading="lazy"
                          />
                        </span>
                      ))}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Click-to-inspect project drawer readout */}
          {inspectedProject && (
            <div
              data-spotlight
              onPointerMove={handleSpotlightMove}
              className="rounded-2xl p-5 loom-glass-panel loom-spotlight"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-widest text-[var(--accent-blue)]">
                    {t.drawerTitle}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">/</span>
                  <span className="font-mono text-xs text-[var(--text-primary)]">
                    {inspectedProject.name}
                  </span>
                </div>
                <span className="rounded-full border border-[var(--accent-green)]/30 bg-[var(--accent-green-soft)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--accent-green)]">
                  READY
                </span>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/70 p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t.worktreeLabel}
                  </dt>
                  <dd className="mt-1 truncate font-mono text-xs text-[var(--text-primary)]">
                    {inspectedProject.worktreePath}
                  </dd>
                </div>

                <div className="min-w-0 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/70 p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t.gateLabel}
                  </dt>
                  <dd className="mt-1 truncate font-mono text-xs text-[var(--accent-green)]">
                    {inspectedProject.lastGate}
                  </dd>
                </div>

                <div className="min-w-0 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/70 p-3">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t.sessionLabel}
                  </dt>
                  <dd className="mt-1 truncate font-mono text-xs text-[var(--accent-blue)]">
                    {inspectedProject.activeSession}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Right column — Live 4-State Agent Playground */}
        <div
          data-spotlight
          onPointerMove={handleSpotlightMove}
          className="flex min-w-0 flex-col justify-between rounded-3xl p-5 loom-glass-panel loom-spotlight sm:p-6"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs tracking-widest text-[var(--text-muted)]">
                {t.playgroundHeading}
              </span>
              <span className="font-mono text-[11px] text-[var(--accent-blue)]">
                loom:state-accent
              </span>
            </div>

            {/* Top notch preview bar */}
            <div className="mt-4 rounded-b-2xl rounded-t-lg border border-[var(--border-strong)] bg-[var(--bg-void)]/95 p-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                    <StateMicroSvg state={activeState} size="lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                      {t.notchPrefix}
                    </p>
                    <p className="truncate font-mono text-sm font-medium text-[var(--text-primary)]">
                      {currentStateDef ? (lang === 'es' ? currentStateDef.labelEs : currentStateDef.labelEn) : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-[10px] uppercase ${
                    currentStateDef?.badgeClass ?? 'text-[var(--accent-blue)]'
                  }`}
                >
                  {activeState}
                </span>
              </div>

              <p className="mt-3 border-t border-[var(--border-hairline)] pt-2.5 text-xs text-[var(--text-secondary)]">
                {currentStateDef ? (lang === 'es' ? currentStateDef.detailEs : currentStateDef.detailEn) : ''}
              </p>
            </div>

            {/* 4 interactive state buttons */}
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {AGENT_STATES.map((item) => {
                const isSelected = activeState === item.id;
                const label = lang === 'es' ? item.labelEs : item.labelEn;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playLandingSound('chime', item.id);
                      triggerAgentState(item.id);
                    }}
                    onMouseEnter={() => triggerAgentState(item.id)}
                    aria-pressed={isSelected}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] ${
                      isSelected
                        ? item.accentClass
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <StateMicroSvg state={item.id} size="sm" />
                    <span className="font-mono text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-5 border-t border-[var(--border-hairline)] pt-3 font-mono text-[11px] text-[var(--text-muted)]">
            {t.playgroundHint}
          </p>
        </div>
      </div>
    </section>
  );
}

export default GlassWorkbench;
