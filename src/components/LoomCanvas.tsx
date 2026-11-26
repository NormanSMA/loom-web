import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type LoomStateName = 'thinking' | 'reading' | 'analysing' | 'debugging';

const STATE_ACCENTS: Record<LoomStateName, readonly [number, number, number]> = {
  thinking: [0.13, 0.77, 0.37],
  reading: [0.94, 0.27, 0.27],
  analysing: [0.23, 0.51, 0.96],
  debugging: [0.38, 0.65, 0.98],
};

const DEFAULT_ACCENT: readonly [number, number, number] = STATE_ACCENTS.analysing;

const LOOM_DISPLACEMENT_GLSL = /* glsl */ `
  vec3 computeLoomDisplacement(vec3 basePos, float time, float scrollVal, vec2 pointerNdc, float velocity, out float rippleProximity) {
    vec3 pos = basePos;
    float scrollPhase = scrollVal * 4.2;

    float primaryWave = sin(pos.x * 1.15 + time * 0.55 + scrollPhase) * cos(pos.y * 1.35 - time * 0.42);
    float harmonicWave = sin(pos.x * 2.35 - pos.y * 1.75 + time * 0.85 - scrollPhase * 0.6) * 0.35;

    vec2 pointerWorld = pointerNdc * vec2(3.2, 2.0);
    float dist = length(pos.xy - pointerWorld);
    float clampedVel = min(velocity, 1.5);
    float ripple = exp(-dist * 1.15) * (0.16 + clampedVel * 0.22) * sin(dist * 4.5 - time * 3.0);

    pos.z += (primaryWave * 0.24 + harmonicWave * 0.14) + ripple;
    rippleProximity = exp(-dist * 1.35);
    return pos;
  }
`;

