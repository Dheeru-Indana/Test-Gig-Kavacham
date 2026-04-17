export interface RiskInput {
  zoneId: string;
  rainfall: number; // in mm
  aqi: number;
  heatIndex: number; // typically 0-10
  floodRiskScore: number; // 0-1
  trafficDensity: number; // 0-1
  orderDropRate: number; // percentage 0-100
  monthOfYear?: number;
  dayOfWeek?: number;
  cityTier?: number;
}

export interface RiskOutput {
  riskScore: number; // 0.0 to 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export function calculateRisk(input: RiskInput): RiskOutput {
  // Simulated ML XGBoost-inspired weighted scoring model
  
  // Normalize inputs roughly to a [0, 1] scale where applicable
  const nRainfall = Math.min(input.rainfall / 100, 1); // Cap at 100mm = 1
  const nAqi = Math.min(input.aqi / 500, 1); // Cap at 500 = 1
  const nHeat = Math.min(input.heatIndex / 10, 1);
  const nFlood = Math.min(input.floodRiskScore, 1);
  const nTraffic = Math.min(input.trafficDensity, 1);
  const nOrderDrop = Math.min(input.orderDropRate / 100, 1);

  // Apply weights
  // risk_score = (rainfall * 0.25) + (AQI * 0.15) + (heat * 0.10) + (flood_risk * 0.20) + (order_drop * 0.20) + (traffic * 0.10)
  
  let riskScore = 
    (nRainfall * 0.25) +
    (nAqi * 0.15) +
    (nHeat * 0.10) +
    (nFlood * 0.20) +
    (nOrderDrop * 0.20) +
    (nTraffic * 0.10);

  // Normalize final score to absolute [0, 1] range to be safe
  riskScore = Math.max(0, Math.min(riskScore, 1));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let explanation = '';

  if (riskScore > 0.7) {
    riskLevel = 'HIGH';
    
    // Generate explanation based on top contributors
    if (nRainfall > 0.7 && nAqi > 0.7) {
      explanation = "High rainfall and AQI levels are severely increasing disruption risk in your zone.";
    } else if (nOrderDrop > 0.7) {
      explanation = "Massive spikes in order drop rates point to active ground-level disruptions in your zone.";
    } else if (nFlood > 0.6) {
      explanation = "Elevated flood risks and ground conditions correlate strongly with expected delivery delays.";
    } else {
      explanation = "Multiple telemetric factors indicate a high probability of platform disruptions today.";
    }
  } else if (riskScore > 0.4) {
    riskLevel = 'MEDIUM';
    
    if (nAqi > 0.6) {
      explanation = "Poor air quality is mildly elevating zone risk.";
    } else if (nRainfall > 0.4) {
      explanation = "Moderate rainfall is leading to minor delivery delays and increased risk.";
    } else {
      explanation = "Zone conditions are deteriorating slightly below optimal baselines.";
    }
  } else {
    riskLevel = 'LOW';
    if (nAqi < 0.2 && nRainfall === 0) {
      explanation = "Clear skies and exceptional air quality indicate zero expected disruptions.";
    } else {
      explanation = "Zone conditions are stable. Local algorithms predict nominal operations today.";
    }
  }

  return {
    riskScore,
    riskLevel,
    explanation
  };
}
