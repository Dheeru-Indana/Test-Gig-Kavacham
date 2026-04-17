import { Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

export function AIPanel({ title = "AI Insight", children, variant = "primary" }: { title?: string, children: ReactNode, variant?: "primary" | "warning" | "destructive" }) {
  
  const colors = {
    primary: "from-primary/10 border-primary text-primary",
    warning: "from-warning/10 border-warning text-warning",
    destructive: "from-destructive/10 border-destructive text-destructive"
  };

  const selectedColor = colors[variant];

  return (
    <div className={`bg-gradient-to-r to-transparent border-l-2 p-4 rounded-r-xl ${selectedColor.split(' ')[0]} ${selectedColor.split(' ')[1]}`}>
      <div className={`flex items-center gap-2 mb-2 font-semibold ${selectedColor.split(' ')[2]}`}>
        <Sparkles className="w-4 h-4" />
        {title}
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed font-medium">
        {children}
      </div>
    </div>
  );
}
