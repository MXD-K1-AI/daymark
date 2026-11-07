let idSequence = 0;

export function createEmptyState(date = new Date().toISOString().slice(0, 10)) {
  return { date, blocks: [] };
}

export function addBlock(state, input) {
  const title = String(input?.title ?? '').trim();
  const minutes = Number(input?.minutes);

  if (!title) {
    throw new Error('A block title is required.');
  }

  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 240) {
    throw new Error('Minutes must be a whole number between 5 and 240.');
  }

  const block = {
    id: `block-${Date.now().toString(36)}-${idSequence++}`,
    title,
    minutes,
    tag: String(input?.tag ?? '').trim(),
    completed: false,
  };

  return { ...state, blocks: [...state.blocks, block] };
}

export function completeBlock(state, id) {
  return {
    ...state,
    blocks: state.blocks.map((block) =>
      block.id === id ? { ...block, completed: true } : block,
    ),
  };
}

export function deleteBlock(state, id) {
  return {
    ...state,
    blocks: state.blocks.filter((block) => block.id !== id),
  };
}

export function loadState(serialized, fallbackDate = new Date().toISOString().slice(0, 10)) {
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.blocks)) {
      return createEmptyState(fallbackDate);
    }

    const blocks = parsed.blocks.filter((block) => (
      block
      && typeof block.id === 'string'
      && typeof block.title === 'string'
      && Number.isInteger(block.minutes)
      && block.minutes >= 5
      && block.minutes <= 240
    )).map((block) => ({
      id: block.id,
      title: block.title.trim(),
      minutes: block.minutes,
      tag: typeof block.tag === 'string' ? block.tag.trim() : '',
      completed: Boolean(block.completed),
    })).filter((block) => block.title);

    return {
      date: typeof parsed.date === 'string' ? parsed.date : fallbackDate,
      blocks,
    };
  } catch {
    return createEmptyState(fallbackDate);
  }
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function summarizeDay(state) {
  const totalBlocks = state.blocks.length;
  const completedBlocks = state.blocks.filter((block) => block.completed).length;
  const plannedMinutes = state.blocks.reduce((sum, block) => sum + block.minutes, 0);
  const completedMinutes = state.blocks
    .filter((block) => block.completed)
    .reduce((sum, block) => sum + block.minutes, 0);

  return {
    totalBlocks,
    completedBlocks,
    plannedMinutes,
    completedMinutes,
    remainingMinutes: plannedMinutes - completedMinutes,
    completionPercent: totalBlocks
      ? Math.round((completedBlocks / totalBlocks) * 100)
      : 0,
  };
}
