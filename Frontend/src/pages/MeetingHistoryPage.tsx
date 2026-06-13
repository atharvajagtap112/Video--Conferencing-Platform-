import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingApi, MeetingHistoryItem } from "@/api/meeting.api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Hourglass,
  XCircle,
} from "lucide-react";

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Hourglass className="h-3 w-3" />
          Processing
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-foreground border border-white/10">
          —
        </span>
      );
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function MeetingHistoryPage() {
  const [rows, setRows] = useState<MeetingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await meetingApi.getHistory();
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Meeting History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View past meetings and their AI-generated summaries
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </div>

        {/* Table */}
        <div className="border border-white/10 rounded-xl overflow-auto bg-white/5 max-h-[calc(100vh-200px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-meeting-surface/95 backdrop-blur-sm z-10">
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-muted-foreground font-medium">Meeting</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Role</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Joined</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Summary</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <motion.tr
                  key={`${m.meetingId}-${m.joinedAt}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {m.meetingId}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        m.role === "HOST"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-white/5 text-muted-foreground border border-white/10"
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(m.joinedAt)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs ${
                        m.roomStatus === "CLOSED"
                          ? "text-muted-foreground"
                          : m.roomStatus === "ACTIVE" || m.roomStatus === "RUNNING"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {m.roomStatus}
                    </span>
                  </td>
                  <td className="p-4">{statusBadge(m.summaryStatus)}</td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant={m.summaryStatus === "COMPLETED" ? "default" : "outline"}
                      disabled={
                        m.summaryStatus !== "COMPLETED" &&
                        m.summaryStatus !== "PROCESSING" &&
                        m.summaryStatus !== "PENDING"
                      }
                      onClick={() => navigate(`/meeting/${m.meetingId}/summary`)}
                    >
                      {m.summaryStatus === "COMPLETED" ? (
                        <>
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          View Summary
                        </>
                      ) : m.summaryStatus === "PROCESSING" || m.summaryStatus === "PENDING" ? (
                        <>
                          <Hourglass className="h-3.5 w-3.5 mr-1" />
                          View Progress
                        </>
                      ) : m.summaryStatus === "FAILED" ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Failed
                        </>
                      ) : (
                        "N/A"
                      )}
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-muted-foreground" colSpan={6}>
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto opacity-30" />
                      <p>No meetings found. Create or join a meeting to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}