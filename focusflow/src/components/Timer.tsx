'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, X, Gamepad2, BookOpen, Briefcase, Sun, Moon, Coffee, ChevronRight, ChevronLeft, Maximize2, Settings, Volume2, VolumeX } from 'lucide-react';
import { formatTime, formatTimeLong, playNotificationSound, saveToLocalStorage, loadFromLocalStorage, SOUND_OPTIONS, SoundOption } from '@/utils/timer';
import { getMessageSet, getRandomMessage } from '@/utils/messages';
import Toast from './Toast';
import { useTheme } from '@/contexts/ThemeContext';

interface SerializedTimerPreset {
  id: string;
  name: string;
  duration: number;
  color: string;
  isCustom?: boolean;
  isAchievement?: boolean;
}

export interface TimerPreset extends SerializedTimerPreset {
  icon: React.ReactNode;
}

const defaultPresets: TimerPreset[] = [
  {
    id: 'studying',
    name: 'Studying',
    duration: 25 * 60, // 25 minutes default
    color: 'bg-blue-500',
    icon: <BookOpen size={16} />
  },
  {
    id: 'gaming',
    name: 'Gaming',
    duration: 60 * 60, // 1 hour default
    color: 'bg-purple-500',
    icon: <Gamepad2 size={16} />
  },
  {
    id: 'work',
    name: 'Work',
    duration: 45 * 60, // 45 minutes default
    color: 'bg-green-500',
    icon: <Briefcase size={16} />
  },
  {
    id: 'break',
    name: 'Break',
    duration: 5 * 60, // 5 minutes default
    color: 'bg-orange-500',
    icon: <Coffee size={16} />
  }
];

