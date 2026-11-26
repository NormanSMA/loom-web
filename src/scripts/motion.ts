import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { playLandingSound } from './sound';

gsap.registerPlugin(ScrollTrigger);

const INTRO_SEEN_KEY = 'loom_intro_seen';
const INTRO_FALLBACK_MS = 1200;
const CARRET_MAX_RETRIES = 20;
const CARRET_RETRY_INTERVAL_MS = 100;

function readIntroSeen(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Ignore storage quota or sandbox restrictions.
  }
}

function revealLinesImmediately(lines: HTMLElement[]): void {
  for (const line of lines) {
    gsap.set(line, {
      opacity: 1,
      clearProps: 'transform,clipPath',
    });
  }
}

function setupIntroCurtain(cleanups: Array<() => void>): void {
  const intro = document.getElementById('loom-intro');
  if (!intro) {
    return;
  }

  const finishIntro = () => {
    gsap.set(intro, {
      yPercent: -100,
      pointerEvents: 'none',
      visibility: 'hidden',
    });
    writeIntroSeen();
  };

  if (readIntroSeen()) {
    finishIntro();
    return;
  }

  const bar = intro.querySelector<HTMLElement>('[data-intro-bar]');
  const progressEl = intro.querySelector<HTMLElement>('[data-intro-progress]');
  const counter = { value: 0 };
  let completed = false;

  const fallbackTimer = window.setTimeout(() => {
    if (!completed) {
      completed = true;
      finishIntro();
    }
  }, INTRO_FALLBACK_MS);

  cleanups.push(() => {
    window.clearTimeout(fallbackTimer);
  });

  const tl = gsap.timeline({
    onComplete: () => {
      if (!completed) {
        completed = true;
        window.clearTimeout(fallbackTimer);
        finishIntro();
      }
    },
  });

  if (bar) {
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    tl.to(
      bar,
      {
        scaleX: 1,
        duration: 0.75,
        ease: 'power3.out',
      },
      0,
    );
  }

  if (progressEl) {
    tl.to(
      counter,
      {
        value: 100,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => {
          const digits = String(Math.round(counter.value)).padStart(2, '0');
          progressEl.textContent = digits;
        },
      },
      0,
    );
  }

  tl.to(
    intro,
    {
      yPercent: -100,
      duration: 0.55,
      ease: 'power4.inOut',
    },
    0.75,
  );
}

function setupLineReveals(): void {
  const allLines = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reveal="line"]'),
  );
  if (allLines.length === 0) {
    return;
  }

  const heroLines: HTMLElement[] = [];
  const sectionGroups = new Map<Element, HTMLElement[]>();
  const viewportCutoff = window.innerHeight * 0.92;

  for (const line of allLines) {
    const isHero =
      line.closest('[data-hero], #hero') !== null ||
      line.getBoundingClientRect().top < viewportCutoff;

    if (isHero) {
      heroLines.push(line);
      continue;
    }

    const groupKey = line.closest('section, header, footer, main') ?? document.body;
    const existing = sectionGroups.get(groupKey);
    if (existing) {
      existing.push(line);
    } else {
      sectionGroups.set(groupKey, [line]);
    }
  }

  if (heroLines.length > 0) {
    gsap.fromTo(
      heroLines,
      {
        y: 26,
        opacity: 0,
        clipPath: 'inset(0% 0% 100% 0%)',
      },
      {
        y: 0,
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'transform,clipPath',
      },
    );
  }

  for (const [triggerEl, groupLines] of sectionGroups) {
    gsap.fromTo(
      groupLines,
      {
        y: 26,
        opacity: 0,
        clipPath: 'inset(0% 0% 100% 0%)',
      },
      {
        y: 0,
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'transform,clipPath',
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 86%',
          once: true,
        },
      },
    );
  }
}

