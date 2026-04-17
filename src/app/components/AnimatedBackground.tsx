import { useEffect, useRef } from "react";

/**
 * AnimatedBackground
 * - Mouse-reactive gradient blobs (parallax)
 * - NO particles / sparkles
 * - Theme-aware via CSS classes
 * - pointer-events: none, sits behind all content
 * - Disabled on mobile (<768px) for performance
 */
export function AnimatedBackground() {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const handleMove = (e: MouseEvent) => {
      mouse.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };
    };

    window.addEventListener("mousemove", handleMove, { passive: true });

    const render = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      if (blob1Ref.current) blob1Ref.current.style.transform = `translate3d(${mx * -60}px, ${my * -60}px, 0)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate3d(${mx * 120}px, ${my * 120}px, 0)`;
      if (blob3Ref.current) blob3Ref.current.style.transform = `translate3d(${mx * -40}px, ${my * -40}px, 0)`;
      rafId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-background" />

      <div
        ref={blob1Ref}
        className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full filter blur-[100px] opacity-[0.15] dark:opacity-20 bg-gradient-to-br from-indigo-500/40 to-slate-900/30 will-change-transform"
        style={{ animation: "bgFloat 20s infinite ease-in-out alternate" }}
      />
      <div
        ref={blob2Ref}
        className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-[0.12] dark:opacity-[0.25] bg-gradient-to-tl from-blue-600/40 to-blue-400/30 will-change-transform"
        style={{ animation: "bgFloat 15s infinite ease-in-out alternate-reverse" }}
      />
      <div
        ref={blob3Ref}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-[0.08] dark:opacity-10 bg-violet-500 will-change-transform"
      />

      <style>{`
        @keyframes bgFloat {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.05) translate(2%, 2%); }
          100% { transform: scale(1) translate(-2%, -2%); }
        }
      `}</style>
    </div>
  );
}
