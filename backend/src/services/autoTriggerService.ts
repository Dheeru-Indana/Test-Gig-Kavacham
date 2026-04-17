import cron from 'node-cron'
import axios from 'axios'
import { getAdmin, triggerPayout } from './payoutEngine'

const API_KEY = process.env.OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

export const initAutoTrigger = () => {
  console.log('[AutoTrigger] Initializing background weather monitor (Every 15 mins)...')

  // Run every 15 minutes: '*/15 * * * *'
  // For demo testing, run every 5 minutes: '*/5 * * * *'
  cron.schedule('*/15 * * * *', async () => {
    console.log('[AutoTrigger] Checking regional weather conditions for all active workers...')

    const supabaseAdmin = getAdmin()

    try {
      // 1. Get all users with active policies
      const { data: policies } = await supabaseAdmin
        .from('policies')
        .select('user_id')
        .eq('status', 'ACTIVE')

      if (!policies || policies.length === 0) {
        console.log('[AutoTrigger] No active policies found. Skipping check.')
        return
      }

      // Unique user IDs
      const userIds = [...new Set(policies.map(p => p.user_id))]

      for (const userId of userIds) {
        // 2. Fetch User Profile for City
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, city, full_name')
          .eq('id', userId)
          .maybeSingle()

        if (!profile || !profile.city) continue

        // 3. Fetch Real-time Weather from OpenWeather
        try {
          const response = await axios.get(`${BASE_URL}?q=${profile.city},IN&units=metric&appid=${API_KEY}`)
          const weather = response.data
          
          // Simplified Anomaly Thresholds
          const rainfall = weather.rain ? (weather.rain['1h'] || 0) : 0
          const temp = weather.main.temp
          
          let anomaly = null

          if (rainfall > 10) { // > 10mm/h is heavy rain
            anomaly = { type: 'RAINFALL_FLOOD', label: 'Real-time Heavy Rainfall', dcsScore: 85, factor: 0.6 }
          } else if (temp > 42) { // Heatwave
            anomaly = { type: 'EXTREME_HEAT', label: 'Regional Heatwave', dcsScore: 78, factor: 0.4 }
          }
          // Note: Standard OWM free tier doesn't give AQI. 
          // For AQI we'd need /air_pollution endpoint.

          if (anomaly) {
            console.log(`[AutoTrigger] DISRUPTION DETECTED for ${profile.full_name} in ${profile.city}: ${anomaly.label}`)
            await triggerPayout(userId, anomaly)
          }

        } catch (weatherErr: any) {
          console.error(`[AutoTrigger] Weather fetch failed for ${profile.city}:`, weatherErr.message)
        }
      }

    } catch (err: any) {
      console.error('[AutoTrigger] Loop error:', err.message)
    }
  })
}
