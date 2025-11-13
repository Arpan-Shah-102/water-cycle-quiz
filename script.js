let title = document.querySelector('h1');
let startBtn = document.querySelector('.start');
let quiz = document.querySelector('.quiz');
let questionDivs = document.querySelectorAll('.question');
let currentQuestionIndex = 0;
let shuffledQuestions = [];
let score = 0;

let sfx = {
  click: new Audio('assets/click.mp3'),
  right: new Audio('assets/right.mp3'),
  wrong: new Audio('assets/wrong.mp3'),
}

function playSound(audioSource) {
  if (!window.soundsMuted) {
    const sound = audioSource.cloneNode();
    sound.play();
  }
}

function shuffleArray(array) {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function resetQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  
  // Clear all question divs
  questionDivs.forEach(div => {
    div.style.display = 'none';
    // Remove any dynamically added buttons
    const nextBtn = div.querySelector('button');
    if (nextBtn) nextBtn.remove();
    
    // Reset terminal text
    const terminal = div.querySelector('.terminal');
    if (terminal) {
      terminal.textContent = '';
      terminal.className = 'terminal';
    }
    
    // Reset option styles
    const options = div.querySelectorAll('li');
    options.forEach(option => {
      option.style.opacity = '1';
      option.style.fontWeight = 'normal';
      option.style.pointerEvents = 'auto';
    });
  });
  
  // Reload questions from JSON
  loadQuestions();
}

function showNextQuestion() {
  if (currentQuestionIndex < shuffledQuestions.length && currentQuestionIndex < questionDivs.length) {
    questionDivs[currentQuestionIndex].style.display = 'flex';
  } else {
    // Quiz finished - show score
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    quiz.innerHTML = `
      <div style="text-align: center;">
        <h2>Quiz Complete!</h2>
        <p style="font-size: 32px; margin-top: 30px; font-weight: bold;">Your Score: ${score} / ${shuffledQuestions.length}</p>
        <p style="font-size: 48px; margin-top: 20px; color: ${percentage >= 70 ? '#00796b' : '#d32f2f'};">${percentage}%</p>
        <button id="tryAgainBtn" style="margin-top: 30px; padding: 15px 30px; font-size: 18px;">Play Again</button>
      </div>
    `;
    
    // Add event listener to try again button
    document.getElementById('tryAgainBtn').addEventListener('click', () => {
      playSound(sfx.click);
      location.reload();
    });
  }
}

function loadQuestions() {
  // Fetch and load questions
  fetch('./questions.json')
    .then(response => response.json())
    .then(questionsData => {
      // Convert object to array of questions
      let questions = Object.values(questionsData).map(q => ({
        question: q.question,
        options: Object.values(q.options),
        answer: q.options[q.answer]
      }));
      
      // Shuffle questions
      shuffledQuestions = shuffleArray(questions);

      // Fill in the questions
      questionDivs.forEach((questionDiv, index) => {
        if (index < shuffledQuestions.length) {
          const question = shuffledQuestions[index];
          
          // Set question title
          const titleElement = questionDiv.querySelector('h2');
          titleElement.textContent = question.question;
          
          // Shuffle options
          const shuffledOptions = shuffleArray(question.options);
          
          // Set options
          const optionElements = questionDiv.querySelectorAll('li');
          optionElements.forEach((li, optIndex) => {
            if (shuffledOptions[optIndex]) {
              li.textContent = shuffledOptions[optIndex];
              li.dataset.isCorrect = shuffledOptions[optIndex] === question.answer;
              li.dataset.optionIndex = optIndex; // Store option index for keyboard
              
              // Remove old event listeners by cloning
              const newLi = li.cloneNode(true);
              li.parentNode.replaceChild(newLi, li);
              
              // Add click handler to new element
              const clickHandler = () => {
                const terminal = questionDiv.querySelector('.terminal');
                const allOptions = questionDiv.querySelectorAll('li');
                
                // Highlight correct answer and dim wrong answers
                allOptions.forEach(option => {
                  if (option.dataset.isCorrect === 'true') {
                    option.style.opacity = '1';
                    option.style.fontWeight = 'bold';
                  } else {
                    option.style.opacity = '0.3';
                  }
                });
                
                if (newLi.dataset.isCorrect === 'true') {
                  terminal.textContent = 'Correct!';
                  terminal.className = 'terminal right';
                  score++;
                  playSound(sfx.right);
                } else {
                  terminal.textContent = `Wrong! Correct answer: ${question.answer}`;
                  terminal.className = 'terminal wrong';
                  playSound(sfx.wrong);
                }
                
                // Disable all options after selection
                allOptions.forEach(option => option.style.pointerEvents = 'none');
                
                // Add next button
                let nextBtn = document.createElement('button');
                nextBtn.textContent = 'Next';
                nextBtn.className = 'next-btn';
                nextBtn.addEventListener('click', () => {
                  playSound(sfx.click);
                  questionDiv.style.display = 'none';
                  currentQuestionIndex++;
                  showNextQuestion();
                });
                questionDiv.appendChild(nextBtn);
              };
              
              newLi.addEventListener('click', clickHandler, { once: true });
            }
          });
        }
      });
    })
    .catch(error => console.error('Error loading questions:', error));
}

// Keyboard event listener
document.addEventListener('keydown', (e) => {
  // Check if quiz is active
  const currentQuestion = questionDivs[currentQuestionIndex];
  if (!currentQuestion || currentQuestion.style.display === 'none') return;
  
  // Handle number keys 1-4 for answer selection
  if (e.key >= '1' && e.key <= '4') {
    const optionIndex = parseInt(e.key) - 1;
    const options = currentQuestion.querySelectorAll('li');
    if (options[optionIndex] && options[optionIndex].style.pointerEvents !== 'none') {
      options[optionIndex].click();
    }
  }
  
  // Handle Enter key for next button
  if (e.key === 'Enter') {
    const nextBtn = currentQuestion.querySelector('.next-btn');
    if (nextBtn) {
      nextBtn.click();
    }
  }
});

// Load questions on page load
loadQuestions();

startBtn.addEventListener('click', () => {
  playSound(sfx.click);
  startBtn.classList.add('hidden');
  title.classList.add('hidden');
  quiz.classList.remove('hidden');
  showNextQuestion();
});

let soundToggle = document.querySelector('.sound-toggle');
soundToggle.addEventListener('click', () => {
  playSound(sfx.click);
  window.soundsMuted = !window.soundsMuted;
  soundToggle.textContent = window.soundsMuted ? '🔇' : '🔊';
  playSound(sfx.click);
});