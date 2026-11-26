export type Lang = 'es' | 'en';

export const DEFAULT_LANG: Lang = 'es';
export const LANG_STORAGE_KEY = 'loom.landing.lang';
export const LANG_EVENT = 'loom:lang';

export const LINKS = {
  github: 'https://github.com/NormanSMA/Loom',
  releases: 'https://github.com/NormanSMA/Loom/releases',
  desktopActions: 'https://github.com/NormanSMA/Loom/actions/workflows/desktop-release.yml',
  claudehub: 'https://github.com/NormanSMA/ClaudeHub',
  portfolio: 'https://nsma.dev',
  site: 'https://loom.nsma.dev',
} as const;

export type SignalTier = 'paid' | 'free' | 'local';

export type SignalNodeId =
  | 'claude'
  | 'codex'
  | 'gemini'
  | 'antigravity'
  | 'opencode'
  | 'omniroute'
  | 'claudehub';

export interface SignalNodeSpec {
  id: SignalNodeId;
  name: string;
  icon: string;
  tier: SignalTier;
  adapter: string;
  bridgeDestination: Record<Lang, string>;
  role: Record<Lang, string>;
  sensitivityPolicy: Record<Lang, string>;
  confidentialAllowed: boolean;
  routeCommand: string;
}

export const SIGNAL_NODE_IDS: readonly SignalNodeId[] = [
  'claude',
  'codex',
  'gemini',
  'antigravity',
  'opencode',
  'omniroute',
  'claudehub',
] as const;

export const SIGNAL_NODES: Record<SignalNodeId, SignalNodeSpec> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    icon: '/brands/claude.svg',
    tier: 'paid',
    adapter: 'claude-code-cli',
    bridgeDestination: {
      es: 'Ejecutor local supervisado',
      en: 'Supervised local runner',
    },
    role: {
      es: 'Implementador principal y revisión de diffs',
      en: 'Lead implementer and diff reviewer',
    },
    sensitivityPolicy: {
      es: 'Permitido: public, internal, confidential (OAuth propio)',
      en: 'Allowed: public, internal, confidential (first-party OAuth)',
    },
    confidentialAllowed: true,
    routeCommand: 'loom route --role implementer --sensitivity confidential --prefer claude',
  },
  codex: {
    id: 'codex',
    name: 'Codex CLI',
    icon: '/brands/codex.svg',
    tier: 'paid',
    adapter: 'codex-sandbox-cli',
    bridgeDestination: {
      es: 'Ejecutor local supervisado',
      en: 'Supervised local runner',
    },
    role: {
      es: 'Implementador paralelo en git worktree aislado',
      en: 'Parallel implementer in isolated git worktree',
    },
    sensitivityPolicy: {
      es: 'Permitido: public, internal, confidential (cuenta verificada)',
      en: 'Allowed: public, internal, confidential (verified account)',
    },
    confidentialAllowed: true,
    routeCommand: 'loom route --role implementer --sensitivity internal --prefer codex',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini CLI',
    icon: '/brands/gemini.svg',
    tier: 'free',
    adapter: 'gemini-cli-stdio',
    bridgeDestination: {
      es: 'Ejecutor local supervisado',
      en: 'Supervised local runner',
    },
    role: {
      es: 'Investigador de contexto largo y síntesis',
      en: 'Long-context researcher and synthesizer',
    },
    sensitivityPolicy: {
      es: 'Confidencial bloqueado en gratuitos (.env*, .pem, .key aislados)',
      en: 'Confidential blocked on free tiers (.env*, .pem, .key isolated)',
    },
    confidentialAllowed: false,
    routeCommand: 'loom route --role researcher --sensitivity internal --prefer gemini',
  },
  antigravity: {
    id: 'antigravity',
    name: 'Antigravity',
    icon: '/brands/antigravity.svg',
    tier: 'paid',
    adapter: 'agy-acp-bridge',
    bridgeDestination: {
      es: 'Ejecutor local supervisado',
      en: 'Supervised local runner',
    },
    role: {
      es: 'Planificador multiarchivo y arquitectura',
      en: 'Multi-file planner and architecture',
    },
    sensitivityPolicy: {
      es: 'Tokens OAuth nunca interceptados; acceso directo local',
      en: 'OAuth tokens never intercepted; direct local execution',
    },
    confidentialAllowed: true,
    routeCommand: 'loom route --role architect --sensitivity confidential --prefer antigravity',
  },
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    icon: '/brands/opencode.svg',
    tier: 'free',
    adapter: 'opencode-acp',
    bridgeDestination: {
      es: 'Ejecutor local supervisado',
      en: 'Supervised local runner',
    },
    role: {
      es: 'Explorador de código abierto y parches rápidos',
      en: 'Open-source explorer and rapid patches',
    },
    sensitivityPolicy: {
      es: 'Confidencial bloqueado en gratuitos; redacción de secretos activa',
      en: 'Confidential blocked on free tiers; secret redaction active',
    },
    confidentialAllowed: false,
    routeCommand: 'loom route --role explorer --sensitivity public --prefer opencode',
  },
  omniroute: {
    id: 'omniroute',
    name: 'OmniRoute',
    icon: '/brands/omniroute.svg',
    tier: 'local',
    adapter: 'omniroute-proxy',
    bridgeDestination: {
      es: 'Ejecutor local supervisado',
      en: 'Supervised local runner',
    },
    role: {
      es: 'Conmutador por cuota y fallback local',
      en: 'Quota-aware router and local fallback',
    },
    sensitivityPolicy: {
      es: 'Permitido: tráfico 127.0.0.1 sin telemetría externa',
      en: 'Allowed: 127.0.0.1 loopback traffic with zero external telemetry',
    },
    confidentialAllowed: true,
    routeCommand: 'loom route --role router --sensitivity confidential --prefer omniroute',
  },
  claudehub: {
    id: 'claudehub',
    name: 'ClaudeHub',
    icon: '/brands/claudehub.png',
    tier: 'local',
    adapter: 'claudehub-ws-bridge',
    bridgeDestination: {
      es: 'ClaudeHub :4317',
      en: 'ClaudeHub :4317',
    },
    role: {
      es: 'Puente WebSocket y espejo de sesiones locales',
      en: 'WebSocket bridge and local session mirror',
    },
    sensitivityPolicy: {
      es: 'Solo loopback 127.0.0.1:4317 con validación de Host',
      en: 'Loopback 127.0.0.1:4317 only with Host header enforcement',
    },
    confidentialAllowed: true,
    routeCommand: 'loom bridge --target claudehub --bind 127.0.0.1:4317',
  },
};

