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
}: GooeyNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);



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



    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll('.particle');
      particles.forEach(p => filterRef.current!.removeChild(p));
      // makeParticles(filterRef.current, palette); // Disable particle animations
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
      textRef.current?.classList.add('active');
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
