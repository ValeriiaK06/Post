

const machine    = new PostMachine();
let   runTimer   = null;
const TAPE_VIS   = 51;
let   tapeOffset = 0;

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  renderTape();
  renderCmdList();
  updateState();

  $('runBtn'         ).addEventListener('click', runAll);
  $('stepBtn'        ).addEventListener('click', stepOnce);
  $('stopBtn'        ).addEventListener('click', stopRun);
  $('resetBtn'       ).addEventListener('click', resetMachine);
  $('clearTapeBtn'   ).addEventListener('click', clearTape);
  $('clearProgramBtn').addEventListener('click', clearProgram);
  $('loadTaskBtn'    ).addEventListener('click', loadTask);
  $('tapeLeft'       ).addEventListener('click', () => { tapeOffset -= 5; renderTape(); });
  $('tapeRight'      ).addEventListener('click', () => { tapeOffset += 5; renderTape(); });
  $('headMoveLeft').addEventListener('click', () => {
  machine.head--;
  renderTape();
  updateState();
});
$('headMoveRight').addEventListener('click', () => {
  machine.head++;
  renderTape();
  updateState();
});
  $('codeEditor'     ).addEventListener('input',  onEditorInput);

  log('Машину Поста ініціалізовано.', 'info');
  log('Формат: N команда, де команди: > < V X ! ?A;B', 'info');
});

// ── РЕДАКТОР ─────────────────────────────────────────────
function onEditorInput() {
  const text = $('codeEditor').value;
  const { cmds, errors } = parseProgram(text);
  const errBox = $('parseErrors');

  if (errors.length) {
    errBox.textContent = errors.join('\n');
    errBox.style.display = 'block';
  } else {
    errBox.style.display = 'none';
  }

  machine.setProgram(cmds);
  renderCmdList();
  updateState();
}


function renderCmdList() {
  const list = $('cmdList');
  const cmds = machine.program;

  if (!cmds || cmds.length === 0) {
    list.innerHTML = `<div class="empty-hint"><div class="big">📋</div>Програма порожня.<br>Введіть команди в редакторі або оберіть задачу.</div>`;
    return;
  }

  list.innerHTML = '';
  cmds.forEach(cmd => {
    const isActive = !machine.halted && machine.current === cmd.n;
    const row = document.createElement('div');
    row.className = 'cmd-row' + (isActive ? ' active' : '');

    const badge = document.createElement('span');
    badge.className = 'cmd-badge ' + badgeClass(cmd.type);
    badge.textContent = cmdShort(cmd.type);

    const num = document.createElement('span');
    num.className = 'cmd-label';
    num.textContent = cmd.n + ':';

    const text = document.createElement('span');
    text.className = 'cmd-text';
    text.textContent = cmdDesc(cmd);

    row.appendChild(badge);
    row.appendChild(num);
    row.appendChild(text);
    list.appendChild(row);
  });
}


