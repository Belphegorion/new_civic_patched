// src/components/shared/BlogHero.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * BlogHero - horizontal carousel with arrows + auto-rotate
 *
 * Props:
 * - items: optional array of cards; otherwise defaults to 10 sample items
 * - autoRotateInterval: ms between automatic advances (default 4500)
 * - showDots: boolean to show pagination dots (default false)
 */
const BlogHero = ({ items = [], autoRotateInterval = 4500, showDots = false }) => {
  // default sample: 10 items
  const sample = [
    { id: 1, title: 'City Cleanups', excerpt: 'Join your neighbourhood to keep streets clean.', date: 'Sep 1, 2025', imageUrl: '' },
    { id: 2, title: 'Report Potholes', excerpt: 'Tips for photographing and reporting potholes.', date: 'Aug 24, 2025', imageUrl: '' },
    { id: 3, title: 'Park Revamp', excerpt: 'See the park renovation before & after photos.', date: 'Aug 10, 2025', imageUrl: '' },
    { id: 4, title: 'Public Works Guide', excerpt: 'How to contact the right department quickly.', date: 'Jul 30, 2025', imageUrl: '' },
    { id: 5, title: 'Volunteer Drives', excerpt: 'Upcoming volunteer events around the city.', date: 'Jul 15, 2025', imageUrl: '' },
    { id: 6, title: 'Waste Reduction', excerpt: 'Small steps for big city waste reduction.', date: 'Jun 30, 2025', imageUrl: '' },
    { id: 7, title: 'Traffic Safety', excerpt: 'Community tips to improve traffic safety.', date: 'Jun 18, 2025', imageUrl: '' },
    { id: 8, title: 'Neighborhood Watch', excerpt: 'How to organize a local neighborhood watch.', date: 'May 20, 2025', imageUrl: '' },
    { id: 9, title: 'Green Initiatives', excerpt: 'Planting trees and creating green paths.', date: 'May 06, 2025', imageUrl: '' },
    { id: 10, title: 'Local News', excerpt: 'Important civic changes and announcements.', date: 'Apr 29, 2025', imageUrl: '' },
  ];

  const cards = items.length ? items : sample;
  const total = cards.length;

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoRotateRef = useRef(null);
  const isInteractingRef = useRef(false);

  // ensure cardRefs length
  cardRefs.current = [];
  const setCardRef = (el, i) => {
    cardRefs.current[i] = el;
  };

  const scrollToIndex = (idx) => {
    const safeIdx = ((idx % total) + total) % total;
    const el = cardRefs.current[safeIdx];
    if (el && containerRef.current) {
      // center the element in the horizontal container
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
      setCurrentIndex(safeIdx);
    }
  };

  const next = () => {
    scrollToIndex(currentIndex + 1);
  };
  const prev = () => {
    scrollToIndex(currentIndex - 1);
  };

  // Auto-rotate: start interval
  useEffect(() => {
    if (autoRotateInterval <= 0) return;

    const start = () => {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = setInterval(() => {
        if (!isInteractingRef.current) {
          // advance
          setCurrentIndex(prev => {
            const nextIdx = (prev + 1) % total;
            const el = cardRefs.current[nextIdx];
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
            return nextIdx;
          });
        }
      }, autoRotateInterval);
    };

    start();
    return () => clearInterval(autoRotateRef.current);
  }, [autoRotateInterval, total]);

  // Pause on hover/focus
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onEnter = () => { isInteractingRef.current = true; };
    const onLeave = () => { isInteractingRef.current = false; };

    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('focusin', onEnter);
    container.addEventListener('mouseleave', onLeave);
    container.addEventListener('focusout', onLeave);

    return () => {
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('focusin', onEnter);
      container.removeEventListener('mouseleave', onLeave);
      container.removeEventListener('focusout', onLeave);
    };
  }, []);

  // Keyboard navigation when container focused
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    container.addEventListener('keydown', onKey);
    return () => container.removeEventListener('keydown', onKey);
  }, [currentIndex, total]);

  // Keep currentIndex in sync if user manually scrolls to a different card
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timer = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      // throttle update after user stops scrolling for 120ms
      timer = setTimeout(() => {
        // find nearest card to center
        const rect = container.getBoundingClientRect();
        let nearest = 0;
        let nearestDist = Infinity;
        cardRefs.current.forEach((el, i) => {
          if (!el) return;
          const elRect = el.getBoundingClientRect();
          const elCenter = elRect.left + elRect.width / 2;
          const center = rect.left + rect.width / 2;
          const dist = Math.abs(center - elCenter);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = i;
          }
        });
        if (nearest !== currentIndex) setCurrentIndex(nearest);
      }, 120);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [currentIndex]);

  return (
    <section className="w-full py-8">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">From the blog</h3>
          <p className="text-sm text-gray-500 dark:text-gray-300">Latest updates & guides</p>
        </div>

        {/* Arrows */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
          <button
            onClick={() => { isInteractingRef.current = true; prev(); setTimeout(()=> isInteractingRef.current = false, 600); }}
            aria-label="Previous"
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/80 shadow hover:scale-105 transition"
          >
            <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none">
              <path d="M15 6 L9 12 L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
          <button
            onClick={() => { isInteractingRef.current = true; next(); setTimeout(()=> isInteractingRef.current = false, 600); }}
            aria-label="Next"
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/80 shadow hover:scale-105 transition"
          >
            <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none">
              <path d="M9 6 L15 12 L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scroll container */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Blog highlights"
          className="overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 6 }}
        >
          <div className="flex gap-4 items-stretch py-2" style={{ minWidth: 'max-content' }}>
            {cards.map((card, i) => (
              <article
                key={card.id}
                ref={(el) => setCardRef(el, i)}
                className={`min-w-[260px] max-w-xs snap-center bg-white dark:bg-gray-800 glass rounded-2xl shadow-md transform transition-all duration-300`}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}: ${card.title}`}
              >
                <a href={card.href || '#'} className="block relative rounded-t-2xl overflow-hidden">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      loading="lazy"
                      className="w-full h-36 object-cover transform transition-transform duration-500 hover:scale-105"
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div className="h-36 w-full bg-gradient-to-tr from-primary-gradient-start to-primary-gradient-end flex items-end p-4">
                      <div className="text-white">
                        <h4 className="text-lg font-semibold leading-tight">{card.title}</h4>
                      </div>
                    </div>
                  )}

                  {card.imageUrl && <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true" />}
                  {card.imageUrl && (
                    <div className="absolute left-4 bottom-3 z-10">
                      <h4 className="text-white text-lg font-semibold drop-shadow-sm leading-tight">{card.title}</h4>
                    </div>
                  )}
                </a>

                <div className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                    {card.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 dark:text-gray-500">{card.date}</div>
                    <a
                      href={card.href || '#'}
                      className="text-xs font-medium text-primary hover:underline"
                      aria-label={`Read more about ${card.title}`}
                    >
                      Read
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Dots (optional) */}
        {showDots && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { scrollToIndex(i); }}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full ${i === currentIndex ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass { background-color: rgba(255,255,255,0.6); backdrop-filter: blur(6px); }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        @media (prefers-reduced-motion: reduce) {
          .no-scrollbar * { transition: none !important; }
        }
      `}</style>
    </section>
  );
};

export default BlogHero;
