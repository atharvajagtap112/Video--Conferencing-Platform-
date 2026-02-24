import { motion } from "framer-motion";
import { Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RoomResponse } from "@/types/room.types";

interface RoomCardProps {
  room: RoomResponse;
  onJoin: (meetingId: string) => void;
  index: number;
}

export function RoomCard({ room, onJoin, index }: RoomCardProps) {
  const expiresAt = new Date(room.expiresAt);
  const isExpired = expiresAt < new Date() || room.status !== "ACTIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card
        className={`glass border-white/10 transition-all duration-200 ${
          isExpired
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {room.title}
              </h3>
              <p className="text-sm font-mono text-muted-foreground">
                {room.meetingId}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Max {room.maxParticipants}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {isExpired
                    ? "Expired"
                    : `Expires ${expiresAt.toLocaleTimeString()}`}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              disabled={isExpired}
              onClick={() => onJoin(room.meetingId)}
              className="shrink-0 ml-3"
            >
              Join
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}