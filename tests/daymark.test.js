import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addBlock,
  completeBlock,
  createEmptyState,
  deleteBlock,
  formatDuration,
  loadState,
  summarizeDay,
} from '../src/daymark.js';

test('adds a valid focus block with a stable id and normalized fields', () => {
  const state = createEmptyState('2026-11-07');

  const next = addBlock(state, {
    title: 'Read project brief',
    minutes: '25',
    tag: 'learning',
  });

  assert.equal(next.blocks.length, 1);
  assert.equal(next.blocks[0].title, 'Read project brief');
  assert.equal(next.blocks[0].minutes, 25);
  assert.equal(next.blocks[0].tag, 'learning');
  assert.equal(next.blocks[0].completed, false);
  assert.match(next.blocks[0].id, /^block-/);
});

test('rejects missing titles and durations outside the supported range', () => {
  const state = createEmptyState('2026-11-07');

  assert.throws(() => addBlock(state, { title: ' ', minutes: 25 }), /title/i);
  assert.throws(() => addBlock(state, { title: 'Too short', minutes: 4 }), /minutes/i);
  assert.throws(() => addBlock(state, { title: 'Too long', minutes: 241 }), /minutes/i);
});

test('completes one block without changing the rest of the plan', () => {
  const initial = addBlock(
    addBlock(createEmptyState('2026-11-07'), { title: 'First', minutes: 25 }),
    { title: 'Second', minutes: 50 },
  );
  const targetId = initial.blocks[0].id;

  const next = completeBlock(initial, targetId);

  assert.equal(next.blocks[0].completed, true);
  assert.equal(next.blocks[1].completed, false);
  assert.equal(next.blocks[1].title, 'Second');
});

test('summarizes planned, completed, and remaining minutes', () => {
  let state = createEmptyState('2026-11-07');
  state = addBlock(state, { title: 'One', minutes: 25 });
  state = addBlock(state, { title: 'Two', minutes: 50 });
  state = completeBlock(state, state.blocks[0].id);

  assert.deepEqual(summarizeDay(state), {
    totalBlocks: 2,
    completedBlocks: 1,
    plannedMinutes: 75,
    completedMinutes: 25,
    remainingMinutes: 50,
    completionPercent: 50,
  });
});

test('deletes only the requested block', () => {
  let state = createEmptyState('2026-11-07');
  state = addBlock(state, { title: 'Keep me', minutes: 25 });
  state = addBlock(state, { title: 'Remove me', minutes: 50 });

  const next = deleteBlock(state, state.blocks[1].id);

  assert.deepEqual(next.blocks.map((block) => block.title), ['Keep me']);
});

test('loads valid saved data and falls back safely for malformed data', () => {
  const saved = JSON.stringify({
    date: '2026-11-07',
    blocks: [{ id: 'block-1', title: 'Saved', minutes: 25, tag: '', completed: true }],
  });

  assert.equal(loadState(saved).blocks[0].title, 'Saved');
  assert.deepEqual(loadState('{broken').blocks, []);
  assert.deepEqual(loadState(JSON.stringify({ date: '2026-11-07', blocks: 'nope' })).blocks, []);
});

test('formats minutes into compact human-readable labels', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(25), '25m');
  assert.equal(formatDuration(90), '1h 30m');
  assert.equal(formatDuration(120), '2h');
});
