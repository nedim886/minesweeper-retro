let gridSize, mineCount;
let grid = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let timerInterval;
let seconds = 0;
let currentDifficulty = "";

document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  if (music) music.volume = 0.3;
});

document.addEventListener("click", () => {
  const music = document.getElementById("bg-music");
  if (music && music.paused) {
    music.play().catch(() => {});
  }
}, { once: true });

function showDifficulty() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "block";
}

function showHighscores() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "block";
  renderHighscores();
}

function showSettings() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "block";
}

function backToMain() {
  clearInterval(timerInterval);
  document.getElementById("game-container").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("highscore-menu").style.display = "none";
  document.getElementById("settings-menu").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
}

function exitApp() {
  alert("App will now close.");
  window.close();
}

function startGame(difficulty) {
  currentDifficulty = difficulty;
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  startTimer();

  if (difficulty === "easy") {
    gridSize = 8;
    mineCount = 10;
  } else if (difficulty === "medium") {
    gridSize = 12;
    mineCount = 20;
  } else {
    gridSize = 16;
    mineCount = 40;
  }

  document.getElementById("bomb-count").textContent = `Bombs: ${mineCount}`;
  generateGrid();
}

function startTimer() {
  seconds = 0;
  document.getElementById("timer").textContent = "Time: 0s";
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Time: ${seconds}s`;
  }, 1000);
}

function generateGrid() {
  const gridElement = document.getElementById("grid");
  gridElement.innerHTML = "";
  gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

  grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
  revealed = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
  flagged = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
  gameOver = false;

  let placed = 0;
  while (placed < mineCount) {
    let x = Math.floor(Math.random() * gridSize);
    let y = Math.floor(Math.random() * gridSize);
    if (grid[y][x] !== "💣") {
      grid[y][x] = "💣";
      placed++;
    }
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x] === "💣") continue;
      let count
