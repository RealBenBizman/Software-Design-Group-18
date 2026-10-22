// same formula as the backend: the person at position 1 waits 0 minutes
export function estimateWait(position, expectedDuration) {
  return Math.max(position - 1, 0) * expectedDuration;
}

// wait for a student who joins now, at the end of the queue
export function estimateWaitToJoin(queue, expectedDuration) {
  return estimateWait(queue.length + 1, expectedDuration);
}
