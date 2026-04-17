/**
 * GigKavacham — Simulated Instant Payout System
 * 
 * Simulates a real-time UPI payout pipeline with async step progression.
 * Each step fires an onStatusUpdate callback so the UI can animate in real time.
 * 
 * Pipeline: Initiated → Processing → Credited/Failed
 * 95% success rate, 5% simulated UPI gateway failure.
 */

export interface PayoutRequest {
  userId: string
  claimId: string
  amount: number
  upiId: string
  planName: string
  triggerType: string
  dcsScore: number
  fraudDecision: 'pass' | 'review' | 'fail'
}

export interface PayoutResult {
  payoutId: string
  status: 'initiated' | 'processing' | 'credited' | 'failed'
  amount: number
  upiId: string
  gateway: string
  transactionId: string
  settlementTimeSeconds: number
  timestamp: string
  message: string
}

export const simulatePayout = async (
  request: PayoutRequest,
  onStatusUpdate: (status: PayoutResult) => void
): Promise<PayoutResult> => {
  const payoutId = `GK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const transactionId = `UPI${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  // If fraud check failed — do not initiate payout
  if (request.fraudDecision === 'fail') {
    const failResult: PayoutResult = {
      payoutId,
      status: 'failed',
      amount: request.amount,
      upiId: request.upiId,
      gateway: 'UPI / NPCI',
      transactionId,
      settlementTimeSeconds: 0,
      timestamp: new Date().toISOString(),
      message: 'Payout blocked — claim did not pass fraud verification.',
    }
    onStatusUpdate(failResult)
    return failResult
  }

  const startTime = Date.now()

  // STEP 1 — Initiated
  const step1: PayoutResult = {
    payoutId,
    status: 'initiated',
    amount: request.amount,
    upiId: request.upiId,
    gateway: 'UPI / NPCI',
    transactionId,
    settlementTimeSeconds: 0,
    timestamp: new Date().toISOString(),
    message: `Payout of ₹${request.amount.toLocaleString('en-IN')} initiated for ${request.triggerType} event.`,
  }
  onStatusUpdate(step1)

  // STEP 2 — Processing (after 1.5 seconds)
  await new Promise(r => setTimeout(r, 1500))
  const step2: PayoutResult = {
    ...step1,
    status: 'processing',
    message: `Processing UPI transfer to ${request.upiId}. Transaction ID: ${transactionId}`,
  }
  onStatusUpdate(step2)

  // STEP 3 — Credited or Failed (after 3 more seconds)
  await new Promise(r => setTimeout(r, 3000))
  const settlementTime = Math.round((Date.now() - startTime) / 1000)

  // 95% success rate simulation — 5% fail
  const success = Math.random() > 0.05

  if (!success) {
    const failResult: PayoutResult = {
      ...step1,
      status: 'failed',
      settlementTimeSeconds: settlementTime,
      message: `UPI transfer failed. Transaction will be retried automatically. Ref: ${transactionId}`,
    }
    onStatusUpdate(failResult)
    return failResult
  }

  const creditedResult: PayoutResult = {
    payoutId,
    status: 'credited',
    amount: request.amount,
    upiId: request.upiId,
    gateway: 'UPI / NPCI',
    transactionId,
    settlementTimeSeconds: settlementTime,
    timestamp: new Date().toISOString(),
    message: `₹${request.amount.toLocaleString('en-IN')} credited to ${request.upiId} in ${settlementTime} seconds. Transaction: ${transactionId}`,
  }
  onStatusUpdate(creditedResult)
  return creditedResult
}