export type DownloadModeId = 'desktop' | 'demo' | 'ai';

export interface DownloadModeSpec {
  id: DownloadModeId;
  label: Record<Lang, string>;
  filename: string;
  description: Record<Lang, string>;
  snippet: Record<Lang, string>;
}

export const DOWNLOAD_MODE_IDS: readonly DownloadModeId[] = ['desktop', 'demo', 'ai'] as const;

export const DOWNLOAD_MODES: Record<DownloadModeId, DownloadModeSpec> = {
  desktop: {
    id: 'desktop',
    label: {
      es: 'Escritorio Tauri v2',
      en: 'Tauri v2 Desktop',
    },
    filename: 'bash — tauri-v2',
    description: {
      es: 'Clona el repositorio, compila la interfaz web y levanta la aplicacion nativa de escritorio.',
      en: 'Clone the repository, build the web studio, and launch the native desktop shell.',
    },
    snippet: {
      es: `git clone https://github.com/NormanSMA/Loom.git
cd Loom
pnpm install && pnpm web:build && pnpm desktop:dev`,
      en: `git clone https://github.com/NormanSMA/Loom.git
cd Loom
pnpm install && pnpm web:build && pnpm desktop:dev`,
    },
  },
  demo: {
    id: 'demo',
    label: {
      es: 'Demo instantánea',
      en: 'Instant Demo',
    },
    filename: 'bash — loomd :4321',
    description: {
      es: 'Inicia el daemon Rust en modo demo determinista sobre 127.0.0.1:4321 sin credenciales.',
      en: 'Boot the Rust daemon in deterministic demo mode on 127.0.0.1:4321 without credentials.',
    },
    snippet: {
      es: `git clone https://github.com/NormanSMA/Loom.git
cd Loom
pnpm install && pnpm web:build
cargo run -p loomd -- --demo --static-dir apps/web/dist`,
      en: `git clone https://github.com/NormanSMA/Loom.git
cd Loom
pnpm install && pnpm web:build
cargo run -p loomd -- --demo --static-dir apps/web/dist`,
    },
  },
  ai: {
    id: 'ai',
    label: {
      es: 'Instalar con IA',
      en: 'Install with AI',
    },
    filename: 'prompt — claude / codex / gemini / agy',
    description: {
      es: 'Pega este encargo en tu agente CLI local para auditar el entorno y levantar Loom.',
      en: 'Paste this prompt into your local CLI agent to audit your setup and boot Loom.',
    },
    snippet: {
      es: `Clona https://github.com/NormanSMA/Loom, lee AGENTS.md completo, ejecuta cargo run -p loom-cli -- doctor y cargo run -p loom-cli -- config check, compila apps/web con pnpm web:build y arranca loomd en http://127.0.0.1:4321 con --demo.`,
      en: `Clone https://github.com/NormanSMA/Loom, read AGENTS.md in full, run cargo run -p loom-cli -- doctor and cargo run -p loom-cli -- config check, build apps/web with pnpm web:build, and start loomd on http://127.0.0.1:4321 with --demo.`,
    },
  },
};

