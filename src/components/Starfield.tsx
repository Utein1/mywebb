import { useEffect, useRef, useState } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
  depth: number;
  tint: string;
  bright: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function Starfield({ accent = "#7cf5d0" }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let meteors: ShootingStar[] = [];
    let animationFrame = 0;
    let lastTime = 0;
    let nextMeteorAt = 3500 + Math.random() * 3500;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let cancelled = false;

    const palette = ["#dcecff", "#dcecff", "#dcecff", "#9ccfff", accent];

    const createStars = () => {
      const count = Math.max(
        90,
        Math.min(280, Math.round((width * height) / 7000)),
      );
      stars = Array.from({ length: count }, (_, index) => {
        const depth = 0.25 + Math.random() * 0.75;
        const bright = index % 17 === 0 || Math.random() > 0.94;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius:
            (bright ? 0.9 + Math.random() * 0.8 : 0.4 + Math.random() * 1.15) *
            depth,
          alpha: bright ? 0.9 : 0.28 + Math.random() * 0.62,
          phase: Math.random() * Math.PI * 2,
          speed: 0.00035 + Math.random() * 0.0008,
          depth,
          tint: palette[Math.floor(Math.random() * palette.length)],
          bright,
        };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
      draw(performance.now(), false);
    };

    const spawnMeteor = () => {
      const startX = width * (0.15 + Math.random() * 0.7);
      const startY = height * (0.05 + Math.random() * 0.35);
      const speed = 0.45 + Math.random() * 0.25;
      meteors.push({
        x: startX,
        y: startY,
        vx: -speed * 1.45,
        vy: speed * 0.6,
        life: 0,
        maxLife: 900 + Math.random() * 500,
      });
    };

    const draw = (time: number, animate = true) => {
      context.clearRect(0, 0, width, height);
      if (animate) {
        pointerX += (targetX - pointerX) * 0.025;
        pointerY += (targetY - pointerY) * 0.025;
      }

      for (const star of stars) {
        const twinkle = reducedMotion
          ? 1
          : 0.72 + Math.sin(time * star.speed + star.phase) * 0.28;
        const x = star.x + pointerX * 14 * star.depth;
        const y = star.y + pointerY * 10 * star.depth;
        context.beginPath();
        context.arc(x, y, star.radius, 0, Math.PI * 2);
        context.fillStyle = star.tint;
        context.globalAlpha = star.alpha * twinkle;
        if (star.bright) {
          context.shadowBlur = 9;
          context.shadowColor = star.tint;
        }
        context.fill();
        context.shadowBlur = 0;
        if (star.bright) {
          context.globalAlpha = star.alpha * twinkle * 0.28;
          context.strokeStyle = star.tint;
          context.lineWidth = 0.65;
          context.beginPath();
          context.moveTo(x - star.radius * 4.2, y);
          context.lineTo(x + star.radius * 4.2, y);
          context.moveTo(x, y - star.radius * 4.2);
          context.lineTo(x, y + star.radius * 4.2);
          context.stroke();
        }
      }
      context.globalAlpha = 1;

      if (!reducedMotion) {
        for (const meteor of meteors) {
          const progress = meteor.life / meteor.maxLife;
          const tailX = meteor.x - meteor.vx * 170 * (1 - progress * 0.4);
          const tailY = meteor.y - meteor.vy * 170 * (1 - progress * 0.4);
          const gradient = context.createLinearGradient(
            meteor.x,
            meteor.y,
            tailX,
            tailY,
          );
          gradient.addColorStop(0, "rgba(205, 255, 244, 0.8)");
          gradient.addColorStop(1, "rgba(205, 255, 244, 0)");
          context.beginPath();
          context.moveTo(meteor.x, meteor.y);
          context.lineTo(tailX, tailY);
          context.strokeStyle = gradient;
          context.lineWidth = 1.2;
          context.stroke();
          context.beginPath();
          context.arc(meteor.x, meteor.y, 1.5, 0, Math.PI * 2);
          context.fillStyle = "rgba(231, 255, 250, 0.9)";
          context.fill();
        }
      }
    };

    const frame = (time: number) => {
      if (cancelled) return;
      if (reducedMotion) {
        draw(time, false);
        return;
      }
      const delta = lastTime ? time - lastTime : 16;
      lastTime = time;
      draw(time, true);

      nextMeteorAt -= Math.min(delta, 64);
      if (nextMeteorAt <= 0) {
        if (meteors.length < 2) spawnMeteor();
        nextMeteorAt = 4500 + Math.random() * 6000;
      }

      meteors = meteors.filter((meteor) => {
        meteor.life += Math.min(delta, 64);
        meteor.x += meteor.vx * Math.min(delta, 64);
        meteor.y += meteor.vy * Math.min(delta, 64);
        return meteor.life < meteor.maxLife;
      });

      animationFrame = requestAnimationFrame(frame);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / Math.max(width, 1) - 0.5) * 2;
      targetY = (event.clientY / Math.max(height, 1) - 0.5) * 2;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else if (!reducedMotion) {
        lastTime = 0;
        animationFrame = requestAnimationFrame(frame);
      }
    };

    let resizeTimer = 0;
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    resize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [accent]);

  return (
    <div className="starfield-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="starfield-canvas" />
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="nebula nebula-c" />
      <div className="grid-haze" />
      <div className="vignette" />
    </div>
  );
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return reduced;
}
