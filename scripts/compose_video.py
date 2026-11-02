"""Compose demo/video.mp4 from the screen recording and the narration clips.

  python3 scripts/compose_video.py

Inputs (made by scripts/make-narration.ts and scripts/record-demo.cjs):
  demo/.work/raw.webm, demo/.work/timeline.json, demo/.work/narration/<scene>.wav
Each narration clip starts at its scene's start time. A silent title card opens the video and an end card
closes it (demo/.work/title.png and end.png from scripts/render-cards.cjs). No music.
"""
import json
import subprocess
from pathlib import Path

WORK = Path("demo/.work")
OUT = Path("demo/video.mp4")

timeline = json.loads((WORK / "timeline.json").read_text())
offset = timeline["videoOffsetMs"] / 1000
total = timeline["totalMs"] / 1000
scenes = timeline["scenes"]
TITLE = 3.5  # seconds
END = 4.5

cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{offset:.3f}", "-i", str(WORK / "raw.webm")]
for s in scenes:
    cmd += ["-i", str(WORK / "narration" / f"{s['id']}.wav")]
n = len(scenes)
cmd += ["-loop", "1", "-t", str(TITLE), "-i", str(WORK / "title.png")]
cmd += ["-loop", "1", "-t", str(END), "-i", str(WORK / "end.png")]

parts = []
labels = []
for i, s in enumerate(scenes, start=1):
    delay = int(TITLE * 1000 + s["start"] + 350)  # after the title card; let the scene settle first
    parts.append(f"[{i}:a]aresample=48000,adelay={delay}:all=1[a{i}]")
    labels.append(f"[a{i}]")
full = TITLE + total + END
parts.append(
    "".join(labels)
    + f"amix=inputs={n}:normalize=0:dropout_transition=0,apad,atrim=0:{full:.3f},"
    + "loudnorm=I=-16:TP=-1.5:LRA=11,aformat=sample_rates=48000:channel_layouts=stereo[aout]"
)
parts.append(
    f"[{n + 1}:v]scale=1440:900,fps=30,format=yuv420p,fade=t=in:st=0:d=0.6,fade=t=out:st={TITLE - 0.5:.2f}:d=0.5[v0]"
)
parts.append(
    f"[0:v]trim=0:{total:.3f},setpts=PTS-STARTPTS,fps=30,format=yuv420p,"
    + f"fade=t=in:st=0:d=0.4,fade=t=out:st={total - 0.6:.3f}:d=0.6[v1]"
)
parts.append(
    f"[{n + 2}:v]scale=1440:900,fps=30,format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st={END - 0.8:.2f}:d=0.8[v2]"
)
parts.append("[v0][v1][v2]concat=n=3:v=1:a=0[vout]")

cmd += [
    "-filter_complex", ";".join(parts),
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart",
    str(OUT),
]
subprocess.run(cmd, check=True)
probe = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration,size", "-of", "json", str(OUT)],
    check=True, capture_output=True, text=True,
)
info = json.loads(probe.stdout)["format"]
print(f"wrote {OUT}: {float(info['duration']):.1f} s, {int(info['size']) / 1e6:.1f} MB")
