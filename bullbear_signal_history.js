// BullBear Signal History
// Records each BullBear reading for future accuracy tracking.

const signalHistory = [];

function recordBullBearSignal({
  asset,
  score,
  signal,
  price,
  confidence
}) {
  const record = {
    timestamp: new Date().toISOString(),
    asset,
    score,
    signal,
    price,
    confidence
  };

  signalHistory.push(record);

  return record;
}

function getBullBearSignalHistory() {
  return [...signalHistory];
}

module.exports = {
  recordBullBearSignal,
  getBullBearSignalHistory
};
