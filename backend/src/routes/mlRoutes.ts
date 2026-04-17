import { Router, Request, Response } from 'express'
import {
    predictPremium,
    predictDcs,
    scoreFraud,
    classifyIntent,
    scoreRegistrationRisk,
    checkMlHealth,
} from '../services/mlClient'

const router = Router()

// Health
router.get('/health', async (req: Request, res: Response) => {
    const health = await checkMlHealth()
    res.json(health)
})

// Premium prediction
router.post(
    '/premium/predict',
    async (req: Request, res: Response) => {
        const result = await predictPremium(req.body)
        if (!result) {
            return res.status(503).json({
                error: 'ML service unavailable',
                fallback: true,
            })
        }
        res.json(result)
    }
)

// DCS forecast
router.post(
    '/dcs/predict',
    async (req: Request, res: Response) => {
        const result = await predictDcs(req.body)
        if (!result) {
            return res.status(503).json({
                error: 'ML service unavailable',
                fallback: true,
            })
        }
        res.json(result)
    }
)

// Fraud score
router.post(
    '/fraud/score',
    async (req: Request, res: Response) => {
        const result = await scoreFraud(req.body)
        if (!result) {
            return res.status(503).json({
                error: 'ML service unavailable',
                fallback: true,
            })
        }
        res.json(result)
    }
)

// Chatbot intent
router.post(
    '/chat/classify',
    async (req: Request, res: Response) => {
        const { query } = req.body
        if (!query) {
            return res.status(400).json({
                error: 'Query required'
            })
        }
        const result = await classifyIntent(query)
        if (!result) {
            return res.status(503).json({
                error: 'ML service unavailable',
                intent: 'fallback',
                confidence: 0,
            })
        }
        res.json(result)
    }
)

// Registration risk
router.post(
    '/risk/score',
    async (req: Request, res: Response) => {
        const result = await scoreRegistrationRisk(req.body)
        if (!result) {
            return res.status(503).json({
                error: 'ML service unavailable',
                fallback: true,
            })
        }
        res.json(result)
    }
)

export default router
