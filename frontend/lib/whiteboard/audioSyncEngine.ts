/**
 * frontend/lib/whiteboard/audioSyncEngine.ts
 *
 * High-precision Audio Synchronization Engine for the Whiteboard subsystem.
 * Handles audio playback, word-level boundary detection, sub-50ms callback
 * dispatching, and communication with the /api/whiteboard/tts endpoint.
 */

import { TimingMark, TTSWithTimingResponse } from './types';

export interface AudioSyncCallbacks {
  onTimeUpdate?: (timeMs: number) => void;
  onWordBoundary?: (mark: TimingMark, wordIndex: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (err: any) => void;
}

export class AudioSyncEngine {
  private audio: HTMLAudioElement | null = null;
  private timingMarks: TimingMark[] = [];
  private callbacks: AudioSyncCallbacks = {};
  private animationFrameId: number | null = null;
  private lastFiredWordIndex: number = -1;

  constructor(callbacks?: AudioSyncCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public setCallbacks(callbacks: AudioSyncCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public load(audioUrl: string, timingMarks: TimingMark[]) {
    this.stop();
    this.timingMarks = timingMarks;
    this.lastFiredWordIndex = -1;

    this.audio = new Audio(audioUrl);
    this.audio.preload = 'auto';

    this.audio.addEventListener('play', () => {
      this.callbacks.onPlay?.();
      this.startSyncLoop();
    });

    this.audio.addEventListener('pause', () => {
      this.callbacks.onPause?.();
      this.stopSyncLoop();
    });

    this.audio.addEventListener('ended', () => {
      this.stopSyncLoop();
      this.callbacks.onEnded?.();
    });

    this.audio.addEventListener('error', (e) => {
      this.callbacks.onError?.(e);
    });
  }

  public async play() {
    if (!this.audio) return;
    try {
      await this.audio.play();
    } catch (err) {
      this.callbacks.onError?.(err);
    }
  }

  public pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  public seek(timeMs: number) {
    if (!this.audio) return;
    this.audio.currentTime = timeMs / 1000.0;
    this.lastFiredWordIndex = this.findWordIndexAtTime(timeMs);
    this.callbacks.onTimeUpdate?.(timeMs);
  }

  public setPlaybackRate(rate: number) {
    if (!this.audio) return;
    this.audio.playbackRate = rate;
  }

  public getCurrentTimeMs(): number {
    if (!this.audio) return 0;
    return this.audio.currentTime * 1000.0;
  }

  public getDurationMs(): number {
    if (!this.audio || isNaN(this.audio.duration)) return 0;
    return this.audio.duration * 1000.0;
  }

  public isPlaying(): boolean {
    return !!this.audio && !this.audio.paused && !this.audio.ended;
  }

  public stop() {
    this.stopSyncLoop();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.lastFiredWordIndex = -1;
  }

  private startSyncLoop() {
    this.stopSyncLoop();

    const loop = () => {
      if (!this.audio) return;

      const currentMs = this.audio.currentTime * 1000.0;
      this.callbacks.onTimeUpdate?.(currentMs);

      // Check for word boundary events
      const activeWordIndex = this.findWordIndexAtTime(currentMs);
      if (activeWordIndex >= 0 && activeWordIndex !== this.lastFiredWordIndex) {
        this.lastFiredWordIndex = activeWordIndex;
        const mark = this.timingMarks[activeWordIndex];
        this.callbacks.onWordBoundary?.(mark, activeWordIndex);
      }

      if (!this.audio.paused && !this.audio.ended) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopSyncLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private findWordIndexAtTime(timeMs: number): number {
    if (this.timingMarks.length === 0) return -1;

    for (let i = 0; i < this.timingMarks.length; i++) {
      const mark = this.timingMarks[i];
      if (timeMs >= mark.offset_ms && timeMs < mark.offset_ms + mark.duration_ms) {
        return i;
      }
    }

    // If past the last word but still playing
    const last = this.timingMarks[this.timingMarks.length - 1];
    if (timeMs >= last.offset_ms) {
      return this.timingMarks.length - 1;
    }

    return -1;
  }
}

/**
 * Calls backend /api/whiteboard/tts to synthesize speech and get timing marks.
 */
export async function fetchSpeechWithTiming(
  text: string,
  voice?: string
): Promise<TTSWithTimingResponse> {
  const res = await fetch('http://localhost:8000/api/whiteboard/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `TTS request failed with status ${res.status}`);
  }

  return res.json();
}
