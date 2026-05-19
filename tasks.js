/**
 * tasks.js — Вбудовані задачі для Машини Поста
 */

const TASKS = {

  // Збільшити унарне число на 1 (додати 1 мітку до хвоста)
  inc: {
    name: 'Збільшити число на 1',
    tape: { 0:true, 1:true, 2:true },   // три мітки = число 3
    head: 0,
    program: [
      { label: 'q1', type: 'jump_if_empty', target: 'q3' },
      { label: 'q2', type: 'right' },
      { label: 'q2b', type: 'jump', target: 'q1' },
      { label: 'q3', type: 'mark' },
      { label: 'q4', type: 'stop' },
    ]
  },

  // Зменшити унарне число на 1 (стерти першу мітку)
  dec: {
    name: 'Зменшити число на 1',
    tape: { 0:true, 1:true, 2:true },
    head: 0,
    program: [
      { label: 'q1', type: 'jump_if_empty', target: 'q3' },
      { label: 'q2', type: 'erase' },
      { label: 'q2b', type: 'stop' },
      { label: 'q3', type: 'stop' },
    ]
  },

  // Стерти всі мітки на стрічці (з поточної позиції вправо)
  clear_all: {
    name: 'Стерти всі мітки',
    tape: { 0:true, 1:false, 2:true, 3:true, 4:false, 5:true },
    head: 0,
    program: [
      { label: 'q1', type: 'jump_if_empty', target: 'q3' },
      { label: 'q2', type: 'erase' },
      { label: 'q2b', type: 'jump', target: 'q1' },
      { label: 'q3', type: 'right' },
      // Зупинимось після 10 кроків вправо де пусто (простий варіант)
      { label: 'q4', type: 'stop' },
    ]
  },

  // Копіювання: зсунути каретку на 5 позицій вправо (символічне "копіювання позиції")
  copy: {
    name: 'Зсунути каретку на 5 вправо',
    tape: { 2: true, 3: true },
    head: 0,
    program: [
      { label: 'q1', type: 'right' },
      { label: 'q2', type: 'right' },
      { label: 'q3', type: 'right' },
      { label: 'q4', type: 'right' },
      { label: 'q5', type: 'right' },
      { label: 'q6', type: 'stop' },
    ]
  },

  // Інвертувати: якщо мітка — стерти, якщо порожньо — поставити (4 клітинки)
  invert: {
    name: 'Інвертувати 4 клітинки',
    tape: { 0:true, 1:false, 2:true, 3:false },
    head: 0,
    program: [
      // клітинка 1
      { label: 'q1',  type: 'jump_if_mark',  target: 'erase1' },
      { label: 'q1b', type: 'mark' },
      { label: 'q1c', type: 'jump',           target: 'next1'  },
      { label: 'erase1', type: 'erase' },
      { label: 'next1',  type: 'right' },
      // клітинка 2
      { label: 'q2',  type: 'jump_if_mark',  target: 'erase2' },
      { label: 'q2b', type: 'mark' },
      { label: 'q2c', type: 'jump',           target: 'next2'  },
      { label: 'erase2', type: 'erase' },
      { label: 'next2',  type: 'right' },
      // клітинка 3
      { label: 'q3',  type: 'jump_if_mark',  target: 'erase3' },
      { label: 'q3b', type: 'mark' },
      { label: 'q3c', type: 'jump',           target: 'next3'  },
      { label: 'erase3', type: 'erase' },
      { label: 'next3',  type: 'right' },
      // клітинка 4
      { label: 'q4',  type: 'jump_if_mark',  target: 'erase4' },
      { label: 'q4b', type: 'mark' },
      { label: 'q4c', type: 'jump',           target: 'done'   },
      { label: 'erase4', type: 'erase' },
      { label: 'done',   type: 'stop' },
    ]
  },

  // Зсунути каретку вправо поки є мітки, зупинитись на першій порожній
  move_right: {
    name: 'Знайти перший порожній рядок (→)',
    tape: { 0:true, 1:true, 2:true, 3:false, 4:true },
    head: 0,
    program: [
      { label: 'q1', type: 'jump_if_empty', target: 'done' },
      { label: 'q2', type: 'right' },
      { label: 'q3', type: 'jump', target: 'q1' },
      { label: 'done', type: 'stop' },
    ]
  },

};