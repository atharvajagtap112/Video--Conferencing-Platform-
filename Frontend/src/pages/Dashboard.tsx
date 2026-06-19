import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Plus,
  DoorOpen,
  Clock,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { CreateRoomDialog } from "@/components/dashboard/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/dashboard/JoinRoomDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/store";
import { useLiveKit } from "@/hooks/useLiveKit";

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { joinRoom, isJoining } = useLiveKit();
  const [quickJoinId, setQuickJoinId] = useState("");

  const handleQuickJoin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = quickJoinId.trim();
      if (!trimmed) return;
      await joinRoom(trimmed);
    },
    [quickJoinId, joinRoom]
  );

  const now = new Date();
  const hours = now.getHours();
  const greeting =
    hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";

  return (
    <PageTransition>
      <Navbar />
      

      <main className="min-h-[calc(100vh-4rem)]">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 right-1/4 h-[400px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-20 left-1/4 h-[300px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>

        <div className="container py-12 space-y-10">
          {/* ── Greeting ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {greeting}, {user?.displayName?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Start a new meeting or join an existing one.
            </p>
          </motion.div>

          {/* ── Action cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* New Meeting */}
            <CreateRoomActionCard />

            {/* Join Meeting */}
            <JoinRoomActionCard />

            {/* Quick Join */}
            <div className="sm:col-span-2 glass border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Join</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste a meeting ID and jump right in
                  </p>
                </div>
              </div>

              <form onSubmit={handleQuickJoin} className="flex gap-2">
                <Input
                  placeholder="Paste meeting ID — e.g., abc-defg-hij"
                  value={quickJoinId}
                  onChange={(e) =>
                    setQuickJoinId(
                      e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()
                    )
                  }
                  className="flex-1 font-mono bg-white/5 border-white/10"
                  disabled={isJoining}
                />
                <Button
                  type="submit"
                  disabled={isJoining || !quickJoinId.trim()}
                >
                  {isJoining ? "Joining…" : "Join"}
                </Button>
              </form>
            </div>
          </motion.div>

          <Separator className="bg-white/5" />

          {/* ── Info section ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              How it works
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Create a room",
                  desc: "Click 'New Meeting' to create a room. You'll get a unique meeting ID like abc-defg-hij.",
                },
                {
                  step: "2",
                  title: "Share the ID",
                  desc: "Copy your meeting ID and share it with anyone you want to invite.",
                },
                {
                  step: "3",
                  title: "Start talking",
                  desc: "Everyone joins using the meeting ID. Video, audio, chat, and screen sharing — all built in.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="glass border-white/5 rounded-xl p-5 space-y-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {s.step}
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </PageTransition>
  );
}

/* ── Sub-components for the action cards ── */

function CreateRoomActionCard() {
  return (
    <div className="glass border-white/10 rounded-xl p-6 space-y-4 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">New Meeting</h3>
          <p className="text-sm text-muted-foreground">Create & host</p>
        </div>
      </div>
      <CreateRoomDialog />
    </div>
  );
}

function JoinRoomActionCard() {
  return (
    <div className="glass border-white/10 rounded-xl p-6 space-y-4 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <DoorOpen className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold">Join Meeting</h3>
          <p className="text-sm text-muted-foreground">Enter a meeting ID</p>
        </div>
      </div>
      <JoinRoomDialog />
    </div>
  );
}