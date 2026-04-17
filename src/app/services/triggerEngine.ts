export interface TriggerInput {
  zoneId: string;
  rainfall: number;
  aqi: number;
  heatIndex: number;
  orderDropRate: number;
  riskScore: number;
}

export interface TriggerEvent {
  triggerType: 'RAINFALL' | 'AQI' | 'HEATWAVE' | 'ORDER_DROP' | 'ML_RISK';
  zone: string;
  DCS_score: number;
  timestamp: string;
}

export function evaluateTriggers(input: TriggerInput): TriggerEvent | null {
  // Threshold constants
  const THRESHOLD_RAINFALL = 50; // mm
  const THRESHOLD_AQI = 300;
  const THRESHOLD_HEAT = 9.5; // e.g out of 10
  const THRESHOLD_ORDER_DROP = 60; // 60%
  const THRESHOLD_RISK_SCORE = 0.70; // 70%

  // Function to calculate an approximate DCS (0-100) from the input factor
  const createEvent = (type: TriggerEvent['triggerType'], dcsBase: number) => {
    // If a trigger fires, DCS is generally strictly > 80.
    const finalDcs = Math.max(85, Math.min(100, dcsBase));
    return {
      triggerType: type,
      zone: input.zoneId,
      DCS_score: Math.floor(finalDcs),
      timestamp: new Date().toISOString()
    };
  };

  // Evaluate in order of criticality
  if (input.orderDropRate > THRESHOLD_ORDER_DROP) {
    return createEvent('ORDER_DROP', 85 + (input.orderDropRate - THRESHOLD_ORDER_DROP));
  }
  
  if (input.rainfall > THRESHOLD_RAINFALL) {
    return createEvent('RAINFALL', 85 + (input.rainfall - THRESHOLD_RAINFALL));
  }

  if (input.aqi > THRESHOLD_AQI) {
    return createEvent('AQI', 85 + ((input.aqi - THRESHOLD_AQI) / 10));
  }

  if (input.heatIndex > THRESHOLD_HEAT) {
    return createEvent('HEATWAVE', 85 + ((input.heatIndex - THRESHOLD_HEAT) * 10));
  }

  if (input.riskScore > THRESHOLD_RISK_SCORE) {
    return createEvent('ML_RISK', 85 + ((input.riskScore - THRESHOLD_RISK_SCORE) * 100));
  }

  // No triggers fell through
  return null;
}
