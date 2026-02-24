import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleChat } from "@/store/meeting.store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, generateAvatarColor, formatTime } from "@/lib/utils";

interface ChatPanelProps {
  onSendMessage: (text: string) => void;
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const dispatch = useAppDispatch();
  const { chatMessages } = useAppSelector((state) => state.meeting);
  const { user } = useAppSelector((state) => state.auth);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-[44rem] flex flex-col border-l border-white/5 bg-meeting-surface overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 ">
        <h3 className="font-semibold text-sm">In-call messages</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch(toggleChat())}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
       
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">
              Messages are only visible during the meeting
            </p>
          </div>
        )}

        {chatMessages.map((msg) => {
          const isOwn = msg.senderUsername === user?.username;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {!isOwn && (
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarFallback
                    className={`${generateAvatarColor(msg.senderUsername)} text-white text-[10px]`}
                  >
                    {getInitials(msg.senderUsername)}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[75%] space-y-1 ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {!isOwn && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {msg.senderUsername}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-white/10 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/5 flex gap-2  bottom-0 "  
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message…"
          className="flex-1 bg-white/5 border-white/10 text-sm"
          maxLength={500}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </motion.div>
  );
}