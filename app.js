/**
 * app.js — Інтерфейс та зв'язок з машиною
 */

// ── Стан ─────────────────────────────────────────────────
const machine = new PostMachine();
let program   = [];          // копія команд у UI
let runTimer  = null;
const TAPE_VISIBLE = 21;     // кількість видимих клітинок
let tapeOffset = 0;          // перша видима клітинка

// ── DOM ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const cmdList      = $('cmdList');
const logBox       = $('logBox');
const tapeTrack    = $('tapeTrack');
const modalOverlay = $('modalOverlay');

// ── Ініціалізація ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderTape();
  renderProgram();
  updateState();

  $('runBtn').addEventListener('click', runAll);
  $('stepBtn').addEventListener('click', stepOnce);
  $('stopBtn').addEventListener('click', stopRun);
  $('resetBtn').addEventListener('click', resetMachine);
  $('clearTapeBtn').addEventListener('click', clearTape);
  $('clearProgramBtn').addEventListener('click', clearProgram);
  $('addCmdBtn').addEventListener('click', openModal);
  $('loadTaskBtn').addEventListener('click', loadTask);
  $('tapeLeft').addEventListener('click', () => { tapeOffset = Math.max(tapeOffset - 5, -50); renderTape(); });
  $('tapeRight').addEventListener('click', () => { tapeOffset += 5; renderTape(); });

  // Modal
  $('modalClose').addEventListener('click', closeModal);
  $('modalCancel').addEventListener('click', closeModal);
  $('modalSave').addEventListener('click', saveCommand);
  $('cmdType').addEventListener('change', () => {
    const t = $('cmdType').value;
    $('jumpTarget').style.display = ['jump_if_mark','jump_if_empty','jump'].includes(t) ? 'flex' : 'none';
    $('jumpTarget').style.flexDirection = 'column';
  });

  log('Машину Поста ініціалізовано. Оберіть задачу або введіть програму вручну.', 'info');
});

// ── СТРІЧКА ───────────────────────────────────────────────
function renderTape() {
  tapeTrack.innerHTML = '';
  const headInView = machine.head - tapeOffset;

  // якщо каретка виходить за межі — підлаштуємо
  if (machine.head < tapeOffset + 2) tapeOffset = machine.head - 2;
  if (machine.head > tapeOffset + TAPE_VISIBLE - 3) tapeOffset = machine.head - TAPE_VISIBLE + 3;

  for (let i = 0; i < TAPE_VISIBLE; i++) {
    const idx  = tapeOffset + i;
    const cell = document.createElement('div');
    cell.className = 'cell' +
      (machine.tape[idx] ? ' marked' : '') +
      (idx === machine.head ? ' head' : '');

    const sym = document.createElement('div');
    sym.className = 'cell-sym';
    sym.textContent = machine.tape[idx] ? 'V' : '□';

    const lbl = document.createElement('div');
    lbl.className = 'cell-idx';
    lbl.textContent = idx;

    cell.appendChild(sym);
    cell.appendChild(lbl);

    // клік — переключити мітку
    cell.addEventListener('click', () => {
      machine.tape[idx] = !machine.tape[idx];
      renderTape();
      updateState();
    });

    tapeTrack.appendChild(cell);
  }

  $('headPosDisplay').textContent = machine.head;
}

function clearTape() {
  machine.clearTape();
  tapeOffset = 0;
  renderTape();
  updateState();
  log('Стрічку очищено.', 'warn');
}

// ── ПРОГРАМА ──────────────────────────────────────────────
function renderProgram() {
  if (program.length === 0) {
    cmdList.innerHTML = `<div class="empty-hint"><div class="big">📋</div>Програма порожня.<br>Натисніть «+ Команда» або оберіть задачу.</div>`;
    return;
  }
  cmdList.innerHTML = '';
  program.forEach((cmd, idx) => {
    const row = document.createElement('div');
    row.className = 'cmd-row' +
      (machine.pc === idx && !machine.halted ? ' active' : '') +
      (machine.steps > 0 && machine.pc > idx ? ' executed' : '');
    row.dataset.idx = idx;

    const badge = document.createElement('span');
    badge.className = 'cmd-badge ' + badgeClass(cmd.type);
    badge.textContent = cmdShort(cmd.type);

    const lbl = document.createElement('span');
    lbl.className = 'cmd-label';
    lbl.textContent = cmd.label + ':';

    const text = document.createElement('span');
    text.className = 'cmd-text';
    text.textContent = cmdDesc(cmd);

    const del = document.createElement('button');
    del.className = 'cmd-delete';
    del.textContent = '✕';
    del.title = 'Видалити';
    del.addEventListener('click', e => { e.stopPropagation(); program.splice(idx, 1); syncProgram(); renderProgram(); });

    row.appendChild(badge);
    row.appendChild(lbl);
    row.appendChild(text);
    row.appendChild(del);
    cmdList.appendChild(row);
  });
}

function syncProgram() {
  machine.setProgram([...program]);
}

function clearProgram() {
  if (!confirm('Очистити всі команди?')) return;
  program = [];
  machine.setProgram([]);
  machine.reset();
  renderProgram();
  updateState();
  log('Програму очищено.', 'warn');
}

