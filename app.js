import {
  addBlock,
  completeBlock,
  createEmptyState,
  deleteBlock,
  formatDuration,
  loadState,
  summarizeDay,
} from './src/daymark.js';

const STORAGE_KEY = 'daymark-state-v1';
const today = new Date().toISOString().slice(0, 10);

const elements = {
  dateLabel: document.querySelector('#date-label'),
  progressRing: document.querySelector('#progress-ring'),
  progressPercent: document.querySelector('#progress-percent'),
  progressStatus: document.querySelector('#progress-status'),
  progressDetail: document.querySelector('#progress-detail'),
  plannedTime: document.querySelector('#planned-time'),
  finishedTime: document.querySelector('#finished-time'),
  remainingTime: document.querySelector('#remaining-time'),
  blockList: document.querySelector('#block-list'),
  emptyState: document.querySelector('#empty-state'),
  clearCompleted: document.querySelector('#clear-completed'),
  form: document.querySelector('#block-form'),
  title: document.querySelector('#block-title'),
  minutes: document.querySelector('#block-minutes'),
  tag: document.querySelector('#block-tag'),
  formMessage: document.querySelector('#form-message'),
  toast: document.querySelector('#toast'),
};

const savedState = loadState(window.localStorage.getItem(STORAGE_KEY), today);
let state = savedState.date === today ? savedState : createEmptyState(today);

function save() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  window.setTimeout(() => elements.toast.classList.remove('show'), 2200);
}

function render() {
  const summary = summarizeDay(state);
  const date = new Date(`${state.date}T12:00:00`);
  elements.dateLabel.textContent = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  elements.progressRing.style.setProperty('--progress', `${summary.completionPercent}%`);
  elements.progressPercent.textContent = `${summary.completionPercent}%`;
  elements.plannedTime.textContent = formatDuration(summary.plannedMinutes);
  elements.finishedTime.textContent = formatDuration(summary.completedMinutes);
  elements.remainingTime.textContent = formatDuration(summary.remainingMinutes);

  if (!summary.totalBlocks) {
    elements.progressStatus.textContent = 'A blank page';
    elements.progressDetail.textContent = 'Add your first block';
  } else if (summary.completionPercent === 100) {
    elements.progressStatus.textContent = 'Day well spent';
    elements.progressDetail.textContent = 'Every block is complete';
  } else {
    elements.progressStatus.textContent = `${summary.completedBlocks} of ${summary.totalBlocks} complete`;
    elements.progressDetail.textContent = `${formatDuration(summary.remainingMinutes)} left to do`;
  }

  elements.blockList.replaceChildren(...state.blocks.map(renderBlock));
  elements.emptyState.hidden = Boolean(state.blocks.length);
  elements.clearCompleted.hidden = !state.blocks.some((block) => block.completed);
}

function renderBlock(block) {
  const card = document.createElement('article');
  card.className = `block-card${block.completed ? ' completed' : ''}`;
  card.dataset.id = block.id;

  const check = document.createElement('button');
  check.className = 'check-button';
  check.type = 'button';
  check.setAttribute('aria-label', block.completed ? `Mark ${block.title} as incomplete` : `Complete ${block.title}`);
  check.innerHTML = block.completed ? '✓' : '';
  check.addEventListener('click', () => {
    if (block.completed) return;
    state = completeBlock(state, block.id);
    save();
    render();
    showToast('Nice work — one block down.');
  });

  const main = document.createElement('div');
  main.className = 'block-main';
  const title = document.createElement('span');
  title.className = 'block-title';
  title.textContent = block.title;
  const meta = document.createElement('div');
  meta.className = 'block-meta';
  if (block.tag) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = block.tag;
    meta.append(tag);
  }
  const marker = document.createElement('span');
  marker.textContent = block.completed ? 'Completed' : 'Ready when you are';
  meta.append(marker);
  main.append(title, meta);

  const actions = document.createElement('div');
  actions.className = 'block-actions';
  const duration = document.createElement('span');
  duration.className = 'block-duration';
  duration.textContent = formatDuration(block.minutes);
  const remove = document.createElement('button');
  remove.className = 'delete-button';
  remove.type = 'button';
  remove.setAttribute('aria-label', `Delete ${block.title}`);
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    state = deleteBlock(state, block.id);
    save();
    render();
    showToast('Block removed.');
  });
  actions.append(duration, remove);
  card.append(check, main, actions);
  return card;
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  elements.formMessage.textContent = '';
  try {
    state = addBlock(state, {
      title: elements.title.value,
      minutes: elements.minutes.value,
      tag: elements.tag.value,
    });
    save();
    render();
    elements.form.reset();
    elements.minutes.value = '25';
    elements.title.focus();
    showToast('Block added to your day.');
  } catch (error) {
    elements.formMessage.textContent = error.message;
  }
});

elements.clearCompleted.addEventListener('click', () => {
  state.blocks.filter((block) => block.completed).forEach((block) => {
    state = deleteBlock(state, block.id);
  });
  save();
  render();
  showToast('Finished blocks cleared.');
});

if (!state.date) state = createEmptyState(today);
render();
