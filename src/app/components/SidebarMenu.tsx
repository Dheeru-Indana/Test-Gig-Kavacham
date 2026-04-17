import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, Settings, Info, HelpCircle,
  GitBranch, Shield, ChevronRight, Moon, Sun, Sparkles, Bell
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/**
 * SidebarMenu — Full-height glassmorphism sidebar
 * Items stack vertically using full available height.
 * No scroll — items laid out naturally with spacing.
 */
export function SidebarMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl hover:bg-muted/50 transition-colors text-foreground"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop — heavily blurred completely over the screen */}
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl"
            />

            {/* Panel — full height, breaks out of containment via portal */}
            <motion.div
              ref={panelRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[110] w-80 max-w-[85vw]
                flex flex-col
                bg-white dark:bg-slate-950
                border-r border-border/30 shadow-2xl"
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-foreground">GigKavacham</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ── Menu Items — fill available space and scroll if needed ── */}
              <div className="flex-1 min-h-0 flex flex-col px-3 py-4 gap-1 overflow-y-auto custom-scrollbar">

                {/* Settings — navigates to full settings page */}
                <MenuItem
                  icon={<Settings className="w-5 h-5" />}
                  label="App Settings"
                  subtitle="Theme, preferences & more"
                  onClick={() => goTo("/app-settings")}
                />

                {/* About */}
                <ExpandableItem icon={<Info className="w-5 h-5" />} label="About GigKavacham">
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                    <p>India's 1st parametric insurance platform built specifically for gig workers.</p>
                    <p>Automatic payouts, zero claims. Powered by live weather and AI risk models.</p>
                  </div>
                </ExpandableItem>

                {/* Help / FAQs */}
                <ExpandableItem icon={<HelpCircle className="w-5 h-5" />} label="Help / FAQs">
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <div>
                      <p className="font-semibold text-foreground text-xs mb-0.5">How does auto-payout work?</p>
                      <p>When live weather data crosses the safety threshold, payouts trigger to your UPI automatically.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-xs mb-0.5">Do I need to file a claim?</p>
                      <p>Never. Everything is parametric and autonomous.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-xs mb-0.5">What triggers a payout?</p>
                      <p>Heavy rainfall, extreme AQI, heatwaves, or platform outages confirmed by government APIs.</p>
                    </div>
                  </div>
                </ExpandableItem>

                {/* Spacer to push version to bottom */}
                <div className="flex-1" />
              </div>

              {/* ── Footer — Version pinned to bottom ── */}
              <div className="px-5 py-4 border-t border-border/30 flex items-center justify-between shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-xs font-medium">Version</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted py-1 px-2.5 rounded-md">
                  v1.0.0
                </span>
              </div>
            </motion.div>
          </>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/* ── Menu Item ─────────────────────────────────────────────────── */
function MenuItem({
  icon, label, subtitle, onClick, trailing,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl
        hover:bg-muted/50 transition-colors text-foreground group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-primary shrink-0">{icon}</span>
        <div className="text-left min-w-0">
          <span className="font-semibold text-sm block">{label}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </div>
      {trailing || <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />}
    </button>
  );
}

/* ── Expandable Item ───────────────────────────────────────────── */
function ExpandableItem({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl
          hover:bg-muted/50 transition-colors text-foreground text-sm"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <span className="font-semibold">{label}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${expanded ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden px-4 pb-2"
          >
            <div className="pl-8 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
