import { useNavigate } from 'react-router';
import { ArrowLeft, Moon, Sun, Monitor, Info, Shield, GitBranch } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useTheme } from '../../context/ThemeContext';

export default function AppSettings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted/50 rounded-full transition-colors text-foreground">
            <ArrowLeft className="w-5 h-5 cursor-pointer" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-primary">App Settings</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        
        {/* Theme Settings */}
        <Card className="p-5 border-border rounded-2xl bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3 mb-4">
            <Monitor className="w-5 h-5" />
            <h2 className="text-base font-semibold">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-semibold">App Theme</h3>
              <p className="text-sm text-muted-foreground">Toggle between Light and Dark mode globally.</p>
            </div>
            
            <button 
              onClick={toggleTheme} 
              className="p-3 rounded-xl bg-muted/30 border border-white/5 hover:bg-muted/50 transition-colors shadow-sm"
            >
               {theme === 'dark' ? <Sun className="w-5 h-5 text-accent"/> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>
          </div>
        </Card>

        {/* About App */}
        <Card className="p-5 border-border rounded-2xl bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3 mb-4">
            <Info className="w-5 h-5" />
            <h2 className="text-base font-semibold">About GigKavacham</h2>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
             <p>GigKavacham is India's 1st parametric insurance platform built specifically for gig workers.</p>
             <p>Our goal is to protect you against environmental and platform disruptions automatically.</p>
             <p>Never file a claim manually again—experience autonomous payouts triggered by Live Oracle metrics ensuring absolute continuity for your hard work.</p>
          </div>
        </Card>

        {/* About Policy */}
        <Card className="p-5 border-border rounded-2xl bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3 mb-4">
            <Shield className="w-5 h-5" />
            <h2 className="text-base font-semibold">Policy Enforcement</h2>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
             <p>Our AI engines continuously query regional weather and platform latency metrics generating a dynamic Disruption Condition Score (DCS).</p>
             <p>Whenever tracking scores cross <b>0.70</b>, our smart contracts actively transfer compensation mapping against your selected Plan tier exactly without deductions mapping directly to your authenticated UPI handle securely natively.</p>
          </div>
        </Card>

        {/* Version Info */}
        <Card className="p-5 border-border rounded-2xl bg-card shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <GitBranch className="w-5 h-5" />
            <span className="font-semibold">Version Info</span>
          </div>
          <span className="text-sm font-bold text-muted-foreground bg-muted py-1 px-3 rounded-md">Version 1.0.0</span>
        </Card>
        
      </div>
    </div>
  );
}
