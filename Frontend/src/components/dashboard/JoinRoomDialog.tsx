import { useState } from "react";
import { Loader2, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLiveKit } from "@/hooks/useLiveKit";

export function JoinRoomDialog() {
  const { joinRoom, isJoining } = useLiveKit();
  const [open, setOpen] = useState(false);
  const [meetingId, setMeetingId] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = meetingId.trim();
    if (!trimmed) return;
    setOpen(false);
    await joinRoom(trimmed);
  };

  // Format as user types: auto-insert dashes (xxx-xxxx-xxx)
  const handleInputChange = (value: string) => {
    // Strip non-alphanumeric except dashes
    const clean = value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    setMeetingId(clean);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <DoorOpen className="h-5 w-5" />
          Join Meeting
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Meeting</DialogTitle>
          <DialogDescription>
            Enter the meeting ID shared with you to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleJoin}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-id">Meeting ID</Label>
              <Input
                id="meeting-id"
                placeholder="abc-defg-hij"
                value={meetingId}
                onChange={(e) => handleInputChange(e.target.value)}
                required
                disabled={isJoining}
                autoFocus
                className="text-center text-lg tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: xxx-xxxx-xxx
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isJoining || !meetingId.trim()}>
              {isJoining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DoorOpen className="h-4 w-4" />
              )}
              {isJoining ? "Joining…" : "Join"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}