// ── ВИКОНАННЯ ─────────────────────────────────────────────
function stepOnce() {
  if (machine.halted) { log('Машина вже зупинена. Скиньте стан.', 'warn'); return; }
  if (program.length === 0) { log('Програма порожня!', 'err'); return; }

  const result = machine.step();
  renderTape();
  renderProgram();
  updateState();

  if (result.info) log(result.info, result.done ? (result.reason === 'stop' ? 'stop' : 'err') : 'ok');
  if (result.done) {
    log('═══ ' + (result.reason === 'stop' ? 'ПРОГРАМА ЗАВЕРШЕНА' : 'ПОМИЛКА: ' + result.reason) + ' ═══', result.reason === 'stop' ? 'stop' : 'err');
    stopRun();
  }
}

function runAll() {
  if (machine.halted) { log('Скиньте стан перед запуском.', 'warn'); return; }
  if (program.length === 0) { log('Програма порожня!', 'err'); return; }
  machine.running = true;
  log('▶ Запуск програми...', 'info');
  runTimer = setInterval(() => {
    if (machine.halted) { stopRun(); return; }
    const result = machine.step();
    renderTape();
    renderProgram();
    updateState();
    if (result.info) log(result.info, result.done ? 'stop' : 'ok');
    if (result.done) { stopRun(); log('═══ ЗУПИНКА ═══', 'stop'); }
  }, 400);
}

function stopRun() {
  clearInterval(runTimer);
  runTimer = null;
  machine.running = false;
}

function resetMachine() {
  stopRun();
  machine.reset();
  renderTape();
  renderProgram();
  updateState();
  log('↺ Стан скинуто (стрічка збережена).', 'warn');
}

// ── ЗАДАЧІ ────────────────────────────────────────────────
function loadTask() {
  const key = $('taskSelect').value;
  if (!key) { log('Оберіть задачу зі списку.', 'warn'); return; }
  const t = TASKS[key];
  if (!t) return;

  stopRun();
  // стрічка
  machine.tape = {};
  Object.entries(t.tape).forEach(([k,v]) => { machine.tape[+k] = v; });
  machine.head = t.head ?? 0;
  tapeOffset   = 0;

  // програма
  program = t.program.map(c => ({...c}));
  machine.setProgram([...program]);

  renderTape();
  renderProgram();
  updateState();
  log(`✔ Завантажено задачу: «${t.name}»`, 'ok');
}

// ── СТАН ─────────────────────────────────────────────────
function updateState() {
  const s = machine.getState();
  $('stateDisplay').textContent  = s.halted ? 'СТОП' : (s.label || '—');
  $('headDisplay').textContent   = s.head;
  $('symbolDisplay').textContent = s.symbol;
  $('stepsDisplay').textContent  = s.steps;
}

// ── ЛОГ ──────────────────────────────────────────────────
function log(msg, type = 'info') {
  const d = document.createElement('div');
  d.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString('uk-UA', { hour12: false });
  d.textContent = `[${time}] ${msg}`;
  logBox.appendChild(d);
  logBox.scrollTop = logBox.scrollHeight;
}

// ── МОДАЛЬ ────────────────────────────────────────────────
function openModal() {
  $('cmdLabel').value  = 'q' + (program.length + 1);
  $('cmdType').value   = 'mark';
  $('cmdTarget').value = '';
  $('jumpTarget').style.display = 'none';
  modalOverlay.classList.add('open');
  setTimeout(() => $('cmdLabel').focus(), 50);
}

function closeModal() { modalOverlay.classList.remove('open'); }

function saveCommand() {
  const label  = $('cmdLabel').value.trim();
  const type   = $('cmdType').value;
  const target = $('cmdTarget').value.trim();

  if (!label) { alert('Введіть мітку!'); return; }
  if (['jump_if_mark','jump_if_empty','jump'].includes(type) && !target) {
    alert('Введіть мітку переходу!'); return;
  }

  program.push({ label, type, target: target || undefined });
  syncProgram();
  renderProgram();
  closeModal();
  log(`+ Додано команду [${label}]: ${cmdDesc({ type, target })}`, 'ok');
}

// ── ДОПОМІЖНІ ─────────────────────────────────────────────
function cmdShort(type) {
  return { mark:'V', erase:'□', right:'→', left:'←',
           jump_if_mark:'?V', jump_if_empty:'?□', jump:'J', stop:'⏹' }[type] ?? '?';
}
function badgeClass(type) {
  return { mark:'badge-mark', erase:'badge-erase',
           right:'badge-right', left:'badge-left',
           jump_if_mark:'badge-jump', jump_if_empty:'badge-jump',
           jump:'badge-jump', stop:'badge-stop' }[type] ?? '';
}
function cmdDesc(cmd) {
  const map = {
    mark:          'Поставити мітку (V)',
    erase:         'Стерти мітку (□)',
    right:         'Крок вправо →',
    left:          'Крок вліво ←',
    jump_if_mark:  `Якщо V → перейти до ${cmd.target}`,
    jump_if_empty: `Якщо □ → перейти до ${cmd.target}`,
    jump:          `Перейти до ${cmd.target}`,
    stop:          'ЗУПИНКА',
  };
  return map[cmd.type] ?? cmd.type;
}