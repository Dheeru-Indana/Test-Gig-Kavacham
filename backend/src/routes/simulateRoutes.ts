import { Router } from 'express'
import { getAdmin, triggerPayout } from '../services/payoutEngine'

const router = Router()

const ANOMALIES = [
  { type: 'AQI_HAZARD', label: 'Severe Air Quality Alert', dcsScore: 82, factor: 0.45 },
  { type: 'RAINFALL_FLOOD', label: 'Flash Flood Warning', dcsScore: 88, factor: 0.65 },
  { type: 'EXTREME_HEAT', label: 'High Temperature Hazard', dcsScore: 75, factor: 0.35 }
]

router.post('/simulate-trigger', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  const supabaseAdmin = getAdmin()

  try {
    // 0. Random Anomaly selection
    const anomaly = ANOMALIES[Math.floor(Math.random() * ANOMALIES.length)];

    // 1. Trigger the actual payout pipeline
    const payoutResult = await triggerPayout(userId, anomaly)

    if (!payoutResult) {
       return res.status(400).json({ error: 'No active policy found' })
    }

    // 2. Fetch profile name for response (optional)
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, city, zone').eq('id', userId).maybeSingle()

    return res.status(200).json({
      success: true,
      data: {
        payoutAmount: payoutResult.payoutAmount,
        transactionId: payoutResult.transactionId,
        zone: profile?.zone || profile?.city || 'General',
        anomalyType: anomaly.type,
        anomalyLabel: anomaly.label
      }
    })

  } catch (err: any) {
    console.error('[SimulationPipeline] Error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router