import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  FastForward,
  Music
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

export default function AudioPlayer({ audioUrl, seekTime, onTimeUpdate }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Sync external seek requests (e.g. clicking timestamp in transcript)
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [seekTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const skip = (delta) => {
    if (!audioRef.current) return;
    const next = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4">
      {/* Hidden native audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`}
          onTimeUpdate={(e) => {
            const cur = e.target.currentTime;
            setCurrentTime(cur);
            if (onTimeUpdate) onTimeUpdate(cur);
          }}
          onLoadedMetadata={(e) => setDuration(e.target.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Play / Pause / Skips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => skip(-10)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Rewind 10s"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-purple hover:from-brand-500 hover:to-brand-purple text-white flex items-center justify-center shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
        </button>

        <button
          onClick={() => skip(10)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Forward 10s"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress & Time */}
      <div className="flex-1 w-full flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-10 text-right">
          {formatTime(currentTime)}
        </span>

        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Speed & Volume Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={cyclePlaybackRate}
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Change Playback Speed"
        >
          {playbackRate}x
        </button>

        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.muted = !isMuted;
              setIsMuted(!isMuted);
            }
          }}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