const MESH_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uPointer;
  uniform float uVelocity;

  varying vec2 vUv;
  varying float vElevation;
  varying float vRipple;
  varying vec2 vWorldPos;

  ${LOOM_DISPLACEMENT_GLSL}

  void main() {
    vUv = uv;
    float rippleProximity = 0.0;
    vec3 displaced = computeLoomDisplacement(position, uTime, uScroll, uPointer, uVelocity, rippleProximity);

    vElevation = displaced.z;
    vRipple = rippleProximity;
    vWorldPos = displaced.xy;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const MESH_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uAccent;
  uniform float uVelocity;

  varying vec2 vUv;
  varying float vElevation;
  varying float vRipple;
  varying vec2 vWorldPos;

  void main() {
    float bend = vElevation * 0.48;
    vec2 gridUv = vUv * vec2(38.0, 26.0);

    float warpPhase = gridUv.x + bend * 0.24;
    float weftPhase = gridUv.y - bend * 0.2;

    float warpDist = abs(fract(warpPhase) - 0.5);
    float weftDist = abs(fract(weftPhase) - 0.5);

    float fwX = max(fwidth(warpPhase) * 1.25, 0.016);
    float fwY = max(fwidth(weftPhase) * 1.25, 0.016);

    float warpLine = 1.0 - smoothstep(0.0, fwX * 1.3, warpDist);
    float weftLine = 1.0 - smoothstep(0.0, fwY * 1.3, weftDist);

    float warpHalo = (1.0 - smoothstep(0.0, 0.16, warpDist)) * 0.22;
    float weftHalo = (1.0 - smoothstep(0.0, 0.16, weftDist)) * 0.22;

    float cellParity = mod(floor(warpPhase) + floor(weftPhase), 2.0);
    float shuttleWave = 0.5 + 0.5 * sin(uTime * 1.45 + vWorldPos.x * 1.75 - vWorldPos.y * 1.25);

    float warpSignal = (warpLine + warpHalo) * mix(0.75, 1.12, cellParity);
    float weftSignal = (weftLine + weftHalo) * mix(1.12, 0.75, cellParity);

    float intersection = clamp(warpLine * weftLine * 2.2, 0.0, 1.0);
    float combinedSignal = clamp(max(warpSignal, weftSignal) + intersection * 0.45, 0.0, 1.35);

    vec3 baseSteel = vec3(0.42, 0.49, 0.64);
    float accentMix = clamp(
      smoothstep(-0.18, 0.34, vElevation) * 0.65 +
      vRipple * (0.42 + min(uVelocity, 1.0) * 0.35) +
      intersection * 0.4 +
      shuttleWave * 0.18,
      0.0,
      1.0
    );

    vec3 filamentColor = mix(baseSteel, uAccent, accentMix);
    filamentColor += uAccent * intersection * 0.45;

    float edgeX = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
    float edgeY = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
    float vignette = edgeX * edgeY;

    float alpha = clamp(combinedSignal * vignette * 0.68, 0.0, 0.88);
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(filamentColor, alpha);
  }
`;

const POINTS_VERTEX_SHADER = /* glsl */ `
  attribute float aPhase;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uPointer;
  uniform float uVelocity;
  uniform float uPixelRatio;

  varying float vPhase;
  varying float vRipple;
  varying vec2 vUv;

  ${LOOM_DISPLACEMENT_GLSL}

  void main() {
    vPhase = aPhase;
    vUv = vec2((position.x / 8.0) + 0.5, (position.y / 5.0) + 0.5);

    float rippleProximity = 0.0;
    vec3 displaced = computeLoomDisplacement(position, uTime, uScroll, uPointer, uVelocity, rippleProximity);
    vRipple = rippleProximity;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float pulse = 0.78 + 0.28 * sin(uTime * 2.1 + aPhase);
    float baseSize = (3.6 + rippleProximity * 3.8 + min(uVelocity, 1.2) * 1.4) * pulse * uPixelRatio;
    gl_PointSize = clamp(baseSize * (4.0 / max(-mvPosition.z, 1.0)), 1.5, 11.0);
  }
`;

const POINTS_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uAccent;

  varying float vPhase;
  varying float vRipple;
  varying vec2 vUv;

  void main() {
    vec2 centered = 2.0 * gl_PointCoord - 1.0;
    float radiusSq = dot(centered, centered);
    if (radiusSq > 1.0) discard;

    float glow = exp(-radiusSq * 4.2);
    float pulse = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 1.9 + vPhase));

    float edgeX = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
    float edgeY = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
    float vignette = edgeX * edgeY;

    vec3 nodeColor = mix(vec3(0.88, 0.93, 1.0), uAccent, 0.72);
    float alpha = clamp(glow * (pulse * 0.52 + vRipple * 0.48) * vignette, 0.0, 0.9);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(nodeColor, alpha);
  }
`;

function resolveStateAccent(detail: unknown): readonly [number, number, number] | null {
  let rawState: unknown = detail;
  if (typeof detail === 'object' && detail !== null && 'state' in detail) {
    rawState = (detail as { state?: unknown }).state;
  }

  if (typeof rawState !== 'string') {
    return null;
  }

  const normalized = rawState.trim().toLowerCase();
  if (normalized in STATE_ACCENTS) {
    return STATE_ACCENTS[normalized as LoomStateName];
  }
  return null;
}

function createFilamentNodesGeometry(): THREE.BufferGeometry {
  const cols = 38;
  const rows = 26;
  const count = cols * rows;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  let idx = 0;
  for (let r = 0; r < rows; r += 1) {
    const v = r / (rows - 1);
    const y = (v - 0.5) * 5.0;
    for (let c = 0; c < cols; c += 1) {
      const u = c / (cols - 1);
      const x = (u - 0.5) * 8.0;
      const offset = idx * 3;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = 0.012;
      phases[idx] = (c * 0.41 + r * 0.63) % (Math.PI * 2);
      idx += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  return geometry;
}

/**
 * Full-viewport kinetic woven loom WebGL background island.
 * Falls back silently to an obsidian gradient when WebGL is unavailable.
 */
export function LoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglAvailable(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      50,
    );
    camera.position.set(0, -0.35, 4.2);
    camera.lookAt(0, 0, 0);

    const currentAccent = new THREE.Vector3(
      DEFAULT_ACCENT[0],
      DEFAULT_ACCENT[1],
      DEFAULT_ACCENT[2],
    );
    const targetAccent = currentAccent.clone();

    const sharedTime = { value: 0 };
    const sharedScroll = { value: 0 };
    const sharedPointer = { value: new THREE.Vector2(0, 0) };
    const sharedVelocity = { value: 0 };

    const planeGeometry = new THREE.PlaneGeometry(8, 5, 72, 48);
    const planeMaterial = new THREE.ShaderMaterial({
      vertexShader: MESH_VERTEX_SHADER,
      fragmentShader: MESH_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: sharedTime,
        uScroll: sharedScroll,
        uPointer: sharedPointer,
        uVelocity: sharedVelocity,
        uAccent: { value: currentAccent },
      },
    });

    const loomMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    loomMesh.rotation.x = -0.38;
    loomMesh.position.set(0, -0.1, 0);
    scene.add(loomMesh);

    const pointsGeometry = createFilamentNodesGeometry();
    const pointsMaterial = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX_SHADER,
      fragmentShader: POINTS_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: sharedTime,
        uScroll: sharedScroll,
        uPointer: sharedPointer,
        uVelocity: sharedVelocity,
        uAccent: { value: currentAccent },
        uPixelRatio: { value: dpr },
      },
    });

    const filamentPoints = new THREE.Points(pointsGeometry, pointsMaterial);
    filamentPoints.rotation.x = -0.38;
    filamentPoints.position.set(0, -0.1, 0);
    scene.add(filamentPoints);

    let targetScroll = 0;
    const targetPointer = new THREE.Vector2(0, 0);
    const lastPointer = new THREE.Vector2(0, 0);
    let targetVelocity = 0;

    const updateScrollTarget = () => {
      const scrollable = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      targetScroll = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    };
    updateScrollTarget();

    const handlePointerMove = (event: PointerEvent) => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const nx = (event.clientX / width) * 2 - 1;
      const ny = -(event.clientY / height) * 2 + 1;

      const dx = nx - lastPointer.x;
      const dy = ny - lastPointer.y;
      lastPointer.set(nx, ny);
      targetPointer.set(nx, ny);
      targetVelocity = Math.min(Math.hypot(dx, dy) * 14, 1.8);
    };

    const handleResize = () => {
      if (!renderer) {
        return;
      }
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = Math.max(window.innerHeight, 1);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(nextDpr);
      renderer.setSize(width, height, false);
      const pixelRatioUniform = pointsMaterial.uniforms.uPixelRatio;
      if (pixelRatioUniform) {
        pixelRatioUniform.value = nextDpr;
      }
      updateScrollTarget();
    };

    const handleAccentEvent = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }
      const next = resolveStateAccent(event.detail);
      if (next) {
        targetAccent.set(next[0], next[1], next[2]);
      }
    };

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      sharedScroll.value = targetScroll;
      renderer.render(scene, camera);

      const handleReducedResize = () => {
        handleResize();
        renderer?.render(scene, camera);
      };

      window.addEventListener('resize', handleReducedResize, { passive: true });
      return () => {
        window.removeEventListener('resize', handleReducedResize);
        planeGeometry.dispose();
        planeMaterial.dispose();
        pointsGeometry.dispose();
        pointsMaterial.dispose();
        renderer?.dispose();
      };
    }

    let rafId = 0;
    let lastTimestamp = performance.now();
    let isDisposed = false;

    const tick = (now: number) => {
      if (isDisposed || document.hidden || !renderer) {
        return;
      }

      const delta = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      sharedTime.value += delta;
      const smoothFactor = 1 - Math.exp(-delta * 6.5);

      sharedScroll.value += (targetScroll - sharedScroll.value) * smoothFactor;
      sharedPointer.value.lerp(targetPointer, smoothFactor);

      sharedVelocity.value += (targetVelocity - sharedVelocity.value) * smoothFactor;
      targetVelocity *= Math.exp(-delta * 5.0);

      currentAccent.lerp(targetAccent, 1 - Math.exp(-delta * 4.5));

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafId !== 0 || document.hidden || isDisposed) {
        return;
      }
      lastTimestamp = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('loom:state-accent', handleAccentEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    startLoop();

    return () => {
      isDisposed = true;
      stopLoop();
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('loom:state-accent', handleAccentEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      planeGeometry.dispose();
      planeMaterial.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--accent-blue-soft),transparent_65%),linear-gradient(to_bottom,var(--bg-void),var(--bg-surface))]"
      aria-hidden="true"
    >
      {webglAvailable ? (
        <canvas
          ref={canvasRef}
          className="pointer-events-none block h-full w-full"
        />
      ) : null}
    </div>
  );
}

export default LoomCanvas;
