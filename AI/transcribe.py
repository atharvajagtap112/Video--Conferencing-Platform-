import argparse
import json
import os
import sys
from faster_whisper import WhisperModel

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--model", default="base")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--compute_type", default="int8")
    parser.add_argument("--output_json", default="")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, info = model.transcribe(args.input, vad_filter=True)

    text_parts = []
    items = []
    for seg in segments:
        s = seg.start
        e = seg.end
        t = seg.text.strip()
        if t:
            text_parts.append(t)
            items.append({
                "start": s,
                "end": e,
                "text": t
            })

    transcript = " ".join(text_parts).strip()

    out = {
        "language": info.language,
        "duration": info.duration,
        "transcript": transcript,
        "segments": items
    }

    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

    print(transcript)

if __name__ == "__main__":
    main()