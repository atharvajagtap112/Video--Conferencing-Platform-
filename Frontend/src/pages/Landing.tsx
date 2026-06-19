import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Video,
  Shield,
  Zap,
  Users,
  ArrowRight,
  MonitorSmartphone,
  MessageSquare,
  Globe,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";

const features = [
  {
    icon: Video,
    title: "HD Video & Audio",
    description:
      "Crystal-clear video conferencing powered by LiveKit SFU with adaptive streaming and simulcast.",
  },
  {
    icon: Shield,
    title: "Secure Meetings",
    description:
      "End-to-end encrypted rooms with JWT authentication. Only invited participants can join.",
  },
  {
    icon: Zap,
    title: "Low Latency",
    description:
      "Built on WebRTC with server-side media routing for sub-200ms latency worldwide.",
  },
  {
    icon: Users,
    title: "Up to 500 Participants",
    description:
      "Scale from 1-on-1 calls to large team meetings. Dynamic grid adapts to any group size.",
  },
  {
    icon: MonitorSmartphone,
    title: "Screen Sharing",
    description:
      "Share your screen, a window, or a tab with one click. Perfect for presentations.",
  },
  {
    icon: MessageSquare,
    title: "In-call Chat",
    description:
      "Send messages during the meeting. Share links, notes, and reactions in real time.",
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function Landing() {
  return (
    <PageTransition>
     

      <main className="relative ">
        {/* ── Hero ── */}
        <section className="relative py-24 sm:py-32 lg:py-40">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full bg-indigo-600/5 blur-[100px]" />
          </div>

          <div className="container text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.25, 0.46, 0.45, 0.94] as const,
              }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary">
                <Globe className="h-3.5 w-3.5" />
                Free & Open Source Video Conferencing
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Video meetings for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-cyan-400">
                  everyone
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Secure, high-quality video conferencing built with WebRTC and
                LiveKit. Create a room, share the link, and start collaborating
                in seconds.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              >
                <Button size="lg" className="text-base px-8 gap-2" asChild>
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8"
                  asChild
                >
                  <Link to="/login">Sign In</Link>
                </Button>
               
                  
               
              </motion.div>
            </motion.div>

            {/* Hero mockup */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              className="mt-16 max-w-5xl mx-auto"
            >
              <div className="relative rounded-2xl border border-white/10 bg-meeting-surface p-2 shadow-2xl shadow-primary/5">
                {/* Fake video grid */}
                <div className="grid grid-cols-3 gap-2 aspect-video rounded-xl overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-meeting-elevated to-meeting-control rounded-lg flex items-center justify-center"
                    >
                      <div
                        className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                          [
                            "bg-indigo-500",
                            "bg-rose-500",
                            "bg-emerald-500",
                            "bg-amber-500",
                            "bg-cyan-500",
                            "bg-violet-500",
                          ][i]
                        }`}
                      >
                        {["AJ", "SK", "MP", "RD", "VK", "NR"][i]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fake control bar */}
                <div className="flex items-center justify-center gap-3 py-3">
                  {[
                    { color: "bg-meeting-control", label: "🎤" },
                    { color: "bg-meeting-control", label: "📹" },
                    { color: "bg-meeting-control", label: "🖥️" },
                    { color: "bg-meeting-control", label: "📞" },
                  ].map((btn, i) => (
                    <div
                      key={i}
                      className={`h-10 w-10 ${btn.color} rounded-full flex items-center justify-center text-sm`}
                    >
                      {btn.label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24 border-t border-white/5">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Everything you need for great meetings
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built with a production-grade Spring Boot backend and LiveKit
                media server.
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={item}
                  className="group p-6 rounded-xl glass border-white/5 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 border-t border-white/5">
          <div className="container text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-bold">
                Ready to start meeting?
              </h2>
              <p className="text-muted-foreground text-lg">
                Create your free account and start a meeting in under 30
                seconds.
              </p>
              <Button size="lg" className="text-base px-10 gap-2" asChild>
                <Link to="/signup">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/5 py-8">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <span className="font-semibold">MeetSpace</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built by Atharva Jagtap — © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </main>
    </PageTransition>
  );
}