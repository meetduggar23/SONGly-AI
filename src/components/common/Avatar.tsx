import { cn } from "@/utils/cn";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({ src, alt = "User", size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "rounded-full object-cover ring-2 ring-border",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  // Fallback: initials avatar
  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
"flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover font-bold text-primary-foreground",
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label={alt}
    >
      {initials || "U"}
    </div>
  );
}
