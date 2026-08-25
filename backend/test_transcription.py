"""
Standalone test for backend/ai/transcription.py — no DB, no FastAPI needed.

Usage:
    python test_transcription.py /path/to/your/lecture.mp3
    python test_transcription.py /path/to/your/lecture.mp4   # video works too
"""

from pathlib import Path
import sys
import time

# Add parent directory to path to allow imports when run directly
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from .transcription import transcribe
except ImportError:
    from backend.transcription import transcribe


def _validate_input_file(file_path: str) -> None:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    if not path.is_file():
        raise ValueError(f"Not a file: {file_path}")
    if path.stat().st_size == 0:
        raise ValueError(f"File is empty: {file_path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_transcription.py <path_to_audio_or_video>")
        sys.exit(1)

    file_path = sys.argv[1]
    fake_lecture_id = 1  # doesn't need to exist in a DB for this test

    try:
        _validate_input_file(file_path)
        print(f"Transcribing: {file_path}")
        start_time = time.time()

        segments = transcribe(file_path, lecture_id=fake_lecture_id)

        elapsed = time.time() - start_time
        print(f"\nDone in {elapsed:.1f}s — {len(segments)} segments\n")

        for seg in segments[:10]:  # just the first 10, so output isn't a wall of text
            print(f"[{seg.start:6.1f}s -> {seg.end:6.1f}s]  {seg.text}")

        if len(segments) > 10:
            print(f"... and {len(segments) - 10} more segments")

    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        print(f"Transcription failed: {exc}", file=sys.stderr)
        sys.exit(1)

    # Sanity checks worth eyeballing:
    # 1. Do timestamps look right? Play the file at segment[3].start and
    #    confirm the audio there actually matches segment[3].text.
    # 2. Are segments in order with no big overlaps/gaps?
    # 3. How's accuracy on the rough parts (background noise, accents)?