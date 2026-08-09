import { motion } from "framer-motion";
import { Mic, Music, Sparkles, Heart, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Song Recognition",
    desc: "Identify any song playing near you in seconds with AI-powered audio matching.",
  },
  {
    icon: Music,
    title: "Instant Lyrics",
    desc: "Multi-provider lyrics with automatic fallback, so the words are always there.",
  },
  {
    icon: Sparkles,
    title: "Smart Search",
    desc: "Find songs, artists, and albums with instant, debounced suggestions.",
  },
  {
    icon: Heart,
    title: "Favorites",
    desc: "Save songs, artists, and albums to revisit anytime — stored locally.",
  },
  {
    icon: Shield,
    title: "Privacy-First",
    desc: "Your data never leaves your browser. No accounts, no tracking.",
  },
  {
    icon: Zap,
    title: "Fast & Responsive",
    desc: "Lazy-loaded pages and smooth 60fps motion for a premium feel.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10 text-center"
      >
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
          Features
        </span>
<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Everything you need to <span className="text-gradient-green">find any song. By AI.</span>
        </h2>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.1, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-primary/30"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-1.5 font-bold text-foreground">{feature.title}</h3>
            <p className="text-sm text-secondary-text">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
