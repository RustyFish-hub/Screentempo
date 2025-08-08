# FocusFlow - Browser-Based Timer with Popout Window

FocusFlow is a modern, distraction-free timer application built with Next.js that helps you stay focused and build better study/gaming habits. The app features a unique popout window functionality that allows you to keep the timer visible while working in other applications.

## Features

### Phase 1 (MVP) ✅
- **Main Timer Interface**: Clean, modern design with start/pause/reset functionality
- **Popout Window**: Compact timer window that stays on top of other applications
- **Timer Presets**: Pre-configured timers for different activities
  - Pomodoro (25 minutes)
  - Study (45 minutes)
  - Gaming (60 minutes)
  - Custom (30 minutes)
- **Visual Progress**: Circular progress indicator with smooth animations
- **Keyboard Shortcuts**: Quick controls for better workflow
  - Spacebar: Start/Pause timer
  - Ctrl+R: Reset timer
- **Sound Notifications**: Audio alerts when timer completes
- **State Persistence**: Timer state saved in localStorage

### Phase 2 (Enhanced) 🚧
- Timer categories with different colors
- Enhanced sound notifications
- Session history tracking
- Settings for notification preferences
- Auto-break reminders

### Phase 3 (Advanced) 📋
- Daily/weekly time tracking dashboard
- Achievement badges and streak tracking
- Multiple simultaneous timers
- Export session data
- Customizable themes

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd focusflow
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Main Interface
1. Select a timer preset (Pomodoro, Study, Gaming, or Custom)
2. Click "Start" or press Spacebar to begin the timer
3. Use "Pause" to pause the timer or "Reset" to reset to the original duration
4. The circular progress indicator shows your progress through the session

### Popout Window
1. Click "Pop Out Timer" to open a compact timer window
2. The popout window will appear in the top-right corner of your screen
3. The popout stays on top of other applications and maintains sync with the main window
4. You can control the timer from either window
5. Close the popout window by clicking the X button

### Keyboard Shortcuts
- **Spacebar**: Start or pause the timer
- **Ctrl+R** (or Cmd+R on Mac): Reset the timer to the original duration

## Technical Details

### Built With
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Web Audio API**: Sound notifications

### Architecture
- **Main Timer Component**: Handles the primary timer interface and logic
- **Popout Timer Component**: Compact version for the separate window
- **Message Passing**: Communication between main window and popout
- **Local Storage**: Persistence of timer state and settings
- **Utility Functions**: Shared timer and formatting functions

### File Structure
```
src/
├── app/
│   ├── page.tsx          # Main application page
│   ├── popout/
│   │   └── page.tsx      # Popout window page
│   └── layout.tsx        # Root layout
├── components/
│   ├── Timer.tsx         # Main timer component
│   └── PopoutTimer.tsx   # Popout timer component
└── utils/
    └── timer.ts          # Timer utility functions
```

## Browser Compatibility

FocusFlow works best in modern browsers that support:
- ES6+ JavaScript features
- Web Audio API
- localStorage
- window.open() with specific features

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the Pomodoro Technique
- Built with modern web technologies for optimal performance
- Designed for productivity and focus
