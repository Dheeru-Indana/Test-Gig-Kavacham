import { useState } from 'react';
import { Terminal, Copy, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/utils';

export function DatabaseSetupHelp() {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sqlCode = `-- 🛡️ GigKavacham Supabase RLS Setup (REVISED)
-- Run this in your Supabase SQL Editor to fix 'Infinite Recursion'

-- 1. Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 2. Drop the recursive policies that are causing errors
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all policies" ON policies;
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;

-- 3. Create NEW safe policies using JWT email (Avoids recursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    (auth.jwt() ->> 'email') = 'admin@gigkavacham.com' OR auth.uid() = id
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    (auth.jwt() ->> 'email') = 'admin@gigkavacham.com' OR auth.uid() = id
  );

CREATE POLICY "Admins can manage policies" ON policies
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'admin@gigkavacham.com' OR auth.uid() = user_id
  );

CREATE POLICY "Admins can view payouts" ON payouts
  FOR SELECT USING (
    (auth.jwt() ->> 'email') = 'admin@gigkavacham.com' OR auth.uid() = user_id
  );

-- 4. EMERGENCY: Give admin bypass for all operations (Insert/Update/Delete)
CREATE POLICY "Admin Alpha Access" ON profiles FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@gigkavacham.com');
CREATE POLICY "Admin Policy Access" ON policies FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@gigkavacham.com');
CREATE POLICY "Admin Payout Access" ON payouts FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@gigkavacham.com');`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-fixed hover:text-white transition-colors"
      >
        <AlertCircle className="w-3 h-3" />
        {isOpen ? 'Close Setup Guide' : 'No users showing? Fix Supabase RLS'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-black/40 border border-outline-variant/10 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Terminal className="w-5 h-5 text-warning shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-white">Database Visibility Setup</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                    Supabase Row Level Security (RLS) is likely blocking the Admin from seeing worker profiles. 
                    Copy and run the SQL below in your <strong className="text-white">Supabase SQL Editor</strong> to fix this.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <pre className="bg-surface-container-lowest p-4 rounded-lg text-[10px] font-mono text-on-surface-variant overflow-x-auto border border-outline-variant/5">
                  {sqlCode}
                </pre>
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-surface-container-high border border-outline-variant/10 hover:border-primary transition-all text-white shadow-lg"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-primary-container/10 rounded-lg border border-primary-container/20">
                <Check className="w-4 h-4 text-primary-fixed" />
                <p className="text-[10px] font-medium text-primary-fixed uppercase tracking-wider">
                  Applying this will link the Admin to all worker data.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
