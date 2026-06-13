import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
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
import { roomApi } from "@/api/room.api";
import { useLiveKit } from "@/hooks/useLiveKit";

export function CreateRoomDialog() {
  const { joinRoom } = useLiveKit();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    maxParticipants: 100,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsCreating(true);
    try {
      // Step 1: Create the room only (don't join yet)
      const room = await roomApi.create({
        title: form.title.trim(),
        maxParticipants: form.maxParticipants,
      });
      toast.success(`Room "${room.title}" created!`);
      setOpen(false);
      setForm({ title: "", maxParticipants: 100 });

      // Step 2: Small delay to let DB transaction commit
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 3: Join via useLiveKit hook — this updates Redux store AND navigates
      await joinRoom(room.meetingId);
    } catch (error) {
      // Error handled by axios interceptor, but log for debugging
      console.error("Failed to create/join room:", error);
      toast.error("Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Meeting
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Meeting</DialogTitle>
          <DialogDescription>
            Set up your meeting room. You&apos;ll be joined automatically as the
            host.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-title">Meeting Title</Label>
              <Input
                id="room-title"
                placeholder="Team Standup, Design Review…"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                disabled={isCreating}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-participants">Max Participants</Label>
              <Input
                id="max-participants"
                type="number"
                min={2}
                max={500}
                value={form.maxParticipants}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxParticipants: parseInt(e.target.value, 10) || 100,
                  }))
                }
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Between 2 and 500 participants
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !form.title.trim()}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isCreating ? "Creating…" : "Create & Join"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}