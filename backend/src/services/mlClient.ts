import axios from 'axios'

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001'

const mlApi = axios.create({
    baseURL: ML_URL,
    timeout: 25000,
    headers: { 'Content-Type': 'application/json' },
})

// Health check
export const checkMlHealth = async () => {
    try {
        const res = await mlApi.get('/health')
        return res.data
    } catch {
        return { status: 'unavailable' }
    }
}

// Premium prediction
export const predictPremium = async (input: any) => {
    try {
        const res = await mlApi.post('/ml/premium/predict', input)
        return res.data
    } catch (e: any) {
        console.error('ML premium prediction failed:', e.message)
        return null
    }
}

// DCS forecast
export const predictDcs = async (input: any) => {
    try {
        const res = await mlApi.post('/ml/dcs/predict', input)
        return res.data
    } catch (e: any) {
        console.error('ML DCS prediction failed:', e.message)
        return null
    }
}

// Fraud scoring
export const scoreFraud = async (input: any) => {
    try {
        const res = await mlApi.post('/ml/fraud/score', input)
        return res.data
    } catch (e: any) {
        console.error('ML fraud scoring failed:', e.message)
        return null
    }
}

// Chatbot intent
export const classifyIntent = async (query: string) => {
    try {
        const res = await mlApi.post('/ml/chat/classify', {
            query,
            threshold: 0.30,
        })
        return res.data
    } catch (e: any) {
        console.error('ML intent classification failed:', e.message)
        return null
    }
}

// Registration risk
export const scoreRegistrationRisk = async (input: any) => {
    try {
        const res = await mlApi.post('/ml/risk/score', input)
        return res.data
    } catch (e: any) {
        console.error('ML risk scoring failed:', e.message)
        return null
    }
}
