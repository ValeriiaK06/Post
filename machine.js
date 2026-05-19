/**
 * machine.js — Логіка Машини Поста
 * Команди: mark, erase, right, left, jump_if_mark, jump_if_empty, jump, stop
 */

class PostMachine {
  constructor() {
    this.tape = {};          // { index: boolean } — true = мітка
    this.head = 0;           // позиція каретки
    this.program = [];       // [{label, type, target?}]
    this.pc = 0;             // лічильник команд
    this.running = false;
    this.steps = 0;
    this.halted = false;
  }

  // ── Стрічка ──────────────────────────────────────────
  read()              { return !!this.tape[this.head]; }
  write(val)          { this.tape[this.head] = val; }
  moveRight()         { this.head++; }
  moveLeft()          { this.head--; }

  clearTape()         { this.tape = {}; this.head = 0; }

  // ── Програма ─────────────────────────────────────────
  setProgram(cmds)    { this.program = cmds; this.pc = 0; this.steps = 0; this.halted = false; }
  reset()             {
    this.head = 0; this.pc = 0; this.steps = 0;
    this.running = false; this.halted = false;
  }

  // ── Один крок ─────────────────────────────────────────
  step() {
    if (this.halted || this.program.length === 0) {
      return { done: true, reason: 'halt', step: this.steps };
    }
    if (this.pc >= this.program.length) {
      this.halted = true;
      return { done: true, reason: 'end_of_program', step: this.steps };
    }

    const cmd = this.program[this.pc];
    let next = this.pc + 1;
    let info = '';

    switch (cmd.type) {
      case 'mark':
        this.write(true);
        info = `[${cmd.label}] Поставити мітку на позиції ${this.head}`;
        break;

      case 'erase':
        this.write(false);
        info = `[${cmd.label}] Стерти мітку на позиції ${this.head}`;
        break;

      case 'right':
        this.moveRight();
        info = `[${cmd.label}] Каретка → ${this.head}`;
        break;

      case 'left':
        this.moveLeft();
        info = `[${cmd.label}] Каретка ← ${this.head}`;
        break;

      case 'jump_if_mark':
        if (this.read()) {
          const idx = this._findLabel(cmd.target);
          if (idx === -1) {
            this.halted = true;
            return { done: true, reason: `Мітка "${cmd.target}" не знайдена`, step: this.steps };
          }
          next = idx;
          info = `[${cmd.label}] Є мітка → перехід до ${cmd.target}`;
        } else {
          info = `[${cmd.label}] Немає мітки → продовжуємо`;
        }
        break;

      case 'jump_if_empty':
        if (!this.read()) {
          const idx = this._findLabel(cmd.target);
          if (idx === -1) {
            this.halted = true;
            return { done: true, reason: `Мітка "${cmd.target}" не знайдена`, step: this.steps };
          }
          next = idx;
          info = `[${cmd.label}] Порожньо → перехід до ${cmd.target}`;
        } else {
          info = `[${cmd.label}] Є мітка → продовжуємо`;
        }
        break;

      case 'jump': {
        const idx = this._findLabel(cmd.target);
        if (idx === -1) {
          this.halted = true;
          return { done: true, reason: `Мітка "${cmd.target}" не знайдена`, step: this.steps };
        }
        next = idx;
        info = `[${cmd.label}] Безумовний перехід до ${cmd.target}`;
        break;
      }

      case 'stop':
        this.halted = true;
        info = `[${cmd.label}] ЗУПИНКА`;
        this.steps++;
        return { done: true, reason: 'stop', info, step: this.steps, pc: this.pc };

      default:
        info = `[${cmd.label}] Невідома команда: ${cmd.type}`;
    }

    this.pc = next;
    this.steps++;
    return { done: false, info, step: this.steps, pc: this.pc - 1 };
  }

  _findLabel(lbl) {
    return this.program.findIndex(c => c.label === lbl);
  }

  getState() {
    return {
      head: this.head,
      symbol: this.read() ? 'V' : '□',
      pc: this.pc,
      label: this.program[this.pc]?.label ?? '—',
      steps: this.steps,
      halted: this.halted,
    };
  }
}