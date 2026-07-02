import { useRef, useEffect, useCallback } from 'react';
import './GooeyNav.css';

export interface GooeyNavItem {
  label: string;
  disabled?: boolean;
  maintenance?: boolean;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  themeClassName?: string;
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  colorsByIndex?: number[][];
}

const GooeyNav = ({
  items,
  activeIndex,
  onSelect,
  className = '',
  themeClassName = '',
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1],
  colorsByIndex,
}: GooeyNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i: number, t: number, d: [number, number], r: number, palette: number[]) => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: palette[Math.floor(Math.random() * palette.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement, palette: number[]) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r, palette);
      element.classList.remove('active');

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add('active');
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            /* ignore */
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = useCallback((element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText.trim();
  }, []);

  const handleClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const item = items[index];
    if ((item?.disabled && !item?.maintenance) || activeIndex === index) return;

    const liEl = (e.currentTarget as HTMLElement).closest('li');
    if (!liEl) return;

    onSelect(index);
    updateEffectPosition(liEl);

    const palette = colorsByIndex?.[index] ?? colors;

    if (filterRef.current) {
      filterRef.current.classList.remove('active');
      void filterRef.current.offsetWidth;
      filterRef.current.classList.add('active');

      const particles = filterRef.current.querySelectorAll('.particle');
      particles.forEach(p => filterRef.current!.removeChild(p));
      
      const isLightTheme = document.body.classList.contains('light-theme');
      if (!isLightTheme) {
        makeParticles(filterRef.current, palette);
      }
    }

    if (textRef.current) {
      textRef.current.classList.remove('active');
      void textRef.current.offsetWidth;
      textRef.current.classList.add('active');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent, index);
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll('li')[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi as HTMLElement);
      
      if (filterRef.current) {
        filterRef.current.classList.remove('active');
        void filterRef.current.offsetWidth;
        filterRef.current.classList.add('active');
      }
      if (textRef.current) {
        textRef.current.classList.remove('active');
        void textRef.current.offsetWidth;
        textRef.current.classList.add('active');
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex];
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi as HTMLElement);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex, updateEffectPosition]);

  return (
    <div
      className={`gooey-nav-container gooey-nav-app ${themeClassName} ${className}`.trim()}
      ref={containerRef}
    >
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li
              key={item.label}
              className={`${activeIndex === index ? 'active' : ''}${item.disabled ? ' disabled' : ''}${item.maintenance ? ' maintenance' : ''}`}
            >
              <button
                type="button"
                className="gooey-nav-btn"
                onClick={e => handleClick(e, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                disabled={item.disabled && !item.maintenance}
                title={item.maintenance ? `${item.label} befindet sich in Wartung` : item.disabled ? `${item.label} nicht verfügbar` : item.label}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} />
      <span className="effect text" ref={textRef} />
    </div>
  );
};

export default GooeyNav;
