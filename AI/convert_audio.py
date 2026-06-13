#!/usr/bin/env python3
"""
Convert audio files to OGG format for Whisper transcription.
Usage: python convert_audio.py input.webm output.ogg
"""

import sys
import subprocess
from pathlib import Path

def convert_to_ogg(input_path: str, output_path: str) -> bool:
    try:
        # Use ffmpeg to convert to OGG Opus format
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-vn',  # No video
            '-acodec', 'libopus',  # Opus codec
            '-b:a', '128k',  # 128 kbps bitrate
            '-y',  # Overwrite output file
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Converted: {output_path}")
            return True
        else:
            print(f"❌ FFmpeg error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ FFmpeg not found. Please install: https://ffmpeg.org/download.html")
        return False
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_audio.py input.webm output.ogg")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    if not Path(input_file).exists():
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)
    
    success = convert_to_ogg(input_file, output_file)
    sys.exit(0 if success else 1)
