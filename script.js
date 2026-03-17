function showPage(pageId, link) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(function(page) {
    page.classList.remove('active');
  });
  // Show the selected page
  var page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  // Sidebar link highlighting
  if (link) {
    document.querySelectorAll('.sidebar a').forEach(function(a) {
      a.classList.remove('active');
    });
    link.classList.add('active');
  }
}

function checkQ(qid, selected, correct) {
  var choices = document.querySelectorAll('#' + qid + ' .exam-q-choice');
  choices.forEach(function(choice) {
    choice.classList.remove('correct', 'incorrect');
  });
  var feedback = document.getElementById(qid + '-fb');
  if (selected === correct) {
    choices.forEach(function(choice) {
      if (choice.textContent.trim().startsWith(selected + '.')) {
        choice.classList.add('correct');
      }
    });
    feedback.className = 'exam-feedback show correct-fb';
    feedback.textContent = 'Correct!';
  } else {
    choices.forEach(function(choice) {
      if (choice.textContent.trim().startsWith(selected + '.')) {
        choice.classList.add('incorrect');
      }
    });
    feedback.className = 'exam-feedback show incorrect-fb';
    feedback.textContent = 'Incorrect. Try again or review the material.';
  }
}

function checkTF(btn, correct, explanation) {
  var item = btn.closest('.tf-item');
  var btns = item.querySelectorAll('.tf-btn');
  btns.forEach(function(b) {
    b.classList.remove('selected-t', 'selected-f');
  });
  if (correct) {
    btn.classList.add('selected-t');
  } else {
    btn.classList.add('selected-f');
  }
  var exp = item.querySelector('.tf-explanation');
  exp.className = 'tf-explanation show';
  exp.textContent = explanation;
}