function renderTape() {
  const track = $('tapeTrack');
  track.innerHTML = '';

  if (machine.head < tapeOffset + 2)            tapeOffset = machine.head - 2;
  if (machine.head > tapeOffset + TAPE_VIS - 3) tapeOffset = machine.head - TAPE_VIS + 3;

  for (let i = 0; i < TAPE_VIS; i++) {
    const idx  = tapeOffset + i;
    const marked = !!machine.tape[idx];
    const isHead = idx === machine.head;

    const cell = document.createElement('div');
    cell.className = 'cell' + (marked ? ' marked' : '') + (isHead ? ' head' : '');

    const sym = document.createElement('div');
    sym.className = 'cell-sym';
    sym.textContent = marked ? 'V' : '□';

    const lbl = document.createElement('div');
    lbl.className = 'cell-idx';
    lbl.textContent = idx;

    cell.appendChild(sym);
    cell.appendChild(lbl);
    cell.addEventListener('click', () => {
      if (machine.tape[idx]) delete machine.tape[idx];
      else machine.tape[idx] = true;
      renderTape();
      updateState();
    });

    track.appendChild(cell);
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


function stepOnce() {
  if (machine.halted) { log('Машина зупинена. Скиньте стан (↺).', 'warn'); return; }
  if (machine.program.length === 0) { log('Програма порожня!', 'err'); return; }

  const r = machine.step();
  renderTape();
  renderCmdList();
  updateState();

  if (r.info) log(r.info, r.done ? 'stop' : 'ok');
  if (r.done && r.reason !== 'stop') log('Помилка: ' + r.reason, 'err');
  if (r.done) log('═══ ЗАВЕРШЕНО ═══', 'stop');
}

function runAll() {
  if (machine.halted) { log('Скиньте стан перед запуском (↺).', 'warn'); return; }
  if (machine.program.length === 0) { log('Програма порожня!', 'err'); return; }
  machine.running = true;
  log('▶ Запуск...', 'info');
  runTimer = setInterval(() => {
    if (machine.halted) { stopRun(); return; }
    const r = machine.step();
    renderTape();
    renderCmdList();
    updateState();
    if (r.info) log(r.info, r.done ? 'stop' : 'ok');
    if (r.done) {
      stopRun();
      if (r.reason !== 'stop') log('Помилка: ' + r.reason, 'err');
      log('═══ ЗАВЕРШЕНО ═══', 'stop');
    }
  }, 350);
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
  renderCmdList();
  updateState();
  log('↺ Стан скинуто (стрічка збережена).', 'warn');
}


function loadTask() {
  const key = $('taskSelect').value;
  if (!key) { log('Оберіть задачу зі списку.', 'warn'); return; }
  const t = TASKS[key];
  if (!t) { log('Задачу не знайдено.', 'err'); return; }

  stopRun();

  
  machine.tape = {};
  Object.entries(t.tape).forEach(([k, v]) => { if (v) machine.tape[+k] = true; });
  machine.head = t.head ?? 0;
  tapeOffset   = 0;

  
  $('codeEditor').value = t.text;
  const { cmds, errors } = parseProgram(t.text);

  const errBox = $('parseErrors');
  if (errors.length) {
    errBox.textContent = errors.join('\n');
    errBox.style.display = 'block';
    log('Помилки парсингу задачі!', 'err');
  } else {
    errBox.style.display = 'none';
  }

  machine.setProgram(cmds);

  renderTape();
  renderCmdList();
  updateState();
  log(`✔ Завантажено: «${t.name}»`, 'ok');
}


function updateState() {
  const s = machine.getState();
  $('stateDisplay' ).textContent = s.halted ? 'СТОП' : ('№' + s.current);
  $('headDisplay'  ).textContent = s.head;
  $('symbolDisplay').textContent = s.symbol;
  $('stepsDisplay' ).textContent = s.steps;
}


function log(msg, type = 'info') {
  const d = document.createElement('div');
  d.className = `log-entry ${type}`;
  const t = new Date().toLocaleTimeString('uk-UA', { hour12: false });
  d.textContent = `[${t}] ${msg}`;
  $('logBox').appendChild(d);
  $('logBox').scrollTop = $('logBox').scrollHeight;
}

function clearProgram() {
  if (!confirm('Очистити програму?')) return;
  $('codeEditor').value = '';
  $('parseErrors').style.display = 'none';
  machine.setProgram([]);
  machine.reset();
  renderCmdList();
  updateState();
  log('Програму очищено.', 'warn');
}


function cmdShort(type) {
  return { mark:'V', erase:'X', right:'>', left:'<', branch:'?', stop:'!' }[type] ?? '?';
}
function badgeClass(type) {
  return {
    mark:'badge-mark', erase:'badge-erase',
    right:'badge-right', left:'badge-left',
    branch:'badge-jump', stop:'badge-stop'
  }[type] ?? '';
}
function cmdDesc(cmd) {
  const map = {
    mark  : 'V  — поставити мітку',
    erase : 'X  — стерти мітку',
    right : '>  — крок вправо',
    left  : '<  — крок вліво',
    stop  : '!  — зупинка',
    branch: `?${cmd.a};${cmd.b}  - порожньо→${cmd.a}, мітка→${cmd.b}`,
  };
  return map[cmd.type] ?? cmd.type;
}