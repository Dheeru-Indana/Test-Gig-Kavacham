import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Info, BellRing, BellOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import type { AppNotification } from '../../context/AppContext';

// Notification type → icon + color mapping
const NOTIFICATION_STYLES: Record<string, { emoji: string; color: string; bg: string }> = {
  payout_credited:  { emoji: '💰', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  payout_pending:   { emoji: '⏳', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  payout_failed:    { emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  dcs_alert:        { emoji: '⚠️', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  policy_active:    { emoji: '🛡️', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  policy_cancelled: { emoji: '❌', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  policy_upgraded:  { emoji: '⬆️', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  policy_paused:    { emoji: '⏸️', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  fraud_flagged:    { emoji: '🔒', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  // Legacy types
  'AQI Hazard':     { emoji: '🌫️', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  'Fraud Review':   { emoji: '🔒', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  'Payout Failure': { emoji: '🔴', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  info:             { emoji: 'ℹ️', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
};

function getStyle(type: string) {
  return NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAllRead } = useApp();

  // Group notifications by date
  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    const today: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    notifications.forEach(n => {
      const ts = new Date(n.timestamp).getTime();
      if (ts >= todayStart) today.push(n);
      else if (ts >= weekStart) thisWeek.push(n);
      else earlier.push(n);
    });

    return { today, thisWeek, earlier };
  }, [notifications]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  const renderGroup = (label: string, items: AppNotification[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 px-1">{label}</p>
        <motion.div variants={containerVariants as any} initial="hidden" animate="show" className="space-y-3">
          {items.map(n => (
            <motion.div key={n.id} variants={itemVariants as any}>
              <NotificationCard notification={n} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden font-sans selection:bg-primary/20">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/10 pattern-size-4 z-0 pointer-events-none opacity-50" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Header */}
      <div className="bg-card/90 border-b border-border shadow-sm relative z-10 backdrop-blur-md">
        <div className="p-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted bg-secondary/30 backdrop-blur-sm shadow-sm">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">Activity & alerts</p>
            </div>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button onClick={() => markAllRead()} className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 transition-colors">Mark all read</button>
              )}
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center relative">
                <BellRing className="w-5 h-5 text-primary" />
                <div className="absolute top-[8px] right-[8px] w-2 h-2 bg-accent rounded-full border border-card" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 relative z-10">
        {notifications.length > 0 ? (
          <>
            {renderGroup('Today', grouped.today)}
            {renderGroup('This Week', grouped.thisWeek)}
            {renderGroup('Earlier', grouped.earlier)}
          </>
        ) : (
          <div className="p-12 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground/50">
              <BellOff className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-1">All Caught Up</h3>
            <p className="text-sm text-muted-foreground">You have no active alerts or notifications right now.</p>
          </div>
        )}

        {/* Info Box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-6 p-4 rounded-2xl bg-card border border-border shadow-sm flex gap-3 text-muted-foreground">
          <Info className="w-5 h-5 text-muted-foreground/60 flex-shrink-0" />
          <p className="text-sm leading-relaxed">
            Important alerts are also delivered directly to your registered WhatsApp number instantly.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function NotificationCard({ notification }: { notification: AppNotification }) {
  const style = getStyle(notification.type);

  const formatTime = () => {
    const date = new Date(notification.timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="p-5 rounded-[1.5rem] bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:shadow-md hover:bg-card transition-all cursor-default">
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border text-xl ${style.bg}`}>
          {style.emoji}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {(notification as any).title && (
            <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${style.color}`}>
              {(notification as any).title}
            </p>
          )}
          <p className="text-[15px] font-medium leading-snug text-foreground/90">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wide uppercase">{formatTime()}</p>
        </div>
      </div>
    </div>
  );
}
