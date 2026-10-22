// lower rank is served first; unknown priorities are treated as normal
const PRIORITY_RANK = { high: 0, normal: 1 };

function getRank(entry) {
  return PRIORITY_RANK[entry.priority] ?? PRIORITY_RANK.normal;
}

// high priority first, then arrival order (sort is stable, so ties keep their order)
export function sortByPriority(queue) {
  return [...queue].sort((a, b) => getRank(a) - getRank(b));
}

// a new arrival goes after everyone with the same or higher priority
export function insertByPriority(queue, entry) {
  const index = queue.findIndex((item) => getRank(item) > getRank(entry));

  if (index === -1) {
    queue.push(entry);
  } else {
    queue.splice(index, 0, entry);
  }

  return queue;
}