function setupParallax(): void {
  const parallaxElements = Array.from(
    document.querySelectorAll<HTMLElement>('[data-parallax]'),
  );

  for (const el of parallaxElements) {
    const rawOffset = Number(el.dataset.parallax ?? 30);
    const offset = Number.isFinite(rawOffset) ? rawOffset : 30;

    gsap.fromTo(
      el,
      { y: -offset * 0.35 },
      {
        y: offset,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  }
}

function setupCarretScroll(): () => void {
  let wired = false;
  let retries = 0;
  let retryTimer = 0;
  let skewResetTimer = 0;
  let observer: MutationObserver | null = null;
  let carretCtx: gsap.Context | null = null;
  let active = true;

  const tryWire = (): boolean => {
    if (!active || wired) {
      return wired;
    }

    const section = document.getElementById('carret-section');
    const track = document.getElementById('carret-track');
    if (!section || !track) {
      return false;
    }

    wired = true;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (retryTimer !== 0) {
      window.clearInterval(retryTimer);
      retryTimer = 0;
    }

    const pinHost = document.getElementById('carret-pin-host') ?? section;

    carretCtx = gsap.context(() => {
      const counterEl = section.querySelector<HTMLElement>('[data-carret-counter]');
      let activeFrameIndex = 1;
      const cards = Array.from(
        track.querySelectorAll<HTMLElement>('[data-carret-card]'),
      );

      const skewSetters = cards.map((card) =>
        gsap.quickTo(card, 'skewX', {
          duration: 0.25,
          ease: 'power2.out',
        }),
      );

      const resetSkew = () => {
        for (const setSkew of skewSetters) {
          setSkew(0);
        }
      };

      const getTravelDistance = (): number => {
        const parentWidth = track.parentElement?.clientWidth ?? window.innerWidth;
        return Math.min(0, -(track.scrollWidth - parentWidth));
      };

      gsap.to(track, {
        x: getTravelDistance,
        ease: 'none',
        scrollTrigger: {
          trigger: pinHost,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          end: () => `+=${Math.max(600, track.scrollWidth - window.innerWidth + 240)}`,
          onUpdate: (self) => {
            const frameIndex = Math.min(5, Math.max(1, Math.floor(self.progress * 5) + 1));
            if (frameIndex !== activeFrameIndex) {
              activeFrameIndex = frameIndex;
              playLandingSound('shutter');
            }
            if (counterEl && track.hasAttribute('data-carret-ready')) {
              counterEl.textContent = `${String(frameIndex).padStart(2, '0')} / 05`;
            }

            const clampedSkew = gsap.utils.clamp(
              -3.5,
              3.5,
              self.getVelocity() / -350,
            );
            for (const setSkew of skewSetters) {
              setSkew(clampedSkew);
            }

            if (skewResetTimer !== 0) {
              window.clearTimeout(skewResetTimer);
            }
            skewResetTimer = window.setTimeout(resetSkew, 120);
          },
          onLeave: resetSkew,
          onLeaveBack: resetSkew,
        },
      });
    }, pinHost);

    ScrollTrigger.refresh();
    return true;
  };

  if (!tryWire()) {
    observer = new MutationObserver(() => {
      tryWire();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    retryTimer = window.setInterval(() => {
      retries += 1;
      if (tryWire() || retries >= CARRET_MAX_RETRIES) {
        window.clearInterval(retryTimer);
        retryTimer = 0;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    }, CARRET_RETRY_INTERVAL_MS);
  }

  return () => {
    active = false;
    if (retryTimer !== 0) {
      window.clearInterval(retryTimer);
      retryTimer = 0;
    }
    if (skewResetTimer !== 0) {
      window.clearTimeout(skewResetTimer);
      skewResetTimer = 0;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (carretCtx) {
      carretCtx.revert();
      carretCtx = null;
    }
  };
}

function setupMagneticButtons(cleanups: Array<() => void>): void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>('[data-magnetic]'),
  );
  const maxOffset = 10;

  for (const button of buttons) {
    const xTo = gsap.quickTo(button, 'x', { duration: 0.32, ease: 'power3.out' });
    const yTo = gsap.quickTo(button, 'y', { duration: 0.32, ease: 'power3.out' });

    const onPointerMove = (event: PointerEvent) => {
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      xTo(gsap.utils.clamp(-maxOffset, maxOffset, relX * maxOffset));
      yTo(gsap.utils.clamp(-maxOffset, maxOffset, relY * maxOffset));
    };

    const onPointerLeave = () => {
      xTo(0);
      yTo(0);
    };

    button.addEventListener('pointermove', onPointerMove);
    button.addEventListener('pointerleave', onPointerLeave);

    cleanups.push(() => {
      button.removeEventListener('pointermove', onPointerMove);
      button.removeEventListener('pointerleave', onPointerLeave);
    });
  }
}

function setupSpotlights(cleanups: Array<() => void>): void {
  const spotlights = Array.from(
    document.querySelectorAll<HTMLElement>('[data-spotlight]'),
  );

  for (const el of spotlights) {
    const onPointerMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      el.style.setProperty('--my', `${event.clientY - rect.top}px`);
      el.style.setProperty('--spot-op', '1');
    };

    const onPointerLeave = () => {
      el.style.setProperty('--spot-op', '0');
    };

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);

    cleanups.push(() => {
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    });
  }
}

/**
 * Initializes the GSAP + ScrollTrigger + Lenis motion engine for Loom.
 * Returns a cleanup callback that tears down all observers, listeners, and tickers.
 */
export function initMotionEngine(): () => void {
  const onMagneticEnter = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.matches('[data-magnetic]')) {
      playLandingSound('hover');
    }
  };
  document.addEventListener('pointerenter', onMagneticEnter, true);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    const intro = document.getElementById('loom-intro');
    if (intro) {
      gsap.set(intro, { display: 'none' });
    }
    const lines = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal="line"]'),
    );
    revealLinesImmediately(lines);
    return () => document.removeEventListener('pointerenter', onMagneticEnter, true);
  }

  const cleanups: Array<() => void> = [];

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const onTicker = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(onTicker);
  gsap.ticker.lagSmoothing(0);

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute('href');
    if (!href) {
      return;
    }
    if (href === '#') {
      event.preventDefault();
      lenis.scrollTo(0);
      return;
    }
    const destination = document.querySelector<HTMLElement>(href);
    if (destination) {
      event.preventDefault();
      lenis.scrollTo(destination);
    }
  };

  document.addEventListener('click', onDocumentClick);

  const ctx = gsap.context(() => {
    setupIntroCurtain(cleanups);
    setupLineReveals();
    setupParallax();
    setupMagneticButtons(cleanups);
    setupSpotlights(cleanups);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      return setupCarretScroll();
    });
  });

  return () => {
    document.removeEventListener('pointerenter', onMagneticEnter, true);
    document.removeEventListener('click', onDocumentClick);
    gsap.ticker.remove(onTicker);
    for (const cleanup of cleanups) {
      cleanup();
    }
    ctx.revert();
    lenis.destroy();
  };
}
