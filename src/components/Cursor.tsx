// components/CursorGlow.tsx

import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const [cursorActive, setCursorActive] = useState(false);

  const glowRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.left = `${mouseX}px`;
        dotRef.current.style.top = `${mouseY}px`;
      }

      setCursorActive(true);
    };

    const handleMouseLeave = () => {
      setCursorActive(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    let frameId: number;

    const animateGlow = () => {
      glowX += (mouseX - glowX) * 0.06;
      glowY += (mouseY - glowY) * 0.06;

      if (glowRef.current) {
        glowRef.current.style.left = `${glowX}px`;
        glowRef.current.style.top = `${glowY}px`;
      }

      frameId = requestAnimationFrame(animateGlow);
    };

    animateGlow();

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);

      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className={`cursor-glow ${cursorActive ? "active" : ""}`}
        aria-hidden="true"
      />

      <div
        ref={dotRef}
        className={`cursor-dot ${cursorActive ? "active" : ""}`}
        aria-hidden="true"
      />
    </>
  );
}