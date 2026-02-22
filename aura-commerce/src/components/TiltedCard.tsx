import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  glare?: boolean;
}

export const TiltedCard = ({
  children,
  className = "",
  maxTilt = 20,
  perspective = 800,
  scale = 1.05,
  glare = true,
}: TiltedCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setTilt({
        x: (y - 0.5) * -maxTilt * 2,
        y: (x - 0.5) * maxTilt * 2,
      });
      setGlarePos({ x: x * 100, y: y * 100 });
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{ perspective: `${perspective}px` }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isHovering ? scale : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
      {glare && isHovering && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
};
