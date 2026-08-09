import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { APP_NAME } from "@/constants";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${APP_NAME} home`}
    >
      <motion.div
        whileHover={{ scale: 1.05, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center justify-center rounded-xl bg-[#1D4533] shadow-lg shadow-[#1D4533]/30 transition-shadow group-hover:shadow-[#1D4533]/50",
          sizeClasses[size],
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
className="h-[60%] w-[60%] text-[#F7EAE0]"
          aria-hidden="true"
        >
          <path
            d="M9 18V5l12-2v13"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="18" r="3" fill="currentColor" />
          <circle cx="18" cy="16" r="3" fill="currentColor" />
        </svg>
      </motion.div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            SONGly
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            AI
          </span>
        </div>
      )}
    </Link>
  );
}
