const TOPICS = [
  {
    id: 't1',
    num: 'Topic 1',
    title: 'Topic title here',
    mpep: 'MPEP ref here',
    questions: [
      {
        mpep: 'MPEP § XXXX',
        scenario: 'Scenario text',
        stem: 'Question stem',
        choices: ['A', 'B', 'C', 'D', 'E'],
        correct: 2,
        explanation: 'Explanation'
      }
    ]
  },

  // ... all other topics ...

  {
    id: 't12',
    num: 'Topic 12',
    title: 'Patent Prosecution Highway (PPH)',
    mpep: 'MPEP § 708.02(a); PPH Notices',
    questions: [
      // ... your topic 12 questions ...
    ]
  }
];

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let scores = {};
let currentTopic = null;
let currentQ = 0;
let selectedChoice = null;
let answered = false;
let sessionAnswers = [];

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
function init() {
  const saved = localStorage.getItem('pbre_scores');
  if (saved) {
    try {
      scores = JSON.parse(saved);
    } catch (e) {}
  }
  buildSidebar();
  buildHub();
}

function saveScores() {
  try {
    localStorage.setItem('pbre_scores', JSON.stringify(scores));
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════
function buildSidebar() {
  const el = document.getElementById('sidebar-links');
  el.innerHTML = TOPICS.map(t => {
    const s = scores[t.id];
    const pill = s
      ? `<span class="score-pill ${s.score / s.total >= 0.7 ? 'passed' : 'failed'}">${s.score}/${s.total}</span>`
      : `<span class="score-pill">Not started</span>`;
    const active = currentTopic && currentTopic.id === t.id ? 'active' : '';
    return `<div class="sidebar-topic ${active}" onclick="startTopic('${t.id}')">${t.num} — ${t.title}${pill}</div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// HUB
// ═══════════════════════════════════════════════════════
function buildHub() {
  const grid = document.getElementById('hub-grid');
  grid.innerHTML = TOPICS.map(t => {
    const s = scores[t.id];
    let scoreHtml = `<div class="tc-score untried">Not attempted</div>`;
    if (s) {
      const pct = Math.round((s.score / s.total) * 100);
      const cls = pct >= 70 ? 'pass' : 'fail';
      scoreHtml = `<div class="tc-score ${cls}">${s.score}/${s.total} (${pct}%)</div>`;
    }
    return `
      <div class="topic-card${s ? ' done' : ''}">
        <div class="tc-num">${t.num}</div>
        <div class="tc-title">${t.title}</div>
        <div class="tc-mpep">${t.mpep}</div>
        ${scoreHtml}
        <button class="tc-btn" onclick="startTopic('${t.id}')">${s ? 'Retake Quiz' : 'Start Quiz'}</button>
      </div>`;
  }).join('');

  const attempted = Object.keys(scores).length;
  document.getElementById('stat-attempted').textContent = attempted;

  if (attempted > 0) {
    const best = Object.values(scores).reduce((b, s) => {
      const pct = Math.round((s.score / s.total) * 100);
      return pct > b ? pct : b;
    }, 0);
    document.getElementById('stat-best').textContent = best + '%';
  } else {
    document.getElementById('stat-best').textContent = '—';
  }
}

// ═══════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════
function startTopic(topicId) {
  currentTopic = TOPICS.find(t => t.id === topicId);
  currentQ = 0;
  selectedChoice = null;
  answered = false;
  sessionAnswers = [];

  show('screen-quiz');
  document.getElementById('quiz-meta-label').textContent = currentTopic.num + ' — MCQ Quiz';
  document.getElementById('quiz-title-label').textContent = currentTopic.title;

  renderQuestion();
  buildSidebar();
}

function renderQuestion() {
  const q = currentTopic.questions[currentQ];

  document.getElementById('q-num-label').textContent = `Question ${currentQ + 1} of ${currentTopic.questions.length}`;
  document.getElementById('q-mpep-ref').textContent = q.mpep;
  document.getElementById('q-stem').textContent = q.stem;

  const scenarioEl = document.getElementById('q-scenario');
  if (q.scenario) {
    scenarioEl.style.display = 'block';
    scenarioEl.textContent = q.scenario;
  } else {
    scenarioEl.style.display = 'none';
    scenarioEl.textContent = '';
  }

  const choicesEl = document.getElementById('q-choices');
  choicesEl.innerHTML = q.choices.map((choice, i) => `
    <div class="choice" onclick="selectChoice(${i})">
      <span class="choice-letter">${String.fromCharCode(65 + i)}.</span>
      <span class="choice-text">${choice}</span>
    </div>
  `).join('');

  const pct = ((currentQ + 1) / currentTopic.questions.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${currentQ + 1} / ${currentTopic.questions.length}`;

  document.getElementById('btn-submit').disabled = true;
  document.getElementById('btn-submit').style.display = 'inline-block';
  document.getElementById('btn-next').style.display = 'none';
  document.getElementById('btn-finish').style.display = 'none';

  const expEl = document.getElementById('q-explanation');
  expEl.className = 'explanation';
  expEl.innerHTML = '';

  selectedChoice = null;
  answered = false;
}

function selectChoice(idx) {
  if (answered) return;
  selectedChoice = idx;
  document.querySelectorAll('.choice').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  document.getElementById('btn-submit').disabled = false;
}

function submitAnswer() {
  if (selectedChoice === null || answered) return;
  answered = true;

  const q = currentTopic.questions[currentQ];
  const isCorrect = selectedChoice === q.correct;
  const letters = ['A', 'B', 'C', 'D', 'E'];

  document.querySelectorAll('.choice').forEach((el, i) => {
    el.classList.add('locked');
    el.onclick = null;
    if (i === q.correct) el.classList.add('show-correct');
    else if (i === selectedChoice && !isCorrect) el.classList.add('incorrect');
  });

  const expEl = document.getElementById('q-explanation');
  expEl.className = 'explanation show ' + (isCorrect ? 'correct-exp' : 'incorrect-exp');
  expEl.innerHTML = `
    <div class="exp-verdict">${isCorrect ? '✓ Correct.' : `✗ Incorrect. The correct answer is ${letters[q.correct]}.`}</div>
    ${q.explanation}
    <div class="exp-mpep">Reference: ${q.mpep}</div>`;

  sessionAnswers.push({ selected: selectedChoice, correct: q.correct, isCorrect });

  document.getElementById('btn-submit').style.display = 'none';
  const isLast = currentQ === currentTopic.questions.length - 1;
  if (isLast) {
    document.getElementById('btn-finish').style.display = 'inline-block';
  } else {
    document.getElementById('btn-next').style.display = 'inline-block';
  }
}

function nextQuestion() {
  currentQ++;
  selectedChoice = null;
  answered = false;
  renderQuestion();
}

function showResults() {
  const total = currentTopic.questions.length;
  const score = sessionAnswers.filter(a => a.isCorrect).length;
  const pct = Math.round((score / total) * 100);

  scores[currentTopic.id] = { score, total, answers: sessionAnswers };
  saveScores();

  show('screen-results');
  document.getElementById('res-meta-label').textContent = currentTopic.num + ' — Results';
  document.getElementById('res-title-label').textContent = currentTopic.title;
  document.getElementById('res-score').textContent = pct + '%';
  document.getElementById('res-fraction').textContent = `${score} correct out of ${total} questions`;

  const verdictEl = document.getElementById('res-verdict');
  if (pct >= 88) {
    verdictEl.className = 'results-verdict pass';
    verdictEl.textContent = 'Excellent — ready to advance to the next topic.';
  } else if (pct >= 70) {
    verdictEl.className = 'results-verdict pass';
    verdictEl.textContent = 'Passing — consider reviewing the questions you missed before moving on.';
  } else {
    verdictEl.className = 'results-verdict fail';
    verdictEl.textContent = 'Below threshold — review the topic material and retake before proceeding.';
  }

  document.getElementById('res-mpep').textContent = 'Target: 7/8 (88%) per topic | Exam pass mark: 70/90 (78%)';

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const reviewEl = document.getElementById('review-list');
  reviewEl.innerHTML = currentTopic.questions.map((q, i) => {
    const a = sessionAnswers[i];
    const cls = a.isCorrect ? 'correct' : 'incorrect';
    const badge = a.isCorrect ? 'Correct' : `Incorrect — ${letters[q.correct]} was correct`;
    const userAns = a.isCorrect ? '' : ` (you answered ${letters[a.selected]})`;
    return `
      <div class="review-item">
        <div class="ri-top">
          <div class="ri-q">Q${i + 1}. ${q.stem.substring(0, 90)}${q.stem.length > 90 ? '…' : ''}</div>
          <span class="ri-badge ${cls}">${badge}</span>
        </div>
        <div class="ri-detail">${userAns ? userAns + ' · ' : ''}<span class="mpep-ref">${q.mpep}</span></div>
      </div>`;
  }).join('');

  buildSidebar();
  buildHub();
}

function retryTopic() {
  startTopic(currentTopic.id);
}

function goHub() {
  currentTopic = null;
  show('screen-hub');
  buildHub();
  buildSidebar();
}

function show(id) {
  ['screen-hub', 'screen-quiz', 'screen-results'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
  window.scrollTo(0, 0);
}

window.addEventListener('DOMContentLoaded', init);

function selectChoice(idx) {
  if (answered) return;
  selectedChoice = idx;
  document.querySelectorAll('.choice').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  document.getElementById('btn-submit').disabled = false;
}

function submitAnswer() {
  if (selectedChoice === null || answered) return;
  answered = true;

  const q = currentTopic.questions[currentQ];
  const isCorrect = selectedChoice === q.correct;
  const letters = ['A','B','C','D','E'];

  document.querySelectorAll('.choice').forEach((el, i) => {
    el.classList.add('locked');
    el.onclick = null;
    if (i === q.correct) el.classList.add('show-correct');
    else if (i === selectedChoice && !isCorrect) el.classList.add('incorrect');
  });

  const expEl = document.getElementById('q-explanation');
  expEl.className = 'explanation show ' + (isCorrect ? 'correct-exp' : 'incorrect-exp');
  expEl.innerHTML = `
    <div class="exp-verdict">${isCorrect ? '✓ Correct.' : `✗ Incorrect. The correct answer is ${letters[q.correct]}.`}</div>
    ${q.explanation}
    <div class="exp-mpep">Reference: ${q.mpep}</div>`;

  sessionAnswers.push({ selected: selectedChoice, correct: q.correct, isCorrect });

  document.getElementById('btn-submit').style.display = 'none';
  const isLast = currentQ === currentTopic.questions.length - 1;
  if (isLast) {
    document.getElementById('btn-finish').style.display = 'inline-block';
  } else {
    document.getElementById('btn-next').style.display = 'inline-block';
  }
}

function nextQuestion() {
  currentQ++;
  selectedChoice = null;
  answered = false;
  renderQuestion();
}

function showResults() {
  const total = currentTopic.questions.length;
  const score = sessionAnswers.filter(a => a.isCorrect).length;
  const pct = Math.round(score / total * 100);

  scores[currentTopic.id] = { score, total, answers: sessionAnswers };
  saveScores();

  show('screen-results');
  document.getElementById('res-meta-label').textContent = currentTopic.num + ' — Results';
  document.getElementById('res-title-label').textContent = currentTopic.title;
  document.getElementById('res-score').textContent = pct + '%';
  document.getElementById('res-fraction').textContent = `${score} correct out of ${total} questions`;

  const verdictEl = document.getElementById('res-verdict');
  if (pct >= 88) {
    verdictEl.className = 'results-verdict pass';
    verdictEl.textContent = 'Excellent — ready to advance to the next topic.';
  } else if (pct >= 70) {
    verdictEl.className = 'results-verdict pass';
    verdictEl.textContent = 'Passing — consider reviewing the questions you missed before moving on.';
  } else {
    verdictEl.className = 'results-verdict fail';
    verdictEl.textContent = 'Below threshold — review the topic material and retake before proceeding.';
  }
  document.getElementById('res-mpep').textContent = 'Target: 7/8 (88%) per topic | Exam pass mark: 70/90 (78%)';

  // review
  const letters = ['A','B','C','D','E'];
  const reviewEl = document.getElementById('review-list');
  reviewEl.innerHTML = currentTopic.questions.map((q, i) => {
    const a = sessionAnswers[i];
    const cls = a.isCorrect ? 'correct' : 'incorrect';
    const badge = a.isCorrect ? 'Correct' : `Incorrect — ${letters[q.correct]} was correct`;
    const userAns = a.isCorrect ? '' : ` (you answered ${letters[a.selected]})`;
    return `
      <div class="review-item">
        <div class="ri-top">
          <div class="ri-q">Q${i+1}. ${q.stem.substring(0, 90)}${q.stem.length > 90 ? '…' : ''}</div>
          <span class="ri-badge ${cls}">${badge}</span>
        </div>
        <div class="ri-detail">${userAns ? userAns + ' · ' : ''}<span class="mpep-ref">${q.mpep}</span></div>
      </div>`;
  }).join('');

  buildSidebar();
  buildHub();
}

function retryTopic() { startTopic(currentTopic.id); }
function goHub() {
  currentTopic = null;
  show('screen-hub');
  buildHub();
  buildSidebar();
}

function show(id) {
  ['screen-hub','screen-quiz','screen-results'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
  window.scrollTo(0,0);
}

window.addEventListener('DOMContentLoaded', init);
