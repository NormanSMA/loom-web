import { useEffect, useState } from 'react';
import { CheckCircle2, GitBranch, Lock, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import {
  COPY,
  DEFAULT_LANG,
  isLang,
  LANG_EVENT,
  readStoredLang,
  SIGNAL_NODE_IDS,
  SIGNAL_NODES,
  type Lang,
  type SignalNodeId,
  type SignalTier,
} from '../data/content';
import { playLandingSound } from '../scripts/sound';

const TIER_STYLES: Record<
  SignalTier,
  {
    stroke: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  paid: {
    stroke: '#3b82f6',
    badgeClass: 'border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)] text-[var(--text-primary)]',
    dotClass: 'bg-[var(--accent-blue)]',
  },
  free: {
    stroke: '#f59e0b',
    badgeClass: 'border-[var(--accent-amber)]/45 bg-[var(--accent-amber)]/15 text-[var(--text-primary)]',
    dotClass: 'bg-[var(--accent-amber)]',
  },
  local: {
    stroke: '#22c55e',
    badgeClass: 'border-[var(--accent-green)]/40 bg-[var(--accent-green-soft)] text-[var(--text-primary)]',
    dotClass: 'bg-[var(--accent-green)]',
  },
};

export function SignalRouter() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [selectedId, setSelectedId] = useState<SignalNodeId>('claude');

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

  const t = COPY[lang].signalRouter;
  const activeNode = SIGNAL_NODES[selectedId];
  const tierStyle = TIER_STYLES[activeNode.tier];
  const selectedIndex = SIGNAL_NODE_IDS.indexOf(selectedId);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const startY = 24 + safeIndex * 42;

  return (
    <section
      id="enrutador"
      aria-labelledby="enrutador-heading"
      className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6"
    >
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-[0.2em] text-[var(--accent-blue)]">
            {t.eyebrow}
          </p>
          <h2
            id="enrutador-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl"
          >
            {t.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div
          role="list"
          aria-label="Router telemetry"
          className="grid grid-cols-2 divide-x divide-y divide-[var(--border-hairline)] overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] sm:grid-cols-4 sm:divide-y-0"
        >
          {t.metrics.map((metric) => (
            <div key={metric.label} role="listitem" className="px-4 py-3">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                {metric.accent ? (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-green)]"
                  />
                ) : null}
                <span>{metric.value}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="loom-glass-panel relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t.nodesHeading}
            </p>
            <div
              role="radiogroup"
              aria-label={t.nodesHeading}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1"
            >
              {SIGNAL_NODE_IDS.map((nodeId) => {
                const node = SIGNAL_NODES[nodeId];
                const isSelected = nodeId === selectedId;
                const nodeTier = TIER_STYLES[node.tier];

                return (
                  <button
                    key={nodeId}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      if (!isSelected) playLandingSound('click');
                      setSelectedId(nodeId);
                    }}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] active:scale-[0.99] ${
                      isSelected
                        ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]/70 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={node.icon}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0 rounded-sm object-contain"
                      />
                      <span className="truncate text-sm font-medium">{node.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${nodeTier.dotClass}`} />
                      <span>{node.tier}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] lg:text-center">
              {t.gatesHeading}
            </p>

            <div className="relative rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-void)]/70 p-4">
              <svg
                viewBox="0 0 320 290"
                aria-hidden="true"
                className="hidden h-64 w-full lg:block"
              >
                {SIGNAL_NODE_IDS.map((nodeId, index) => {
                  const y = 24 + index * 42;
                  const active = nodeId === selectedId;
                  return (
                    <path
                      key={nodeId}
                      d={`M 8 ${y} C 90 ${y}, 110 145, 160 145`}
                      fill="none"
                      stroke={active ? tierStyle.stroke : 'rgba(255,255,255,0.09)'}
                      strokeWidth={active ? 2.5 : 1}
                      className={active ? 'loom-thread-flow' : undefined}
                    />
                  );
                })}

                <path
                  d={`M 8 ${startY} C 90 ${startY}, 110 145, 160 145 L 312 145`}
                  fill="none"
                  stroke={tierStyle.stroke}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="loom-thread-flow"
                />

                <circle cx={8} cy={startY} r={4} fill={tierStyle.stroke} />
                <circle cx={160} cy={145} r={5} fill={tierStyle.stroke} />
                <circle cx={312} cy={145} r={4} fill={tierStyle.stroke} />
              </svg>

              <div className="mt-0 flex flex-col gap-2 lg:mt-2">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 font-mono text-[var(--text-primary)]">
                    {activeNode.confidentialAllowed ? (
                      <ShieldCheck className="h-4 w-4 text-[var(--accent-green)]" aria-hidden="true" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-[var(--accent-amber)]" aria-hidden="true" />
                    )}
                    <span>{t.gates[0]}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    {activeNode.confidentialAllowed ? 'CLEAR' : 'GUARD'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 font-mono text-[var(--text-primary)]">
                    <GitBranch className="h-4 w-4 text-[var(--accent-blue)]" aria-hidden="true" />
                    <span>{t.gates[1]}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">ISOLATED</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 font-mono text-[var(--text-primary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent-green)]" aria-hidden="true" />
                    <span>{t.gates[2]}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t.policyHeading}
            </p>

            <div
              aria-live="polite"
              className="loom-glass-folder loom-spotlight rounded-2xl p-5"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={activeNode.icon}
                    alt={activeNode.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-md object-contain"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">
                      {activeNode.name}
                    </h3>
                    <p className="truncate font-mono text-xs text-[var(--text-muted)]">
                      {activeNode.adapter}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${tierStyle.badgeClass}`}
                >
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tierStyle.dotClass}`} />
                  <span>{t.tierNames[activeNode.tier]}</span>
                </span>
              </div>

              <dl className="mt-4 space-y-3.5 text-sm">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t.sensitivityLabel}
                  </dt>
                  <dd className="mt-1 flex items-start gap-2 text-[var(--text-primary)]">
                    <Lock
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        activeNode.confidentialAllowed
                          ? 'text-[var(--accent-green)]'
                          : 'text-[var(--accent-amber)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{activeNode.sensitivityPolicy[lang]}</span>
                  </dd>
                </div>

                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t.roleLabel}
                  </dt>
                  <dd className="mt-1 text-[var(--text-secondary)]">{activeNode.role[lang]}</dd>
                </div>

                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t.destinationLabel}
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-[var(--accent-blue)]">
                    {activeNode.bridgeDestination[lang]}
                  </dd>
                </div>

                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-void)] p-3">
                  <dt className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <Terminal className="h-3 w-3" aria-hidden="true" />
                    <span>{t.commandLabel}</span>
                  </dt>
                  <dd className="overflow-x-auto font-mono text-xs text-[var(--text-primary)]">
                    <code>{activeNode.routeCommand}</code>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
