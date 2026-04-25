import { useState } from 'react';
import { Terminal, Copy, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/utils';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

export function DatabaseSetupHelp() {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const sqlCode = `-- 🛡️ GigKavacham Supabase Full Setup (ROLE-BASED)
-- Run this in your Supabase SQL Editor

-- 1. Create Claims Table (If missing)
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  policy_id UUID,
  status TEXT DEFAULT 'processing',
  trigger_type TEXT,
  dcs_score INTEGER,
  amount NUMERIC,
  zone TEXT,
  fraud_score INTEGER,
  fraud_decision TEXT DEFAULT 'pass',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Payouts Table (If missing)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  claim_id UUID,
  amount NUMERIC,
  status TEXT DEFAULT 'processing',
  reason TEXT,
  upi_id TEXT,
  payout_method TEXT DEFAULT 'UPI',
  transaction_id TEXT,
  settlement_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure role column exists and set YOUR account as admin
-- REPLACE 'your-user-id-here' with your actual ID from the Profiles table
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON profiles;
DROP POLICY IF EXISTS "Admin Full Access Policies" ON policies;
DROP POLICY IF EXISTS "Admin Full Access Payouts" ON payouts;
DROP POLICY IF EXISTS "Admin Full Access Claims" ON claims;

-- 5. Create ROLE-BASED policies
-- These policies check if the user's role in 'profiles' is 'admin'
CREATE POLICY "Admin Access Profiles" ON profiles FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR auth.uid() = id);

CREATE POLICY "Admin Access Policies" ON policies FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admin Access Payouts" ON payouts FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admin Access Claims" ON claims FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR auth.uid() = user_id);

-- 6. Public read for profiles (required for mapping names)
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);`;

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

      <button 
        onClick={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
            if (error) toast.error('Failed to promote: ' + error.message);
            else toast.success('You are now an Admin! Refresh the page.');
          }
        }}
        className="ml-4 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-[10px] font-bold text-primary-fixed hover:bg-primary/30 transition-all"
      >
        ⚡ Promote Me to Admin
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
