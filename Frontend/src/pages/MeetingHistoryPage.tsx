import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingApi, MeetingHistoryItem } from "@/api/meeting.api";
import { Button } from "@/components/ui/button";

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

  if (loading) return <div className="p-6">Loading history...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Meeting History</h1>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3">Meeting</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Summary</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={`${m.meetingId}-${m.joinedAt}`} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{m.title}</div>
                  <div className="text-muted-foreground">{m.meetingId}</div>
                </td>
                <td className="p-3">{m.role}</td>
                <td className="p-3">{m.roomStatus}</td>
                <td className="p-3">{m.summaryStatus}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    disabled={m.summaryStatus !== "COMPLETED"}
                    onClick={() => navigate(`/meeting/${m.meetingId}/summary`)}
                  >
                    View Summary
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={5}>
                  No meetings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}