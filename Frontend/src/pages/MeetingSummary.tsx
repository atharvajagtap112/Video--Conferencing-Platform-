import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { summaryApi } from "@/api/summary.api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Target,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ListChecks,
  ShieldAlert,
} from "lucide-react";

interface SummaryData {
  executiveSummary?: string;
  keyPoints?: string[];
  decisions?: string[];
  actionItems?: Array<{ owner?: string; task?: string; deadline?: string }>;
  risks?: string[];
  openQuestions?: string[];
  followUps?: string[];
}

export default function MeetingSummary() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState("PENDING");
  const [errorMsg, setErrorMsg] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    if (!meetingId) return;
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const s = await summaryApi.status(meetingId);
        setStatus(s.status);
        if (s.message && s.message !== "OK") setErrorMsg(s.message);

        if (s.status === "COMPLETED") {
          const data = await summaryApi.get(meetingId);
          setSummary(typeof data === "string" ? JSON.parse(data) : data);
          clearInterval(interval);
        }
        if (s.status === "FAILED") {
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    };

    poll();
    interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [meetingId]);

  // ── Loading state ──
  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto px-6"
        >
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">Generating AI Summary</h1>
          <p className="text-muted-foreground">
            {status === "PENDING"
              ? "Preparing to process your meeting recording..."
              : "Transcribing audio and generating summary with AI..."}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{meetingId}</p>

          {/* Progress steps */}
          <div className="text-left space-y-3 mt-6 p-4 rounded-lg border border-white/10 bg-white/5">
            <StepItem
              label="Recording saved"
              done={true}
            />
            <StepItem
              label="Transcribing audio (Whisper)"
              done={status === "PROCESSING"}
              active={status === "PROCESSING"}
            />
            <StepItem
              label="Generating summary (Gemini)"
              done={false}
              active={false}
            />
          </div>

          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Failed state ──
  if (status === "FAILED") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto px-6"
        >
          <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Summary Generation Failed</h1>
          <p className="text-muted-foreground">
            {errorMsg || "An error occurred while generating the meeting summary."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button onClick={() => navigate("/meeting/history")}>
              View History
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Completed — show structured summary ──
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              Meeting Summary
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">{meetingId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/meeting/history")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>

        {summary && (
          <div className="space-y-4">
            {/* Executive Summary */}
            {summary.executiveSummary && (
              <SummaryCard
                icon={<FileText className="h-5 w-5 text-blue-400" />}
                title="Executive Summary"
              >
                <p className="text-muted-foreground leading-relaxed">
                  {summary.executiveSummary}
                </p>
              </SummaryCard>
            )}

            {/* Key Points */}
            {summary.keyPoints && summary.keyPoints.length > 0 && (
              <SummaryCard
                icon={<Target className="h-5 w-5 text-emerald-400" />}
                title="Key Points"
              >
                <ul className="space-y-2">
                  {summary.keyPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            )}

            {/* Decisions */}
            {summary.decisions && summary.decisions.length > 0 && (
              <SummaryCard
                icon={<ListChecks className="h-5 w-5 text-purple-400" />}
                title="Decisions Made"
              >
                <ul className="space-y-2">
                  {summary.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-purple-400 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            )}

            {/* Action Items */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <SummaryCard
                icon={<ArrowRight className="h-5 w-5 text-amber-400" />}
                title="Action Items"
              >
                <div className="space-y-3">
                  {summary.actionItems.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-1"
                    >
                      <p className="text-sm font-medium">{item.task}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {item.owner && <span>👤 {item.owner}</span>}
                        {item.deadline && <span>📅 {item.deadline}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </SummaryCard>
            )}

            {/* Risks */}
            {summary.risks && summary.risks.length > 0 && (
              <SummaryCard
                icon={<ShieldAlert className="h-5 w-5 text-red-400" />}
                title="Risks"
              >
                <ul className="space-y-2">
                  {summary.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-red-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            )}

            {/* Open Questions */}
            {summary.openQuestions && summary.openQuestions.length > 0 && (
              <SummaryCard
                icon={<HelpCircle className="h-5 w-5 text-cyan-400" />}
                title="Open Questions"
              >
                <ul className="space-y-2">
                  {summary.openQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            )}

            {/* Follow-Ups */}
            {summary.followUps && summary.followUps.length > 0 && (
              <SummaryCard
                icon={<ArrowRight className="h-5 w-5 text-indigo-400" />}
                title="Follow-Ups"
              >
                <ul className="space-y-2">
                  {summary.followUps.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3"
    >
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function StepItem({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      ) : active ? (
        <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-white/20 shrink-0" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}