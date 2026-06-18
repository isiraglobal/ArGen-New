const { scoreResponse } = require('./ai-agents');

/**
 * Scoring Agent Calibration Suite
 * Runs the scoring agent against 10 identical or controlled inputs to ensure consistency.
 * Spec: Variance must be <= 10 points.
 */
async function runCalibration() {
    const challenge = {
        scenario: "You are a marketing manager. Draft a 3-sentence email to a client about a 10% price increase starting next month. Be professional and clear.",
        task: "Write a professional 3-sentence email announcing a 10% price increase effective next month."
    };
    const responseText = "Subject: Important Update Regarding Our Pricing\n\nDear Valued Client,\n\nI am writing to inform you that we will be adjusting our pricing by 10% effective the 1st of next month. This change allows us to continue delivering the high-quality service and innovation you expect from us. We truly appreciate your continued partnership and are happy to answer any questions you may have.\n\nBest regards,\nMarketing Team";

    console.log('[Calibration] Starting scoring variance test (10 iterations)...');
    const scores = [];

    for (let i = 0; i < 10; i++) {
        console.log(`[Calibration] Iteration ${i + 1}/10...`);
        try {
            const result = await scoreResponse(challenge, responseText);
            scores.push(result.total_score);
        } catch (err) {
            console.error(`[Calibration] Iteration ${i+1} failed:`, err.message);
        }
    }

    if (scores.length < 10) {
        return { success: false, error: 'Calibration incomplete - some iterations failed.' };
    }

    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const variance = max - min;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
        success: variance <= 10,
        avgScore: avg.toFixed(1),
        variance: variance.toFixed(1),
        scores,
        recommendation: variance <= 10 ? 'Scoring Agent is STABLE.' : 'RE-CALIBRATION REQUIRED: Variance too high.'
    };
}

module.exports = { runCalibration };
