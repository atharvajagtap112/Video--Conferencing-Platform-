import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { summaryApi } from "@/api/summary.api";

export default function MeetingSummary() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [status, setStatus] = useState("PENDING");
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (!meetingId) return;
    let i: any;
    const poll = async () => {
      const s = await summaryApi.status(meetingId);
      setStatus(s.status);
      if (s.status === "COMPLETED") {
        setSummary(await summaryApi.get(meetingId));
        clearInterval(i);
      }
      if (s.status === "FAILED") clearInterval(i);
    };
    poll();
    i = setInterval(poll, 5000);
    return () => clearInterval(i);
  }, [meetingId]);

  if (status === "PENDING" || status === "PROCESSING") return <div className="p-6">Generating summary...</div>;
  if (status === "FAILED") return <div className="p-6">Summary failed.</div>;
  return <pre className="p-6 whitespace-pre-wrap">{JSON.stringify(summary, null, 2)}</pre>;
}