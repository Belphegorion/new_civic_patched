// src/components/shared/BlogHero.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * BlogHero - responsive horizontal carousel
 * - avoids using element.scrollIntoView to prevent vertical page jumps
 * - centers cards by adjusting container.scrollLeft (horizontal-only)
 *
 * Props:
 *  - items: array of cards { id, title, excerpt, date, imageUrl, href }
 *  - autoRotateInterval: ms between automatic advances (default 4500). Set <=0 to disable.
 *  - showDots: boolean for pagination dots
 */
const BlogHero = ({ items = [], autoRotateInterval = 4500, showDots = false }) => {
  const sample = [
    { id: 1, title: "City Cleanups", excerpt: "Join your neighbourhood to keep streets clean.", date: "Sep 1, 2025", imageUrl: "" },
    { id: 2, title: "Report Potholes", excerpt: "Tips for photographing and reporting potholes.", date: "Aug 24, 2025", imageUrl: "" },
    { id: 3, title: "Park Revamp", excerpt: "See the park renovation before & after photos.", date: "Aug 10, 2025", imageUrl: "" },
    { id: 4, title: "Public Works Guide", excerpt: "How to contact the right department quickly.", date: "Jul 30, 2025", imageUrl: "" },
  ];

  const cards = items && items.length ? items : sample;
  const total = cards.length;

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Interaction refs
  const isInteractingRef = useRef(false);
  const autoRotateRef = useRef(null);

  // Touch swipe tracking
  const touchStartXRef = useRef(null);
  const touchDeltaThreshold = 40; // minimum px to treat as swipe

  // Ensure refs
  cardRefs.current = cardRefs.current.slice(0, total);
  const setCardRef = (el, i) => (cardRefs.current[i] = el);

  // --- helper: center a card horizontally inside container (prevents vertical jumps) ---
  const centerCardInContainer = (el) => {
    const container = containerRef.current;
    if (!container || !el) return;

    // offsetLeft is relative to offsetParent, which for a direct child of the container is container
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const containerWidth = container.clientWidth;

    // desired left to place element centered:
    let target = elLeft - (containerWidth - elWidth) / 2;

    // clamp
    const maxLeft = container.scrollWidth - containerWidth;
    if (target < 0) target = 0;
    if (target > maxLeft) target = maxLeft;

    // smooth horizontal scroll only (won't affect page vertical scroll)
    container.scrollTo({ left: target, behavior: "smooth" });
  };

  // Scroll to and set index safely
  const scrollToIndex = (idx) => {
    if (total === 0) return;
    const safeIdx = ((idx % total) + total) % total;
    const el = cardRefs.current[safeIdx];
    if (el) {
      centerCardInContainer(el);
      setCurrentIndex(safeIdx);
    }
  };

  const next = () => scrollToIndex(currentIndex + 1);
  const prev = () => scrollToIndex(currentIndex - 1);

  // Auto-rotate
  useEffect(() => {
    if (!autoRotateInterval || autoRotateInterval <= 0 || total <= 1) return undefined;

    const start = () => {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = setInterval(() => {
        if (!isInteractingRef.current) {
          setCurrentIndex((prevIdx) => {
            const nextIdx = (prevIdx + 1) % total;
            const el = cardRefs.current[nextIdx];
            if (el) centerCardInContainer(el);
            return nextIdx;
          });
        }
      }, autoRotateInterval);
    };

    start();
    return () => {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    };
  }, [autoRotateInterval, total]);

  // Pause on hover/focus and resume
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const onEnter = () => { isInteractingRef.current = true; };
    const onLeave = () => { isInteractingRef.current = false; };

    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("focusin", onEnter);
    container.addEventListener("mouseleave", onLeave);
    container.addEventListener("focusout", onLeave);

    return () => {
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("focusin", onEnter);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("focusout", onLeave);
    };
  }, []);

  // Keyboard navigation when container focused
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        isInteractingRef.current = true;
        next();
        setTimeout(() => { isInteractingRef.current = false; }, 600);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        isInteractingRef.current = true;
        prev();
        setTimeout(() => { isInteractingRef.current = false; }, 600);
      }
    };

    container.addEventListener("keydown", onKey);
    return () => container.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, total]);

  // Keep currentIndex in sync when user manually scrolls (debounced)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let timer = null;

    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
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
      }, 110);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [currentIndex, total]);

  // Touch swipe handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const onTouchStart = (e) => {
      isInteractingRef.current = true;
      const t = e.touches && e.touches[0];
      touchStartXRef.current = t ? t.clientX : null;
    };

    const onTouchMove = () => {
      isInteractingRef.current = true;
    };

    const onTouchEnd = (e) => {
      const startX = touchStartXRef.current;
      if (startX == null) {
        isInteractingRef.current = false;
        return;
      }
      const endX = (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX) || null;
      if (endX != null) {
        const delta = endX - startX;
        if (Math.abs(delta) > touchDeltaThreshold) {
          if (delta < 0) next();
          else prev();
        } else {
          // small swipe: snap back to nearest
          const el = cardRefs.current[currentIndex];
          if (el) centerCardInContainer(el);
        }
      }
      touchStartXRef.current = null;
      setTimeout(() => { isInteractingRef.current = false; }, 300);
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Recenter on resize
  useEffect(() => {
    const onResize = () => {
      const el = cardRefs.current[currentIndex];
      if (el) centerCardInContainer(el);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex]);

  // Defensive: if total changes and currentIndex out of range
  useEffect(() => {
    if (currentIndex >= total) setCurrentIndex(0);
  }, [total, currentIndex]);

  // When currentIndex changes programmatically, center the card
  useEffect(() => {
    const el = cardRefs.current[currentIndex];
    if (el) {
      const t = setTimeout(() => centerCardInContainer(el), 60);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <section className="w-full py-8">
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-1">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">From the blog</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Latest updates & guides</p>
        </div>

        {/* Desktop arrows (absolute) */}
        <div className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={() => { isInteractingRef.current = true; prev(); setTimeout(()=> isInteractingRef.current = false, 600); }}
            aria-label="Previous"
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/80 shadow hover:scale-105 transition"
          >
            <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 6 L9 12 L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={() => { isInteractingRef.current = true; next(); setTimeout(()=> isInteractingRef.current = false, 600); }}
            aria-label="Next"
            className="p-2 rounded-full bg-white/90 dark:bg-gray-800/80 shadow hover:scale-105 transition"
          >
            <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          className="overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-3 sm:gap-4 items-stretch py-2 min-w-max">
            {cards.map((card, i) => (
              <article
                key={card.id}
                ref={(el) => setCardRef(el, i)}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${total}: ${card.title}`}
                className="min-w-[200px] sm:min-w-[260px] max-w-[85vw] sm:max-w-xs snap-center bg-white dark:bg-gray-800 glass rounded-2xl shadow-md transform transition-all duration-300"
              >
                <a href={card.href || "#"} className="block relative rounded-t-2xl overflow-hidden">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.title} loading="lazy" className="w-full h-32 sm:h-36 object-cover" />
                  ) : (
                    <div className="h-32 sm:h-36 w-full bg-gradient-to-tr from-primary-gradient-start to-primary-gradient-end flex items-end p-3 sm:p-4">
                      <h4 className="text-white text-base sm:text-lg font-semibold leading-tight">{card.title}</h4>
                    </div>
                  )}
                </a>

                <div className="p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-3">{card.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{card.date}</div>
                    <a href={card.href || "#"} className="text-[11px] sm:text-xs font-medium text-primary hover:underline">Read</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden justify-center gap-4 mt-3">
          <button onClick={() => { isInteractingRef.current = true; prev(); setTimeout(()=> isInteractingRef.current = false, 600); }} aria-label="Previous" className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-700 text-sm shadow">Prev</button>
          <button onClick={() => { isInteractingRef.current = true; next(); setTimeout(()=> isInteractingRef.current = false, 600); }} aria-label="Next" className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-700 text-sm shadow">Next</button>
        </div>

        {/* Dots */}
        {showDots && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {cards.map((_, i) => (
              <button
                key={`dot-${i}`}
                onClick={() => { isInteractingRef.current = true; scrollToIndex(i); setTimeout(()=> isInteractingRef.current = false, 400); }}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full ${i === currentIndex ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
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
