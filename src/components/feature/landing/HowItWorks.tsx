import { motion } from "framer-motion";
import { Mic, Sparkles, Music } from "lucide-react";

const steps = [
  {
    icon: Mic,
    number: "01",
    title: "Tap to Listen",
    desc: "Tap the microphone and play any song near you. We capture a few seconds of audio.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "AI Identifies It",
    desc: "Our recognition engine matches the audio against millions of tracks in seconds.",
  },
{
    icon: Music,
    number: "03",
    title: "Discover & Preview",
    desc: "Preview the song, explore album details, and view lyrics — all in one place.",
  },
];

export function HowItWorks() {
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
          How It Works
        </span>
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Three steps. <span className="text-gradient-green">Any song.</span>
        </h2>
      </motion.div>

      <div className="relative">
        {/* Connector line */}
        <div
          className="absolute left-[16%] right-[16%] top-14 hidden border-t border-dashed border-primary/20 lg:block"
          aria-hidden="true"
        />

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
              className="relative rounded-2xl border border-border bg-card/60 p-6 text-center backdrop-blur-sm"
            >
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
<step.icon className="h-6 w-6 text-primary" />
                <span className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {step.number}
                </span>
              </div>
              <h3 className="mb-2 font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-secondary-text">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
