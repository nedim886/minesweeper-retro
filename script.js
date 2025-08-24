let timerInterval;
let seconds = 0;
let highscore = 0;

function showDifficulty() {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "block";
}

function backToMain() {
  clearInterval(timerInterval);
  document.getElementById("game-container").style.display = "none";
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
}

function exitApp() {
  alert("App wird beendet.");
  window.close(); // funktioniert nur in bestimmten Browsern
}

function startGame(difficulty) {
  document.getElementById("difficulty-menu").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  startTimer();
  generateGrid(difficulty);
}

function startTimer() {
  seconds = 0;
  document.getElementById("timer").textContent = "Zeit: 0s";
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Zeit: ${seconds}s`;
    if (seconds > highscore) {
      highscore = seconds;
      document.getElementById("highscore").textContent = `Highscore: ${highscore}`;
    }
  }, 1000);
}

function generateGrid(difficulty) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  let size = difficulty === "easy" ? 8 : difficulty === "medium" ? 12 : 16;
  grid.style.gridTemplateColumns = `repeat(${size}, 30px)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.onclick = () => cell.textContent = "💣"; // Platzhalter
    grid.appendChild(cell);
  }
}
