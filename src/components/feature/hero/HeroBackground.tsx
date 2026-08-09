import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const NOISE_IMAGE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  accent: boolean;
}

export function HeroBackground() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${Math.round(2 + Math.random() * 96)}%`,
        top: `${Math.round(2 + Math.random() * 96)}%`,
        size: Math.round((1 + Math.random() * 2.2) * 10) / 10,
        duration: Math.round((7 + Math.random() * 9) * 10) / 10,
        delay: Math.round(Math.random() * 6 * 10) / 10,
        accent: Math.random() > 0.78,
      })),
    [],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base surface */}
      <div className="absolute inset-0 bg-surface" />

      {/* Very soft accent radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,var(--t-accent-glow),transparent_70%)]" />

      {/* Blurred gradient blobs */}
      <motion.div
        className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[130px]"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-[130px]"
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/20 blur-[120px]"
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: NOISE_IMAGE }}
      />

      {/* Animated floating particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={cn(
            "absolute rounded-full",
            p.accent ? "bg-accent/30" : "bg-primary/20",
          )}
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{ y: [0, -26, 0], opacity: [0, 0.9, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
