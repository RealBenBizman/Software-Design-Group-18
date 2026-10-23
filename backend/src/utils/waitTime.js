// the person at position 1 is served next, so they wait 0 minutes
export function estimateWait(position, expectedDuration) {
  return Math.max(position - 1, 0) * expectedDuration;
}
