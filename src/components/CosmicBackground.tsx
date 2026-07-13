import React, { useEffect, useRef } from 'react';

type CosmicBackgroundProps = { active: boolean };

type Body = {
  x: number;
  y: number;
  size: number;
  hue: string;
  phase: number;
  speed: number;
  planet: boolean;
  ring: boolean;
};

const PALETTE = [
  '#67dff0', '#5297ff', '#a995ff', '#ffffff', '#8be9ff', '#d7e9ff',
  '#ffafd9', '#ffd38a', '#9ff5c7', '#c9b6ff',
];

const random = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const rand = random(240406);
    const bodies: Body[] = Array.from({ length: 420 }, (_, index) => {
      const galaxyStar = index < 310;
      const radius = Math.sqrt(rand()) * .62;
      const angle = rand() * Math.PI * 2 + radius * 7.2;
      const planet = !galaxyStar && rand() > .9;
      return {
        x: galaxyStar ? .5 + Math.cos(angle) * radius : rand(),
        y: galaxyStar ? .42 + Math.sin(angle) * radius * .48 : rand(),
        size: planet ? 1.8 + rand() * 4.4 : .28 + rand() * 1.2,
        hue: PALETTE[Math.floor(rand() * PALETTE.length)],
        phase: rand() * Math.PI * 2,
        speed: .4 + rand() * 1.2,
        planet,
        ring: planet && rand() > .75,
      };
    });

    let width = 0;
    let height = 0;
    let frame = 0;
    let pointer = { x: -1000, y: -1000 };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = Math.max(window.innerHeight, 900);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => { pointer = { x: event.clientX, y: event.clientY }; };
    const leave = () => { pointer = { x: -1000, y: -1000 }; };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const seconds = time * .001;

      // A very soft elliptical core makes the stars read as one galaxy, not random dots.
      context.save();
      context.globalCompositeOperation = 'screen';
      const core = context.createRadialGradient(width * .5, height * .42, 0, width * .5, height * .42, Math.min(width, height) * .48);
      core.addColorStop(0, 'rgba(88, 136, 255, .075)');
      core.addColorStop(.34, 'rgba(130, 85, 255, .035)');
      core.addColorStop(1, 'rgba(8, 10, 16, 0)');
      context.fillStyle = core;
      context.fillRect(0, 0, width, height);
      context.restore();
      for (const body of bodies) {
        const baseX = body.x * width;
        const baseY = body.y * height;
        const breath = .42 + (Math.sin(seconds * body.speed * 2.0 + body.phase) + 1) * .29;
        const bob = Math.sin(seconds * body.speed * 0.7 + body.phase) * (body.planet ? .8 : .35);
        const dx = pointer.x - baseX;
        const dy = pointer.y - (baseY + bob);
        const distance = Math.hypot(dx, dy);
        const pull = Math.max(0, 1 - distance / 220);
        const shift = pull * pull * (body.planet ? 10 : 5);
        const x = baseX + (distance ? dx / distance * shift : 0);
        const y = baseY + bob + (distance ? dy / distance * shift : 0);

        context.save();
        context.globalAlpha = (body.planet ? .9 : .42 + pull * .28) * breath;
        context.fillStyle = body.hue;
        if (body.planet) {
          const planetFill = context.createRadialGradient(
            x - body.size * .28,
            y - body.size * .32,
            body.size * .06,
            x,
            y,
            body.size * .6,
          );
          planetFill.addColorStop(0, '#ffffff');
          planetFill.addColorStop(.2, body.hue);
          planetFill.addColorStop(.75, body.hue);
          planetFill.addColorStop(1, 'rgba(8, 10, 16, 0)');

          context.shadowColor = body.hue;
          context.shadowBlur = (body.size * 3.8 + pull * 10) * breath;
          context.fillStyle = planetFill;
          context.beginPath();
          context.arc(x, y, body.size * .62, 0, Math.PI * 2);
          context.fill();

          // Outer extra glow layer for planet
          context.globalAlpha *= 0.4;
          context.beginPath();
          context.arc(x, y, body.size * 1.18, 0, Math.PI * 2);
          context.fill();

          context.shadowBlur = 0;
          if (body.ring) {
            context.strokeStyle = body.hue;
            context.globalAlpha = (body.planet ? .88 : .38) * breath * .42;
            context.lineWidth = .8;
            context.beginPath();
            context.ellipse(x, y, body.size * 1.35, body.size * .5, -.3, 0, Math.PI * 2);
            context.stroke();
          }
        } else {
          context.shadowColor = body.hue;
          context.shadowBlur = (8 + pull * 14) * breath;
          context.beginPath();
          context.arc(x, y, Math.max(.5, body.size * breath), 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerleave', leave);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerleave', leave);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="cosmic-background" aria-hidden="true" />;
};