export default function Timer() {
  const { theme, toggleTheme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(defaultPresets[0]); // Default to studying
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [showNewModeModal, setShowNewModeModal] = useState(false);
  const [showCustomModes, setShowCustomModes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string>('notification');
  const [masterVolume, setMasterVolume] = useState<number>(1);

  // Load sound settings in useEffect
  useEffect(() => {
    setSelectedSound(loadFromLocalStorage('selectedSound', 'notification'));
    setMasterVolume(loadFromLocalStorage('masterVolume', 1));
  }, []);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [notificationsSent, setNotificationsSent] = useState<Set<string>>(new Set());
  const [popoutWindow, setPopoutWindow] = useState<Window | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  const [customPresets, setCustomPresets] = useState<TimerPreset[]>([]);

  // Move localStorage operations to useEffect
  useEffect(() => {
    const saved = loadFromLocalStorage('customPresets', []);
    // Restore icons for loaded presets
    const restoredPresets = saved.map((preset: SerializedTimerPreset) => ({
      ...preset,
      icon: <Clock size={16} />
    }));
    setCustomPresets(restoredPresets);
  }, []);
  const [newModeName, setNewModeName] = useState('');
  const [newModeColor, setNewModeColor] = useState('bg-purple-500');
  const [isAchievementMode, setIsAchievementMode] = useState(false);

  // Handle popout window communication
  useEffect(() => {
    const handlePopoutMessage = (event: MessageEvent) => {
      if (event.data.type === 'POPOUT_CONTROL') {
        switch (event.data.action) {
          case 'start':
            setIsRunning(true);
            break;
          case 'pause':
            setIsRunning(false);
            break;
          case 'reset':
            setIsRunning(false);
            setTimeLeft(selectedPreset.duration);
            setNotificationsSent(new Set());
            break;
          case 'togglePin':
            // Reopen the popout window with updated alwaysOnTop setting
            if (popoutWindow && !popoutWindow.closed) {
              const width = popoutWindow.outerWidth;
              const height = popoutWindow.outerHeight;
              const left = popoutWindow.screenX;
              const top = popoutWindow.screenY;
              
              const newWindow = window.open(
                `/popout?alwaysOnTop=${event.data.isPinned}`,
                'TimerPopout',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,resizable=no,alwaysOnTop=${event.data.isPinned}`
              );
              
              if (newWindow) {
                // Update the popout window reference
                setPopoutWindow(newWindow);
                
                // Transfer the current state after a short delay to ensure window is loaded
                setTimeout(() => {
                  const serializablePreset = {
                    ...selectedPreset,
                    icon: undefined
                  };
                  
                  newWindow.postMessage({
                    type: 'TIMER_UPDATE',
                    data: {
                      timeLeft,
                      isRunning,
                      selectedPreset: serializablePreset
                    }
                  }, '*');
                }, 100);
              }
            }
            break;
        }
      }
    };

    window.addEventListener('message', handlePopoutMessage);
    return () => window.removeEventListener('message', handlePopoutMessage);
  }, [isRunning, popoutWindow, selectedPreset, timeLeft]); // Include all dependencies used in the effect

  // Update popout window when timer state changes
  useEffect(() => {
    if (popoutWindow && !popoutWindow.closed) {
      // Create a serializable version of the preset without React elements
      const serializablePreset = {
        ...selectedPreset,
        icon: undefined // Remove the React element
      };

      popoutWindow.postMessage({
        type: 'TIMER_UPDATE',
        data: {
          timeLeft,
          isRunning,
          selectedPreset: serializablePreset
        }
      }, '*');
    } else if (popoutWindow?.closed) {
      setPopoutWindow(null);
    }
  }, [timeLeft, isRunning, selectedPreset, popoutWindow]);

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = loadFromLocalStorage('timerState', {
        timeLeft: 25 * 60,
        isRunning: false,
        selectedPreset: defaultPresets[0] // Default to studying
      });
      setTimeLeft(savedState.timeLeft);
      setIsRunning(false); // Always start paused for safety
      
      // Reconstruct the full preset with icons from saved data
      if (savedState.selectedPreset && savedState.selectedPreset.id) {
        const savedPreset = savedState.selectedPreset;
        const fullPreset = defaultPresets.find(preset => preset.id === savedPreset.id);
        if (fullPreset) {
          // Merge saved duration with the full preset (including icon)
          setSelectedPreset({
            ...fullPreset,
            duration: savedPreset.duration
          });
        } else {
          setSelectedPreset(defaultPresets[0]); // Fallback to studying
        }
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    // Only save serializable data (exclude React components)
    const serializablePreset = {
      id: selectedPreset.id,
      name: selectedPreset.name,
      duration: selectedPreset.duration,
      color: selectedPreset.color
    };
    
    saveToLocalStorage('timerState', {
      timeLeft,
      isRunning,
      selectedPreset: serializablePreset
    });
  }, [timeLeft, isRunning, selectedPreset]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;
          if (newTimeLeft <= 1) {
            setIsRunning(false);

            // Show completion notification
            const messageSet = getMessageSet(selectedPreset.id);
            let message = '';
            
            if (selectedPreset.id === 'break') {
              message = 'Break complete! Time to return to your focused session.';
            } else if (selectedPreset.duration >= 30 * 60) {
              // Get random completion message for sessions >= 30 minutes
              message = getRandomMessage(messageSet.completionMessages);
              
              // Add break recommendation
              const recommendedBreak = selectedPreset.id === 'gaming' ? 10 :
                                     selectedPreset.id === 'studying' ? 5 :
                                     selectedPreset.id === 'work' ? 15 :
                                     Math.min(Math.max(Math.floor(selectedPreset.duration / 300), 5), 15);
              
              message += ` Consider taking a ${recommendedBreak}-min break to recharge.`;
            } else {
              // Simple completion message for shorter sessions
              message = `${selectedPreset.name} session complete!`;
            }

            setToastMessage(message);
            playNotificationSound(selectedSound);
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Screen Tempo', {
                body: message,
                icon: '/next.svg'
              });
            }
            return 0;
          }
          return newTimeLeft;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, selectedPreset, selectedSound]);

  // Message and notification logic for 1/2, 1/8, and completion
  useEffect(() => {
    if (!isRunning || selectedPreset.id === 'break') return;

    const totalDuration = selectedPreset.duration;
    // Only show progress notifications for sessions >= 30 minutes
    if (totalDuration < 30 * 60) return;

    const halfwayPoint = Math.floor(totalDuration / 2);
    const eighthPoint = Math.floor(totalDuration / 8);
    const messageSet = getMessageSet(selectedPreset.id);

    // Check for halfway notification (1/2)
    if (timeLeft === halfwayPoint && !notificationsSent.has('halfway')) {
      setNotificationsSent(prev => new Set([...prev, 'halfway']));
      const message = getRandomMessage(messageSet.halfwayMessages);
      setToastMessage(message);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Screen Tempo', {
          body: message,
          icon: '/next.svg'
        });
      }
    }

    // Check for final stretch notification (1/8 remaining)
    if (timeLeft === eighthPoint && !notificationsSent.has('finalStretch')) {
      setNotificationsSent(prev => new Set([...prev, 'finalStretch']));
      const message = getRandomMessage(messageSet.finalStretchMessages);
      setToastMessage(message);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Screen Tempo', {
          body: message,
          icon: '/next.svg'
        });
      }
    }
  }, [timeLeft, isRunning, selectedPreset, notificationsSent]);

  const startTimer = () => {
    // Reset notifications when starting a new timer
    setNotificationsSent(new Set());
    setIsRunning(true);
    
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedPreset.duration);
    setNotificationsSent(new Set());
  };

  const selectPreset = (preset: TimerPreset) => {
    setSelectedPreset(preset);
    setTimeLeft(preset.duration);
    setIsRunning(false);
    setShowCustomTimer(false);
    setNotificationsSent(new Set());
  };

  const setCustomTime = () => {
    const totalSeconds = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (totalSeconds > 0 && totalSeconds <= 24 * 3600) {
      const updatedPreset: TimerPreset = {
        ...selectedPreset,
        duration: totalSeconds
      };
      setSelectedPreset(updatedPreset);
      setTimeLeft(totalSeconds);
      setIsRunning(false);
      setShowCustomTimer(false);
      setNotificationsSent(new Set());
    }
  };

  const saveCustomMode = () => {
    if (newModeName.trim() && customHours * 3600 + customMinutes * 60 + customSeconds > 0) {
      const duration = customHours * 3600 + customMinutes * 60 + customSeconds;
      
      // If we're editing an existing preset, update it
      if (selectedPreset.isCustom) {
        const updatedPreset: TimerPreset = {
          ...selectedPreset,
          name: newModeName.trim(),
          duration: duration,
          color: newModeColor,
          icon: <Clock size={16} />,
          isAchievement: isAchievementMode
        };

        const updatedPresets = customPresets.map(p => 
          p.id === selectedPreset.id ? updatedPreset : p
        );
        
        setCustomPresets(updatedPresets);
        setSelectedPreset(updatedPreset);
        setTimeLeft(duration);
        
        // Save serializable version
        saveToLocalStorage('customPresets', updatedPresets.map(preset => ({
          ...preset,
          icon: undefined
        })));
      } else {
        // Create new preset
        const newPreset: TimerPreset = {
          id: `custom-${Date.now()}`,
          name: newModeName.trim(),
          duration: duration,
          color: newModeColor,
          icon: <Clock size={16} />,
          isCustom: true,
          isAchievement: isAchievementMode
        };
        
        const updatedPresets = [...customPresets, newPreset];
        setCustomPresets(updatedPresets);
        setSelectedPreset(newPreset);
        setTimeLeft(duration);
        
        // Save serializable version
        saveToLocalStorage('customPresets', updatedPresets.map(preset => ({
          ...preset,
          icon: undefined
        })));
      }
      
      // Reset form and close modal
      setNewModeName('');
      setShowNewModeModal(false);
      setNotificationsSent(new Set());
    }
  };



  const progress = ((selectedPreset.duration - timeLeft) / selectedPreset.duration) * 100;

  // Dynamic color based on progress (green to red)
  const getProgressColor = () => {
    if (progress < 25) return 'text-green-500';
    if (progress < 50) return 'text-green-400';
    if (progress < 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
      // Toast component
      toastMessage && (
        <Toast
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
      ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-3 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-white hover:bg-gray-100 text-slate-700 shadow-lg'
              }`}
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
          <h1 className={`text-6xl font-bold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>Screen Tempo</h1>
          <p className={`text-xl font-medium tracking-wide ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>Study smarter, work better, game mindfully</p>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50`}>
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`font-medium text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Theme Setting */}
                <div className="flex items-center justify-between">
                  <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    Theme
                  </div>
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400'
                        : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun size={16} />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon size={16} />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>

                {/* Sound Settings */}
                <div>
                  <div className={`mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Timer Sound
                  </div>
                  <div className="space-y-2">
                    {SOUND_OPTIONS.map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => {
                          setSelectedSound(sound.id);
                          saveToLocalStorage('selectedSound', sound.id);
                          // Play a preview of the sound
                          if (sound.id !== 'none') {
                            playNotificationSound(sound.id, masterVolume);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                          selectedSound === sound.id
                            ? theme === 'dark'
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                            : theme === 'dark'
                              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {sound.id === 'none' ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          {sound.name}
                        </span>
                        {selectedSound === sound.id && (
                          <div className={`text-xs ${
                            theme === 'dark' ? 'text-purple-200' : 'text-purple-100'
                          }`}>
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Click a sound to preview it
                  </div>

                  {/* Volume Slider */}
                  <div className="mt-6">
                    <div className={`mb-3 flex items-center justify-between ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span>Volume</span>
                      <span className="text-sm">{Math.round(masterVolume * 100)}%</span>
                    </div>
                    <div className="relative flex items-center">
                      <button
                        onClick={() => {
                          const newVolume = Math.max(0, masterVolume - 0.1);
                          setMasterVolume(newVolume);
                          saveToLocalStorage('masterVolume', newVolume);
                          if (selectedSound !== 'none') {
                            playNotificationSound(selectedSound, newVolume);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                        }`}
                      >
                        <VolumeX size={16} />
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={masterVolume}
                        onChange={(e) => {
                          const newVolume = parseFloat(e.target.value);
                          setMasterVolume(newVolume);
                          saveToLocalStorage('masterVolume', newVolume);
                        }}
                        onMouseUp={() => {
                          // Play preview when slider is released
                          if (selectedSound !== 'none') {
                            playNotificationSound(selectedSound, masterVolume);
                          }
                        }}
                        className="flex-1 mx-4 h-2 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <button
                        onClick={() => {
                          const newVolume = Math.min(1, masterVolume + 0.1);
                          setMasterVolume(newVolume);
                          saveToLocalStorage('masterVolume', newVolume);
                          if (selectedSound !== 'none') {
                            playNotificationSound(selectedSound, newVolume);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                        }`}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timer Display - Much Larger */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Large Circular Progress */}
            <svg className="w-96 h-96 transform -rotate-90" viewBox="0 0 120 120">
              {/* Define the glow filter */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none"
              />
              
              {/* Glowing progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ease-out ${getProgressColor()}`}
                style={{ filter: 'url(#glow)' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                                 <div className={`text-6xl font-mono font-bold mb-4 ${
                   theme === 'dark' ? 'text-white' : 'text-slate-800'
                 }`}>
                   {formatTime(timeLeft)}
                 </div>
                 <div className={`text-2xl flex items-center justify-center gap-3 ${
                   theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                 }`}>
                   {selectedPreset.icon}
                   {selectedPreset.name}
                 </div>
              </div>
            </div>
          </div>
        </div>

                {/* Timer Selection Area */}
        <div className="relative mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Default Presets View */}
            {!showCustomModes && defaultPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-3 text-lg ${
                  selectedPreset.id === preset.id
                    ? `${preset.color} text-white`
                    : theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-white text-slate-700 hover:bg-gray-100 shadow-lg'
                }`}
              >
                {preset.icon}
                {preset.name}
              </button>
            ))}

            {/* Duration Button - Only show in default view */}
            {!showCustomModes && (
              <button
                onClick={() => {
                  setShowCustomTimer(!showCustomTimer);
                  // Pre-fill with current preset's time
                  const hours = Math.floor(selectedPreset.duration / 3600);
                  const minutes = Math.floor((selectedPreset.duration % 3600) / 60);
                  const seconds = selectedPreset.duration % 60;
                  setCustomHours(hours);
                  setCustomMinutes(minutes);
                  setCustomSeconds(seconds);
                }}
                className={`px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-3 text-lg ${
                  showCustomTimer
                    ? `${selectedPreset.color} text-white`
                    : theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-white text-slate-700 hover:bg-gray-100 shadow-lg'
                }`}
              >
                <Clock size={16} />
                Duration
              </button>
            )}

            {/* Navigation Buttons */}
            {!showCustomModes && customPresets.length > 0 ? (
              <button
                onClick={() => setShowCustomModes(true)}
                className={`px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-3 text-lg ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-white text-slate-700 hover:bg-gray-100 shadow-lg'
                }`}
              >
                <ChevronRight size={16} />
                Custom Timers ({customPresets.length})
              </button>
            ) : showCustomModes ? (
              <button
                onClick={() => setShowCustomModes(false)}
                className={`px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-3 text-lg ${
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-white text-slate-700 hover:bg-gray-100 shadow-lg'
                }`}
              >
                <ChevronLeft size={16} />
                Back to Default Timers
              </button>
            ) : null}
          </div>

          {/* Custom Presets */}
          {showCustomModes && (
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              {customPresets.length > 0 ? (
                customPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className={`px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-3 text-lg ${
                      selectedPreset.id === preset.id
                        ? `${preset.color} text-white`
                        : theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-white text-slate-700 hover:bg-gray-100 shadow-lg'
                    }`}
                  >
                    {preset.icon}
                    {preset.name}
                  </button>
                ))
              ) : (
                <div className={`text-center p-6 rounded-xl ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600'
                }`}>
                  <p className="mb-2">No custom timers yet</p>
                  <p className="text-sm opacity-75">Create one using the Duration button above</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* New Mode Modal */}
        {showNewModeModal && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50`}>
            <div className={`rounded-xl p-6 max-w-md w-full mx-4 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Create New Timer Mode</h3>
                <button
                  onClick={() => setShowNewModeModal(false)}
                  className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Mode Name */}
                <div>
                  <label className={`block text-xs mb-2 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>Mode Name</label>
                  <input
                    type="text"
                    value={newModeName}
                    onChange={(e) => setNewModeName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white border-slate-600'
                        : 'bg-gray-50 text-slate-800 border-gray-300'
                    }`}
                    placeholder="Enter mode name"
                  />
                </div>

                {/* Duration */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs mb-2 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={customHours}
                      onChange={(e) => setCustomHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                      className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-white border-slate-600'
                          : 'bg-gray-50 text-slate-800 border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-2 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-white border-slate-600'
                          : 'bg-gray-50 text-slate-800 border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-2 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>Seconds</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-white border-slate-600'
                          : 'bg-gray-50 text-slate-800 border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className={`block text-xs mb-2 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>Theme Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewModeColor(color)}
                        className={`w-8 h-8 rounded-full ${color} ${
                          newModeColor === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>



                {/* Action Buttons */}
                <div className="text-center mt-6 space-y-3">
                  <button
                    onClick={saveCustomMode}
                    disabled={!newModeName.trim() || (customHours * 3600 + customMinutes * 60 + customSeconds === 0)}
                    className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-lg"
                  >
                    {selectedPreset.isCustom ? 'Update Timer' : 'Create Custom Timer'}
                  </button>

                  {selectedPreset.isCustom && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this custom timer?')) {
                          const updatedPresets = customPresets.filter(p => p.id !== selectedPreset.id);
                          setCustomPresets(updatedPresets);
                          saveToLocalStorage('customPresets', updatedPresets.map(preset => ({
                            ...preset,
                            icon: undefined
                          })));
                          // Switch to the first default preset
                          setSelectedPreset(defaultPresets[0]);
                          setTimeLeft(defaultPresets[0].duration);
                          setNotificationsSent(new Set());
                          setShowNewModeModal(false);
                        }
                      }}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors text-lg ${
                        theme === 'dark'
                          ? 'bg-red-900/50 hover:bg-red-900/70 text-red-200'
                          : 'bg-red-100 hover:bg-red-200 text-red-700'
                      }`}
                    >
                      Delete Timer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

                 {/* Edit button - Only show for custom presets */}
         {selectedPreset.isCustom && (
           <div className="text-center mb-8 flex justify-center">
             <button
               onClick={() => {
                 // Pre-fill the new mode form with current preset values
                 setNewModeName(selectedPreset.name);
                 setNewModeColor(selectedPreset.color);
                 setIsAchievementMode(selectedPreset.isAchievement || false);
                 setCustomHours(Math.floor(selectedPreset.duration / 3600));
                 setCustomMinutes(Math.floor((selectedPreset.duration % 3600) / 60));
                 setCustomSeconds(selectedPreset.duration % 60);
                 setShowNewModeModal(true);
               }}
               className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 text-lg ${
                 theme === 'dark'
                   ? 'bg-blue-600 hover:bg-blue-700 text-white'
                   : 'bg-blue-500 hover:bg-blue-600 text-white'
               }`}
             >
               <Clock size={20} />
               Edit Timer Settings
             </button>
           </div>
         )}

         

                 {/* Custom Timer Input */}
                   {showCustomTimer && (
            <div className={`rounded-xl p-6 mb-8 border max-w-md mx-auto ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Customize {selectedPreset.name} Timer</h3>
                <button
                  onClick={() => setShowCustomTimer(false)}
                  className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}
                >
                  <X size={20} />
                </button>
              </div>
             
             <div className="grid grid-cols-3 gap-4 mb-6">
               <div>
                 <label className={`block text-xs mb-2 ${
                   theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                 }`}>Hours</label>
                                 <input
                  type="number"
                  min="0"
                  max="24"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customHours * 3600 + customMinutes * 60 + customSeconds > 0) {
                      setCustomTime();
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-gray-50 text-slate-800 border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customHours * 3600 + customMinutes * 60 + customSeconds > 0) {
                      setCustomTime();
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-gray-50 text-slate-800 border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customHours * 3600 + customMinutes * 60 + customSeconds > 0) {
                      setCustomTime();
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-lg border focus:border-purple-500 focus:outline-none text-lg ${
                    theme === 'dark'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-gray-50 text-slate-800 border-gray-300'
                  }`}
                />
               </div>
             </div>
             
             <div className="text-center">
               <div className={`text-lg mb-4 ${
                 theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
               }`}>
                 Total: {formatTime(customHours * 3600 + customMinutes * 60 + customSeconds)}
               </div>
               <button
                 onClick={setCustomTime}
                 disabled={customHours * 3600 + customMinutes * 60 + customSeconds === 0}
                 className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-lg"
               >
                 Update {selectedPreset.name} Timer
               </button>
             </div>
           </div>
         )}

         

        {/* Timer Controls */}
        <div className="flex gap-4 justify-center mb-8">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-xl"
            >
              <Play size={24} />
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-xl"
            >
              <Pause size={24} />
              Pause
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-xl"
          >
            <RotateCcw size={24} />
            Reset
          </button>

          <button
            onClick={() => {
              setShowNewModeModal(true);
              setNewModeName('');
              setNewModeColor('bg-purple-500');
              setIsAchievementMode(false);
              setCustomHours(0);
              setCustomMinutes(25);
              setCustomSeconds(0);
            }}
            className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-xl"
          >
            <Clock size={24} />
            Custom
          </button>

          {isClient && (
            <button
              onClick={() => {
                // Open popout window
                const width = 200;
                const height = 250;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                
                const newWindow = window.open(
                  '/popout',
                  'TimerPopout',
                  `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,resizable=no,alwaysOnTop=yes,alwaysRaised=yes`
                );
                
                if (newWindow) {
                  setPopoutWindow(newWindow);
                  // Send initial state
                  setTimeout(() => {
                    // Create a serializable version of the preset without React elements
                    const serializablePreset = {
                      ...selectedPreset,
                      icon: undefined // Remove the React element
                    };

                    newWindow.postMessage({
                      type: 'TIMER_UPDATE',
                      data: {
                        timeLeft,
                        isRunning,
                        selectedPreset: serializablePreset
                      }
                    }, '*');
                  }, 1000); // Wait for window to load
                }
              }}
              className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-xl"
            >
              <Maximize2 size={24} />
              Pop Out
            </button>
          )}
        </div>

                 {/* Status */}
         <div className="text-center">
                     <div className={`text-lg ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {isRunning ? 'Timer is running...' : 'Timer is paused'}
          </div>

          {/* Temporary Supabase Test Button */}
          <button
            onClick={async () => {
              try {
                const { data, error } = await fetch('/api/test-supabase').then(res => res.json());
                if (error) {
                  console.error('Supabase test error:', error);
                  alert('Supabase connection failed: ' + error.message);
                } else {
                  console.log('Supabase test result:', data);
                  alert('Supabase connected successfully!');
                }
              } catch (error) {
                console.error('Test failed:', error);
                alert('Failed to test Supabase connection: ' + error);
              }
            }}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Supabase Connection
          </button>
        </div>
      </div>
    </div>
  );
} 