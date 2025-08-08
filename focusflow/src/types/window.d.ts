interface WindowHandle {
  setAlwaysOnTop(value: boolean): Promise<void>;
}

interface Window {
  getWindowHandle(): Promise<WindowHandle>;
}
