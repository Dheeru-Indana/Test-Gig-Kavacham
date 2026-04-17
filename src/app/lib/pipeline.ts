export type PipelineStatus = 
  | 'IDLE'
  | 'TRIGGERED'
  | 'POLICY_CHECKED'
  | 'FRAUD_PENDING'
  | 'FRAUD_PASSED'
  | 'FRAUD_FAILED'
  | 'PAYOUT_INITIATED'
  | 'PAYOUT_SUCCESS'
  | 'PAYOUT_FAILED'
  | 'RETRY_SCHEDULED'
  | 'MANUAL_REVIEW';

export function calculateDCS(rainfall: number, aqi: number, orderDrop: number): number {
  const rainScore = Math.min(100, (rainfall / 100) * 100);
  const aqiScore = Math.min(100, (aqi / 500) * 100);
  const dropScore = Math.min(100, orderDrop);
  const finalScore = (rainScore * 0.4) + (aqiScore * 0.3) + (dropScore * 0.3);
  return Math.round(finalScore);
}

export function calculateFraudScore(signals: { gpsConsistency: number, platformActivity: number, duplicateClaims: boolean }): number {
  let score = 0;
  // lower is better
  score += (100 - signals.gpsConsistency) * 0.4; // if 90% consistent -> +4
  score += (100 - signals.platformActivity) * 0.3; // if 80% active -> +6
  if (signals.duplicateClaims) score += 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function processPayout(upiId: string, amount: number): Promise<{ success: boolean; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    setTimeout(() => {
      // Simulate 5% failure rate for mock
      const success = Math.random() > 0.05 && Boolean(upiId);
      resolve({ success, duration: (Date.now() - startTime) / 1000 });
    }, 1500);
  });
}

export function simulatePipeline(
  setDisruptionState: (update: (prev: any) => any) => void,
  shouldFailFraud: boolean = false,
  shouldFailPayout: boolean = false
) {
  const delays = [1500, 1500, 2000, 1500];
  
  // Step 1: Triggered
  setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'TRIGGERED' }));

  // Step 2: Policy Checked
  setTimeout(() => {
    setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'POLICY_CHECKED' }));

    // Step 3: Fraud Verification
    setTimeout(() => {
      setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'FRAUD_PENDING' }));
      
      const fraudScore = calculateFraudScore({
        gpsConsistency: shouldFailFraud ? 40 : 95,
        platformActivity: 85,
        duplicateClaims: false
      });

      setTimeout(() => {
        if (fraudScore > 60) {
          setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'FRAUD_FAILED' }));
          setTimeout(() => setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'MANUAL_REVIEW' })), 1000);
          return;
        } else if (fraudScore >= 30) {
          setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'MANUAL_REVIEW' }));
          return;
        }

        setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'FRAUD_PASSED' }));

        // Step 4: Payout
        setTimeout(async () => {
          setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'PAYOUT_INITIATED' }));
          
          if (shouldFailPayout) {
            setTimeout(() => {
              setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'PAYOUT_FAILED' }));
              setTimeout(() => setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'RETRY_SCHEDULED' })), 1000);
            }, delays[3]);
            return;
          }

          const payoutResult = await processPayout('user@upi', 600);
          if (payoutResult.success) {
             setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'PAYOUT_SUCCESS' }));
          } else {
             setDisruptionState((prev: any) => ({ ...prev, pipelineStatus: 'PAYOUT_FAILED' }));
          }

        }, 500);

      }, delays[2]);

    }, delays[1]);

  }, delays[0]);
}
