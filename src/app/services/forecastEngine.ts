export interface ForecastInput {
  zoneId: string;
  currentRainfall: number;
  currentAqi: number;
  currentHeatIndex: number;
}

export interface ForecastOutput {
  predictedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  insight: string;
}

export function generateForecast(input: ForecastInput): ForecastOutput {
  // Simulate forward-looking ML models using current trajectories
  
  let predictedRainfall = input.currentRainfall;
  let predictedAqi = input.currentAqi;
  let heatwaveProbability = input.currentHeatIndex > 7 ? 0.8 : 0.2;

  // Simple heuristic predictions
  let predictedRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let insight = '';

  if (input.currentRainfall > 20) {
    predictedRainfall *= 1.5; // Expected to worsen
    predictedRisk = 'HIGH';
    insight = "High rainfall expected in next 24 hours — zero-touch disruption probability significantly increased.";
  } else if (input.currentAqi > 250) {
    predictedAqi *= 1.2;
    predictedRisk = 'HIGH';
    insight = "Hazardous AQI trend detected. Expecting severe platform delays in the next 12 hours.";
  } else if (heatwaveProbability > 0.7) {
    predictedRisk = 'MEDIUM';
    insight = "Sustained heatwave probability detected. Moderate disruption risks projected.";
  } else {
    predictedRisk = 'LOW';
    insight = "No major weather or telemetry anomalies predicted for this active zone over the next 48 hours.";
  }

  return {
    predictedRisk,
    insight
  };
}
