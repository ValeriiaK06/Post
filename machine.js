

class PostMachine {
  constructor() {
    this.tape    = {};
    this.head    = 0;
    this.program = [];   // [{n, type, a?, b?}]
    this.current = 1;
    this.steps   = 0;
    this.halted  = false;
    this.running = false;
  }

  read()      { return !!this.tape[this.head]; }
  write(val)  { if (val) this.tape[this.head] = true; else delete this.tape[this.head]; }
  clearTape() { this.tape = {}; this.head = 0; }

  setProgram(cmds) {
    this.program = cmds;
    this.current = cmds.length > 0 ? cmds[0].n : 1;
    this.steps   = 0;
    this.halted  = false;
  }

  reset() {
    this.head    = 0;
    this.current = this.program.length > 0 ? this.program[0].n : 1;
    this.steps   = 0;
    this.halted  = false;
    this.running = false;
  }

  step() {
    if (this.halted)
      return { done: true, reason: 'halt', step: this.steps };

    const cmd = this.program.find(c => c.n === this.current);
    if (!cmd) {
      this.halted = true;
      return { done: true, reason: `Команду №${this.current} не знайдено`, step: this.steps };
    }

    let next = this._nextN(cmd.n);
    let info = '';

    switch (cmd.type) {
      case 'mark':
        this.write(true);
        info = `${cmd.n}: V — поставити мітку @ ${this.head}`;
        break;

      case 'erase':
        this.write(false);
        info = `${cmd.n}: X — стерти мітку @ ${this.head}`;
        break;

      case 'right':
        this.head++;
        info = `${cmd.n}: > — каретка → ${this.head}`;
        break;

      case 'left':
        this.head--;
        info = `${cmd.n}: < — каретка ← ${this.head}`;
        break;

      case 'branch': {
  const marked = this.read();
  const go = marked ? cmd.b : cmd.a;
  info = `${cmd.n}: ? — ${marked ? 'V мітка → команда ' + cmd.b : '□ порожньо → команда ' + cmd.a}`;
        const target = this.program.find(c => c.n === go);
        if (!target) {
          this.halted = true;
          return { done: true, reason: `Команду №${go} не знайдено`, step: this.steps };
        }
        next = go;
        break;
      }

      case 'stop':
        this.halted = true;
        this.steps++;
        info = `${cmd.n}: ! — ЗУПИНКА`;
        return { done: true, reason: 'stop', info, step: this.steps, cmdN: cmd.n };

      default:
        info = `${cmd.n}: невідомий тип «${cmd.type}»`;
    }

    this.current = next;
    this.steps++;
    return { done: false, info, step: this.steps, cmdN: cmd.n };
  }

  _nextN(n) {
    const idx = this.program.findIndex(c => c.n === n);
    if (idx === -1 || idx + 1 >= this.program.length) {
      this.halted = true;
      return n;
    }
    return this.program[idx + 1].n;
  }

  getState() {
    return {
      head    : this.head,
      symbol  : this.read() ? 'V' : '□',
      current : this.current,
      steps   : this.steps,
      halted  : this.halted,
    };
  }
}


function parseProgram(text) {
  const errors = [];
  const cmds   = [];

  text.split('\n').forEach((raw, li) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    const m = line.match(/^(\d+)\s+(.+)$/);
    if (!m) { errors.push(`Рядок ${li+1}: «${line}» — невірний формат (очікується: N команда)`); return; }

    const n    = parseInt(m[1]);
    const body = m[2].trim().toUpperCase();

    if (body === '>')  { cmds.push({ n, type: 'right'  }); return; }
    if (body === '<')  { cmds.push({ n, type: 'left'   }); return; }
    if (body === 'V')  { cmds.push({ n, type: 'mark'   }); return; }
    if (body === 'X')  { cmds.push({ n, type: 'erase'  }); return; }
    if (body === '!')  { cmds.push({ n, type: 'stop'   }); return; }

    const bm = body.match(/^\?(\d+);(\d+)$/);
    if (bm) {
      cmds.push({ n, type: 'branch', a: parseInt(bm[1]), b: parseInt(bm[2]) });
      return;
    }

    errors.push(`Рядок ${li+1}: «${line}» — невідома команда «${body}»`);
  });

  return { cmds, errors };
}