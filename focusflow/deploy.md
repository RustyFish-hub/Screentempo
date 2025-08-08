# FocusFlow Deployment Guide

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

## Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## Deployment Options

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

### Netlify
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Deploy from Git

### Docker
1. Build the Docker image:
   ```bash
   docker build -t focusflow .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 focusflow
   ```

## Environment Variables

No environment variables are required for basic functionality.

## Browser Requirements

- Modern browsers with ES6+ support
- Web Audio API support for notifications
- localStorage support for persistence
- window.open() support for popout functionality

## Performance Optimization

The application is optimized for:
- Fast loading with Next.js 14
- Minimal bundle size
- Efficient state management
- Responsive design 