// Elements
const cardGrid = document.getElementById('card-grid');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const restartButton = document.getElementById('restart');
const environmentColors = {
    fruits: { front: '#FF6F61', back: '#FFEBEE' },         // Red and light pink
    birds: { front: '#42A5F5', back: '#E3F2FD' },          // Blue and light blue
    cars: { front: '#FFB300', back: '#FFF8E1' },           // Yellow and light yellow
    clothes: { front: '#8E24AA', back: '#F3E5F5' },        // Purple and light purple
    electronics: { front: '#1E88E5', back: '#E1F5FE' },    // Dark blue and light blue
    animals: { front: '#66BB6A', back: '#E8F5E9' },        // Green and light green
    nature: { front: '#388E3C', back: '#E8F5E9' }          // Dark green and light green
  };


// Game State
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer;
let startTime;

// Fetch shuffled deck from the backend
async function fetchDeck() {
  const urlParams = new URLSearchParams(window.location.search);
  const environment = urlParams.get('environment') || 'fruits'; // Default to fruits
  const response = await fetch('/start_game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ environment })
  });
  const data = await response.json();
  return data.deck_size ? new Array(data.deck_size).fill('❓') : [];
}

// Start the game
async function startGame() {
  cards = await fetchDeck();
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  startTime = Date.now();

  movesDisplay.textContent = 'Moves: 0';
  timerDisplay.textContent = 'Time: 00:00';
  cardGrid.innerHTML = '';

  // Create cards
  cards.forEach((card, index) => {
    const cardElement = createCardElement(index);
    cardGrid.appendChild(cardElement);
  });

  startTimer();
}

// Create a card element
function createCardElement(index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
  
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
  
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    cardFront.textContent = '❓'; // Placeholder
  
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
  
    // Get the current environment's colors
    const urlParams = new URLSearchParams(window.location.search);
    const environment = urlParams.get('environment') || 'fruits'; // Default to fruits
    const colors = environmentColors[environment];
  
    // Apply colors
    cardFront.style.backgroundColor = colors.front;
    cardFront.style.color = '#FFF'; // White text for better contrast
    cardBack.style.backgroundColor = colors.back;
    cardBack.style.border = `2px solid ${colors.front}`;
  
    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    card.appendChild(cardInner);
  
    card.addEventListener('click', () => handleCardFlip(card));
  
    return card;
  }
  

// Handle card flip
async function handleCardFlip(card) {
  const index = card.dataset.index;

  // Prevent flipping more than 2 cards or flipping a matched card
  if (flippedCards.length >= 2 || card.classList.contains('matched') || card.classList.contains('flip')) return;

  card.classList.add('flip');
  flippedCards.push(card);

  // Simulate backend response
  const response = await fetch('/flip_card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index: parseInt(index) })
  });

  const result = await response.json();

  // Update card backs with real values
  card.querySelector('.card-back').textContent = result.deck[index];

  // Check if two cards are flipped
  if (flippedCards.length === 2) {
    const [card1, card2] = flippedCards;
    const indices = flippedCards.map(c => c.dataset.index);

    if (result.matched.includes(parseInt(indices[0])) && result.matched.includes(parseInt(indices[1]))) {
      card1.classList.add('matched');
      card2.classList.add('matched');
      matchedPairs++;

      // Check if all pairs are matched
      if (matchedPairs === cards.length / 2) {
        stopTimer();
        showCompletionModal();
      }
    } else {
      setTimeout(() => {
        card1.classList.remove('flip');
        card2.classList.remove('flip');
      }, 1000);
    }

    flippedCards = [];
    moves++;
    movesDisplay.textContent = `Moves: ${moves}`;
  }
}

// Timer
function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timerDisplay.textContent = `Time: ${formatTime(elapsed)}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

// Show Completion Modal
function showCompletionModal() {
  const modal = document.getElementById('completion-modal');
  const finalMoves = document.getElementById('final-moves');
  const finalTime = document.getElementById('final-time');

  // Populate completion data
  finalMoves.textContent = moves;
  finalTime.textContent = formatTime(Date.now() - startTime);

  // Show the modal
  modal.classList.add('show');

  // Handle New Environment
  document.getElementById('new-environment').addEventListener('click', () => {
    window.location.href = '/environment';
  });

  // Handle Quit Game
  document.getElementById('quit-game').addEventListener('click', () => {
    window.location.href = '/';
  });
}

// Format time in mm:ss
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update moves display
function updateMoves(moves) {
  const movesElement = document.getElementById('moves');
  movesElement.textContent = `🕹️ Moves: ${moves}`;
  movesElement.classList.add('updated');
  setTimeout(() => movesElement.classList.remove('updated'), 500);
}

// Update time display
function updateTime(time) {
  const timeElement = document.getElementById('timer');
  timeElement.textContent = `⏱️ Time: ${time}`;
  timeElement.classList.add('updated');
  setTimeout(() => timeElement.classList.remove('updated'), 500);
}

// Restart game
restartButton.addEventListener('click', startGame);

// Start the game on load
startGame();
