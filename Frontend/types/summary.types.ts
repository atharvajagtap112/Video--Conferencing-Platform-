export interface ActionItem {
  task: string;
  owner: string;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
}

export interface MeetingSummaryResponse {
  meetingId: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  risks: string[];
  openQuestions: string[];
  followUps: string[];
}

export interface SummaryStatusResponse {
  meetingId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}