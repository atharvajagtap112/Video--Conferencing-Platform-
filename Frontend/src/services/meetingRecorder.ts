import { toast } from "react-hot-toast";

class MeetingRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private meetingId: string = "";
  private isRecording: boolean = false;

  async startRecording(meetingId: string, audioTrack: MediaStreamTrack): Promise<void> {
    try {
      this.meetingId = meetingId;
      this.recordedChunks = [];

      const stream = new MediaStream([audioTrack]);

      const options: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000,
      };

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log("Recording stopped");
      };

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
      };

      this.mediaRecorder.start(1000);
      this.isRecording = true;

      console.log(`✅ Started recording meeting ${meetingId}`);
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn("No active recording to stop");
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("MediaRecorder not initialized"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          await this.uploadRecording();
          this.isRecording = false;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private async uploadRecording(): Promise<void> {
    if (this.recordedChunks.length === 0) {
      console.warn("No audio data recorded");
      return;
    }

    try {
      const mimeType = this.getSupportedMimeType();
      const audioBlob = new Blob(this.recordedChunks, { type: mimeType });

      console.log(`Uploading recording: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);

      const formData = new FormData();
      const extension = this.getFileExtension(mimeType);
      formData.append("audio", audioBlob, `${this.meetingId}.${extension}`);
      formData.append("meetingId", this.meetingId);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/recordings/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      console.log("✅ Recording uploaded successfully");
      toast.success("Recording saved, processing AI summary...");
    } catch (error) {
      console.error("Failed to upload recording:", error);
      toast.error("Failed to save recording");
      throw error;
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "audio/webm";
  }

  private getFileExtension(mimeType: string): string {
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("mp4")) return "m4a";
    return "webm";
  }

  isActive(): boolean {
    return this.isRecording;
  }
}

export const meetingRecorder = new MeetingRecorder();