export interface CopyBundle {
  navbar: {
    brand: string;
    links: {
      reel: string;
      studio: string;
      router: string;
      download: string;
    };
    langToggleAria: string;
    soundOnAria: string;
    soundOffAria: string;
    githubCta: string;
  };
  hero: {
    eyebrow: string;
    line1: string;
    line2: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    loopbackBadge: string;
    toolsLabel: string;
  };
  signalRouter: {
    eyebrow: string;
    title: string;
    subtitle: string;
    metrics: readonly {
      value: string;
      label: string;
      accent?: boolean;
    }[];
    nodesHeading: string;
    gatesHeading: string;
    gates: readonly [string, string, string];
    policyHeading: string;
    tierLabel: string;
    tierNames: Record<SignalTier, string>;
    sensitivityLabel: string;
    roleLabel: string;
    destinationLabel: string;
    commandLabel: string;
  };
  downloadPortal: {
    eyebrow: string;
    headline: string;
    subtitle: string;
    copy: string;
    copied: string;
    primaryCta: string;
    secondaryCta: string;
    stackBadge: string;
  };
}

export const COPY: Record<Lang, CopyBundle> = {
  es: {
    navbar: {
      brand: 'LOOM // TELAR',
      links: {
        reel: 'Carrete',
        studio: 'Estudio',
        router: 'Enrutador',
        download: 'Descargar',
      },
      langToggleAria: 'Cambiar idioma a inglés',
      soundOnAria: 'Silenciar sonido',
      soundOffAria: 'Activar sonido',
      githubCta: 'GitHub',
    },
    hero: {
      eyebrow: 'ORQUESTADOR LOCAL MULTIAGENTE',
      line1: 'Teje agentes CLI',
      line2: 'en un solo telar local.',
      title: 'Teje agentes CLI en un solo telar local.',
      subtitle:
        'Coordina Claude Code, Codex, Gemini, Antigravity, OpenCode y OmniRoute en git worktrees aislados sobre 127.0.0.1.',
      primaryCta: 'Instalar Loom',
      secondaryCta: 'Explorar Estudio',
      loopbackBadge: '127.0.0.1 // PrivacyGate activo',
      toolsLabel: 'Conectores activos',
    },
    signalRouter: {
      eyebrow: '03 // ENRUTADOR',
      title: 'Conmutador de señal con compuerta de privacidad',
      subtitle:
        'Cada ejecución atraviesa PrivacyGate, aislamiento en Git Worktree y Quality Gate antes de tocar el repositorio principal.',
      metrics: [
        { value: '127.0.0.1', label: 'Loopback estricto', accent: true },
        { value: '100%', label: 'PrivacyGate' },
        { value: '9', label: 'Adaptadores CLI' },
        { value: 'Rust + Tauri v2', label: 'Núcleo nativo' },
      ],
      nodesHeading: 'Nodos enrutables',
      gatesHeading: 'Ruta verificada',
      gates: ['PrivacyGate', 'Git Worktree', 'Quality Gate'],
      policyHeading: 'Política activa de ruta',
      tierLabel: 'Nivel',
      tierNames: {
        paid: 'Pago / OAuth',
        free: 'Gratuito',
        local: 'Local',
      },
      sensitivityLabel: 'Sensibilidad',
      roleLabel: 'Rol de contexto',
      destinationLabel: 'Destino puente',
      commandLabel: 'Resolución CLI',
    },
    downloadPortal: {
      eyebrow: '04 // DESCARGAR',
      headline: 'Teje tu propio flujo local.',
      subtitle:
        'Compila el binario nativo en Tauri v2, prueba el modo demo en segundos o delega la instalación a tu agente.',
      copy: 'Copiar',
      copied: 'Copiado',
      primaryCta: 'Abrir repositorio',
      secondaryCta: 'Builds de escritorio',
      stackBadge: 'MIT · Rust 2024 · Tauri v2 · Win / Mac / Linux',
    },
  },
  en: {
    navbar: {
      brand: 'LOOM // TELAR',
      links: {
        reel: 'Reel',
        studio: 'Studio',
        router: 'Router',
        download: 'Download',
      },
      langToggleAria: 'Switch language to Spanish',
      soundOnAria: 'Mute sound',
      soundOffAria: 'Enable sound',
      githubCta: 'GitHub',
    },
    hero: {
      eyebrow: 'LOCAL MULTI-AGENT ORCHESTRATOR',
      line1: 'Weave CLI agents',
      line2: 'on one local loom.',
      title: 'Weave CLI agents on one local loom.',
      subtitle:
        'Coordinate Claude Code, Codex, Gemini, Antigravity, OpenCode, and OmniRoute across isolated git worktrees on 127.0.0.1.',
      primaryCta: 'Install Loom',
      secondaryCta: 'Explore Studio',
      loopbackBadge: '127.0.0.1 // PrivacyGate active',
      toolsLabel: 'Active connectors',
    },
    signalRouter: {
      eyebrow: '03 // SIGNAL_ROUTER',
      title: 'Privacy-gated signal switchboard',
      subtitle:
        'Every task passes through PrivacyGate, Git Worktree isolation, and Quality Gate before touching your main branch.',
      metrics: [
        { value: '127.0.0.1', label: 'Strict loopback', accent: true },
        { value: '100%', label: 'PrivacyGate' },
        { value: '9', label: 'CLI adapters' },
        { value: 'Rust + Tauri v2', label: 'Native core' },
      ],
      nodesHeading: 'Routable nodes',
      gatesHeading: 'Verified pipeline',
      gates: ['PrivacyGate', 'Git Worktree', 'Quality Gate'],
      policyHeading: 'Active route policy',
      tierLabel: 'Tier',
      tierNames: {
        paid: 'Paid / OAuth',
        free: 'Free tier',
        local: 'Local',
      },
      sensitivityLabel: 'Sensitivity',
      roleLabel: 'Context role',
      destinationLabel: 'Bridge target',
      commandLabel: 'CLI resolution',
    },
    downloadPortal: {
      eyebrow: '04 // DOWNLOAD',
      headline: 'Weave your own local workflow.',
      subtitle:
        'Run the native Tauri v2 desktop app, launch deterministic demo mode in seconds, or let your local AI agent set it up.',
      copy: 'Copy',
      copied: 'Copied',
      primaryCta: 'Open repository',
      secondaryCta: 'Desktop builds',
      stackBadge: 'MIT · Rust 2024 · Tauri v2 · Win / Mac / Linux',
    },
  },
};

export function readStoredLang(): Lang {
  if (typeof window === 'undefined') {
    return DEFAULT_LANG;
  }
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
  } catch {
    return DEFAULT_LANG;
  }
  return DEFAULT_LANG;
}

export function isLang(value: unknown): value is Lang {
  return value === 'es' || value === 'en';
}
