/**
 * GigKavacham — PayoutPipeline Visualization Component
 * 
 * A 4-step animated horizontal stepper showing the full payout journey:
 *   1. Trigger Verified  →  2. Policy Confirmed  →  3. Fraud Cleared  →  4. UPI Transfer
 * 
 * Animates through steps in real-time as the payout simulation progresses.
 */

import { motion, AnimatePresence } from 'motion/react';
import type { PayoutResult } from '../../../services/payout/payoutSimulator';
import { cn } from '../ui/utils';

interface PipelineStep {
  label: string
  icon: string
  status: 'pending' | 'active' | 'done' | 'failed'
  timestamp?: string
}

interface PayoutPipelineProps {
  payoutResult: PayoutResult | null
  triggerVerified?: boolean
  policyConfirmed?: boolean
  fraudCleared?: boolean
  className?: string
}

export function PayoutPipeline({
  payoutResult,
  triggerVerified = false,
  policyConfirmed = false,
  fraudCleared = false,
  className = '',
}: PayoutPipelineProps) {
  const isFailed = payoutResult?.status === 'failed'
  const isCredited = payoutResult?.status === 'credited'
  const isProcessing = payoutResult?.status === 'processing'
  const isInitiated = payoutResult?.status === 'initiated'

  const steps: PipelineStep[] = [
    {
      label: 'Trigger Verified',
      icon: 'bolt',
      status: triggerVerified ? 'done' : 'pending',
    },
    {
      label: 'Policy Confirmed',
      icon: 'verified_user',
      status: policyConfirmed ? 'done' : triggerVerified ? 'active' : 'pending',
    },
    {
      label: 'Fraud Cleared',
      icon: 'shield',
      status: isFailed && !fraudCleared ? 'failed' : fraudCleared ? 'done' : policyConfirmed ? 'active' : 'pending',
    },
    {
      label: 'UPI Transfer',
      icon: 'account_balance_wallet',
      status: isCredited ? 'done' : isFailed ? 'failed' : isProcessing ? 'active' : isInitiated ? 'active' : 'pending',
      timestamp: isCredited ? payoutResult?.timestamp : undefined,
    },
  ]

  const statusColors = {
    pending: 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant',
    active: 'bg-primary-container/30 border-primary-container/50 text-primary-fixed animate-pulse',
    done: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    failed: 'bg-error/20 border-error/40 text-error',
  }

  const connectorColors = {
    pending: 'bg-outline-variant/20',
    active: 'bg-primary-container/40',
    done: 'bg-emerald-500/40',
    failed: 'bg-error/40',
  }

  return (
    <div className={cn('glass-panel border border-outline-variant/10 rounded-2xl p-6 shadow-xl', className)}>
      {/* Pipeline Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1">
            {/* Step Node */}
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500',
                  statusColors[step.status]
                )}
              >
                <span className="material-symbols-outlined text-xl">{step.icon}</span>
              </motion.div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-2 text-center max-w-[80px] leading-tight">
                {step.label}
              </span>
              {step.status === 'done' && (
                <span className="text-[9px] font-mono text-emerald-400 mt-1">✓</span>
              )}
              {step.status === 'failed' && (
                <span className="text-[9px] font-mono text-error mt-1">✗</span>
              )}
            </div>

            {/* Connector Line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 rounded-full overflow-hidden bg-outline-variant/10">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{
                    width: steps[i + 1].status !== 'pending' ? '100%' : step.status === 'done' ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', connectorColors[step.status])}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transaction Details */}
      {payoutResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Transaction ID</p>
              <p className="text-xs font-mono text-white font-bold truncate">{payoutResult.transactionId}</p>
            </div>
            <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Gateway</p>
              <p className="text-xs font-mono text-white font-bold">{payoutResult.gateway} <span className="text-on-surface-variant font-sans">(Simulated)</span></p>
            </div>
            <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Amount</p>
              <p className="text-lg font-mono text-primary-fixed font-black tracking-tighter">₹{payoutResult.amount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Settlement</p>
              <p className="text-xs font-mono text-white font-bold">{payoutResult.settlementTimeSeconds}s</p>
            </div>
          </div>

          {/* Success State */}
          <AnimatePresence>
            {isCredited && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center"
              >
                <div className="text-3xl mb-2">✓</div>
                <h4 className="text-lg font-bold text-emerald-400 mb-1">Payment Successful</h4>
                <p className="text-sm font-mono text-white font-bold">
                  ₹{payoutResult.amount.toLocaleString('en-IN')} credited to {payoutResult.upiId}
                </p>
                <p className="text-[10px] font-mono text-on-surface-variant mt-2">
                  {new Date(payoutResult.timestamp).toLocaleString('en-IN')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Failure State */}
          <AnimatePresence>
            {isFailed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-error/10 border border-error/30 rounded-xl p-5 text-center"
              >
                <div className="text-3xl mb-2">✗</div>
                <h4 className="text-lg font-bold text-error mb-1">Transfer Failed</h4>
                <p className="text-sm text-on-surface-variant">{payoutResult.message}</p>
                <p className="text-xs font-mono text-error mt-2 animate-pulse">Auto-retry in 30 seconds</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
