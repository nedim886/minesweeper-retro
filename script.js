import { Haptics } from '@capacitor/haptics';
import { App } from '@capacitor/app';

let grid = [];
let mineCount = 0;
let flagMode = false;
let gameOver = false;
let timerInterval;
let startTime;
let difficulty = 'easy';

function vibrate(duration = 100) {
  Haptics.vibrate({ duration });
}

function startGame(level) {
  difficulty = level;
  resetGame();
  generateGrid(level);
  startTimer();
}

function resetGame() {
  clearInterval(timerInterval);
  document.getElementById('grid').innerHTML = '';
  grid = [];
  mineCount = 0;
  gameOver = false;
  document.getElementById('timer').textContent = '00:00';
}

function generateGrid(level) {
  let size, mines;
  if (level === 'easy') {
    size = 8;
    mines = 10;
  } else if (level === 'medium') {
    size = 12;
    mines = 20;
  } else {
    size = 16;
    mines = 40;
  }

  mineCount = mines;
  const gridElement = document.getElementById('grid');
  gridElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    gridElement.appendChild(cell);
  }

  placeMines(size, mines);
  setupCellEvents(size);
}
function setupCellEvents(size) {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const index = parseInt(cell.dataset.index);
    const row = Math.floor(index / size);
    const col = index % size;

    // Normaler Klick
    cell.addEventListener('click', () => {
      if (gameOver) return;
      if (flagMode) {
        toggleFlag(cell);
      } else {
        revealCell(row, col);
      }
    });

    // Long-Press für Touchgeräte
    let pressTimer;
    cell.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        toggleFlag(cell);
      }, 600);
    });
    cell.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });
  });
}

function toggleFlag(cell) {
  if (cell.classList.contains('revealed')) return;
  cell.classList.toggle('flagged');
  vibrate(50);
}

function revealCell(row, col) {
  const cell = grid[row][col];
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  const cellElement = document.querySelector(`.cell[data-index="${row * grid.length + col}"]`);
  cellElement.classList.add('revealed');

  if (cell.mine) {
    cellElement.textContent = '💣';
    gameOver = true;
    vibrate(200);
    alert('Game Over!');
    return;
  }

  if (cell.adjacentMines > 0) {
    cellElement.textContent = cell.adjacentMines;
  } else {
    revealAdjacentCells(row, col);
  }
}

function toggleFlagMode() {
  flagMode = !flagMode;
  const button = document.getElementById('flagModeBtn');
  button.classList.toggle('active');
}

function exitGame() {
  App.exitApp();
}
