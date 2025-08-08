'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Pin, PinOff } from 'lucide-react';
import { TimerPreset } from './Timer';
import { formatTime } from '@/utils/timer';

interface PopoutTimerProps {
  initialData?: {
    timeLeft: number;
    isRunning: boolean;
    selectedPreset: TimerPreset;
  };
}

export default function PopoutTimer({ initialData }: PopoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialData?.timeLeft || 25 * 60);
  const [isRunning, setIsRunning] = useState(initialData?.isRunning || false);
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(
    initialData?.selectedPreset || {
      id: 'studying',
      name: 'Studying',
      duration: 25 * 60,
      color: 'bg-blue-500',
      icon: null
    }
  );
  const [isPinned, setIsPinned] = useState(false);

  // Make window draggable
  useEffect(() => {
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    const dragStart = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('.controls')) {
        return; // Don't start drag if clicking controls
      }
      
      initialX = e.clientX - window.screenX;
      initialY = e.clientY - window.screenY;
      isDragging = true;

      document.body.style.cursor = 'move';
    };

    const dragEnd = () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    };

    const drag = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.screenX - initialX;
        currentY = e.screenY - initialY;
        window.moveTo(currentX, currentY);
      }
    };

    document.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    return () => {
      document.removeEventListener('mousedown', dragStart);
      document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('mousemove', drag);
    };
  }, []);

  // Listen for messages from main window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TIMER_UPDATE') {
        const { timeLeft, isRunning, selectedPreset } = event.data.data;
        setTimeLeft(timeLeft);
        setIsRunning(isRunning);
        setSelectedPreset(selectedPreset);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startTimer = () => {
    setIsRunning(true);
    // Send message to main window
    if (window.opener) {
      window.opener.postMessage({
        type: 'POPOUT_CONTROL',
        action: 'start'
      }, '*');
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    // Send message to main window
    if (window.opener) {
      window.opener.postMessage({
        type: 'POPOUT_CONTROL',
        action: 'pause'
      }, '*');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedPreset.duration);
    // Send message to main window
    if (window.opener) {
      window.opener.postMessage({
        type: 'POPOUT_CONTROL',
        action: 'reset'
      }, '*');
    }
  };


  const togglePin = async () => {
    try {
      if ('getWindowHandle' in window) {
        const windowHandle = await window.getWindowHandle();
        if (!isPinned) {
          await windowHandle.setAlwaysOnTop(true);
          setIsPinned(true);
        } else {
          await windowHandle.setAlwaysOnTop(false);
          setIsPinned(false);
        }
      } else {
        console.warn('Window Management API not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const progress = ((selectedPreset.duration - timeLeft) / selectedPreset.duration) * 100;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-3">
      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          {/* Circular Progress */}
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              className={`transition-all duration-1000 ease-out ${selectedPreset.color.replace('bg-', 'text-')}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-white">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Label */}
      <div className="text-xs text-slate-300 mb-3">{selectedPreset.name}</div>

      {/* Controls */}
      <div className="flex gap-2 mb-3 controls">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
            title="Resume"
          >
            <Play size={14} />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors"
            title="Pause"
          >
            <Pause size={14} />
          </button>
        )}
        
        <button
          onClick={resetTimer}
          className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
          title="Restart"
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={togglePin}
          className={`p-2 ${
            isPinned 
              ? 'bg-purple-500 hover:bg-purple-600' 
              : 'bg-slate-600 hover:bg-slate-700'
          } text-white rounded transition-colors`}
          title={isPinned ? 'Unpin window' : 'Pin window on top'}
        >
          {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
      </div>

      {/* Status indicator */}
      <div className="text-xs text-slate-400">
        {isRunning ? 'Running' : 'Paused'}
      </div>
    </div>
  );
} 