export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeLong = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export interface SoundOption {
  id: string;
  name: string;
  path: string;
  volume?: number;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'gentle-chime',
    name: 'Gentle Chime',
    path: '/sounds/gentle-chime.mp3',
    volume: 0.3
  },
  {
    id: 'notification',
    name: 'Gentle Notification',
    path: '/sounds/notification.mp3',
    volume: 0.3
  },
  {
    id: 'bell',
    name: 'Bell',
    path: '/sounds/bell.mp3',
    volume: 0.25
  },
  {
    id: 'digital',
    name: 'Digital Alert',
    path: '/sounds/digital.mp3',
    volume: 0.3
  },
  {
    id: 'none',
    name: 'No Sound',
    path: ''
  }
];

export const playNotificationSound = async (soundId: string = 'gentle-chime', masterVolume: number = 1) => {
  if (soundId === 'none') return;

  const soundOption = SOUND_OPTIONS.find(sound => sound.id === soundId);
  if (!soundOption) return;

  try {
    const audio = new Audio(soundOption.path);
    // Apply both the sound's base volume and the master volume
    if (soundOption.volume) {
      audio.volume = soundOption.volume * masterVolume;
    } else {
      audio.volume = masterVolume;
    }
    await audio.play();
  } catch {
    // Fallback to beep sound only if the selected sound isn't "No Sound"
    createBeepSound(masterVolume);
  }
};

const createBeepSound = () => {
  try {
    const context = new (window.AudioContext || (window as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Softer, longer sound with a gentle fade
    oscillator.frequency.setValueAtTime(600, context.currentTime); // Lower frequency for softer tone
    oscillator.frequency.setValueAtTime(800, context.currentTime + 0.5); // Slight pitch change
    
    // Create a gentle fade in and out
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.1); // Very soft volume (5%)
    gainNode.gain.setValueAtTime(0.05, context.currentTime + 1.4);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 1.5);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1.5); // Longer duration (1.5 seconds)
  } catch (error) {
    console.log('Audio notification not supported');
  }
};

export const saveToLocalStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};