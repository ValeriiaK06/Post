const TASKS = {

  add1: {
    name: 'Додавання 1',
    tape: { 3:true, 4:true, 5:true },
    head: 0,
    text:
`1 >
2 ?1;3
3 <
4 V
5 !`
  },

 move_mark: {
    name: 'Перенесення мітки до групи',
    tape: { 1:true, 4:true, 5:true, 6:true },
    head: 0,
    text:
`1 >
2 ?1;3
3 X
4 >
5 ?4;6
6 <
7 v
8 !`
  },

  add2: {
    name: 'Додавання двох чисел',
    tape: { 2:true, 3:true, 5:true, 6:true, 7:true },
    head: 0,
    text:
`1 >
2 ?1;3
3 >
4 ?5;3
5 v
6 <
7 ?8;6
8 >
9 X
10 !`
  },

  sub1: {
    name: 'Віднімання 1 від числа',
    tape: { 4:true, 5:true, 6:true, 7:true, 8:true },
    head: 0,
    text:
`1 >
2 ?1;3
3 X
4 <
5 !`
  },

mul2: {
    name: 'Множення числа на 2',
    tape: { 1:true, 2:true, 3:true, 4:true },
    head: 0,
    text:
`1 >
2 ?1;3
3 <
4 >
5 ?18;6
6 X
7 >
8 ?9;7
9 >
10 ?11;9
11 V
12 >
13 V
14 <
15 ?16;14
16 <
17 ?4;16
18 !`
  },

  parity: {
    name: 'Перевірка на парність/непарність',
    tape: { 1:true, 2:true, 3:true, 4:true, 5:true},
    head: 0,
    text:
`1 >
2 ?1;3
3 X
4 >
5 ?9;6
6 X
7 >
8 ?11;3
9 V
10 !
11 V
12 >
13 V
14 !`
  },

  del_every2: {
    name: 'Видалення мітки через 1',
    tape: { 1:true, 2:true, 3:true, 4:true, 5:true, 6:true },
    head: 0,
    text:
`1 >
2 ?1;3
3 >
4 ?8;5
5 X
6 >
7 ?8;3
8 !`
  },

};

