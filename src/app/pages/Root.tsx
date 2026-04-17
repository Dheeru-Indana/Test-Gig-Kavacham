import { Outlet } from 'react-router';
import { AppProvider } from '../context/AppContext';
import { Toaster } from '../components/ui/sonner';
import { AIAssistant } from '../components/AIAssistant';
import { ThemeProvider } from '../context/ThemeContext';

export default function Root() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen">
          <Outlet />
          <AIAssistant />
        </div>
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}

