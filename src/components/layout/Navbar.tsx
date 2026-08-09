import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Search, Menu, X, Home, Heart, Info, AudioLines, TrendingUp, Moon, Sun } from "lucide-react";
import { cn } from "@/utils/cn";
import { Logo } from "@/components/common/Logo";
import { useUI } from "@/context/useUI";
import { useTheme } from "@/context/ThemeContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Listen", path: "/detect", icon: AudioLines },
  { label: "Trending", path: "/trending", icon: TrendingUp },
  { label: "Favorites", path: "/favorites", icon: Heart },
  { label: "About", path: "/about", icon: Info },
];

/** Compact circular theme toggle — Moon in dark mode, Sun in light mode. */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all duration-300 hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center justify-center"
      >
        {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      </motion.span>
    </button>
  );
}

export function Navbar() {
  const { openSearch, mobileNavOpen, openMobileNav, closeMobileNav } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompactNavigation = useMediaQuery("(max-width: 1023px)");

  // Close the drawer when its desktop navigation replacement becomes visible.
  useEffect(() => {
    if (!isCompactNavigation) closeMobileNav();
  }, [isCompactNavigation, closeMobileNav]);

  const handleNavClick = (path: string) => {
    closeMobileNav();
    navigate(path);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="glass sticky top-0 z-50 border-b border-border"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={item.label}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-secondary-text hover:bg-card hover:text-foreground",
                  )
                }
                >
                  <item.icon className="h-4 w-4" />
                  {item.path !== "/" && item.label}
                </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={openSearch}
              className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/60 px-4 text-sm text-secondary-text transition-all hover:border-primary/40 hover:text-primary"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search…</span>
            </button>
            {isCompactNavigation && (
              <button
                onClick={openMobileNav}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-secondary-text transition-colors hover:text-primary"
                aria-label="Open menu"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileNav}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-[91] flex h-full w-72 flex-col bg-card/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo />
                <button
                  onClick={closeMobileNav}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-secondary-text hover:text-primary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav id="mobile-navigation" className="flex flex-col gap-1" aria-label="Mobile">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      location.pathname === item.path
                        ? "bg-primary/10 text-primary"
                        : "text-secondary-text hover:bg-border/40 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="mt-auto border-t border-border pt-4">
                <button
                  onClick={() => {
                    closeMobileNav();
                    openSearch();
                  }}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  Search songs…
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
