export const GRID_SIZES = {
  SMALL: { rows: 5, cols: 5 },
  MEDIUM: { rows: 7, cols: 7 },
  LARGE: { rows: 9, cols: 9 }
};

export const EXTRA_PATHS = {
  easy: 5,
  medium: 15,
  hard: 30
};

export const OPERATORS = {
  easy: ['+', '-'],
  medium: ['+', '-', '×', '^'], // exponentiation added
  hard: ['+', '-', '×', '^', '√'] // roots added
};

export const COLORS = {
  background: 'rgba(10, 10, 20, 0.85)',
  neonBlue: '#00f5ff',
  neonPink: '#ff00ff',
  neonGreen: '#00ff7f',
  text: '#e0e0e0'
};
