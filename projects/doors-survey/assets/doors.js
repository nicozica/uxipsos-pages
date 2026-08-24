/* Doors Survey — shared vanilla JS helpers.
   Loaded after partials.js on every screen. Nothing here assumes which
   cell it runs in; each screen's own inline <script> wires these helpers
   to its own element references and stays self-contained so the standalone
   page (opened via the Navigator's "Open" button) keeps working on its own. */

/* ---------- Generic internal state machine ----------
   Toggles visibility of the `[data-state]` elements inside `root`. Returns
   a `showState(name)` function used for every transition in a cell
   (e.g. welcome -> play -> prize, or landing -> choice -> result-*). */
function initStates(root, initialState) {
  const sections = [...root.querySelectorAll('[data-state]')];
  function showState(name) {
    sections.forEach(section => {
      const isActive = section.dataset.state === name;
      section.hidden = !isActive;
      section.classList.toggle('is-active', isActive);
    });
  }
  showState(initialState);
  return showState;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------- Cell 02 — Spinning Wheel ----------
   Gates the "Spin now!" CTA on the Game Rules checkbox, then drives the
   single allowed spin. The prize is always 50 points (Version 1
   requirement) — this never selects a segment at random, and the wheel
   always completes exactly 5 full turns so it lands back on the 50
   segment, which is centered under the fixed pointer at rest. */
function initWheel({ consentCheckbox, spinNowButton, rulesError, wheelHub, wheelDisc, showState, resultAnnounce }) {
  function syncConsent() {
    const agreed = consentCheckbox.checked;
    spinNowButton.disabled = !agreed;
    if (agreed) rulesError.hidden = true;
  }
  consentCheckbox.addEventListener('change', syncConsent);
  syncConsent();

  // Belt-and-braces: a disabled button already blocks activation, but if
  // it's ever reachable while unchecked, explain why instead of doing nothing.
  spinNowButton.addEventListener('click', () => {
    if (!consentCheckbox.checked) {
      rulesError.hidden = false;
      return;
    }
    showState('play');
  });

  let spun = false;
  const SETTLE_PAUSE_MS = 2000; // let the stopped wheel sit on screen before the prize reveal

  function revealPrize() {
    showState('prize');
    if (resultAnnounce) resultAnnounce.textContent = 'You won 50 points!';
  }

  wheelHub.addEventListener('click', () => {
    if (spun) return; // only one spin per page load, no persistence needed
    spun = true;
    wheelHub.disabled = true;

    if (prefersReducedMotion()) {
      revealPrize();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      wheelHub.classList.remove('is-ticking');
      setTimeout(revealPrize, SETTLE_PAUSE_MS);
    };
    wheelDisc.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 3600); // fallback so navigation can't get stuck
    wheelDisc.classList.add('is-spinning');
    wheelHub.classList.add('is-ticking'); // pointer rocks side to side while it spins
  });
}

/* ---------- Cell 04 — Poll Predictor ----------
   Reads the slider's own live value when "Place prediction" is pressed and
   carries it through to the result screen, instead of hard-coding it (the
   astra reference hard-codes both figures on a disconnected results page —
   see the audit notes). The correct answer is fixed at 16% per the supplied
   design. */
function initPollPredictor({ slider, tooltip, valueLabel, placeButton, showState, calculatingMs, correctAnswer, resultMineEl, resultCorrectEl, resultAnnounce }) {
  let touched = false;

  function renderValue() {
    // The supplied design shows the live percentage as a large number
    // centered above the slider track (not tracking the thumb's x position),
    // so this only needs to update the text, matching screens/Poll
    // Predictor-4.png.
    valueLabel.textContent = slider.value + '%';
  }

  slider.addEventListener('input', () => {
    renderValue();
    if (!touched) {
      touched = true;
      tooltip.hidden = true;
      valueLabel.hidden = false;
      placeButton.disabled = false;
    }
  });

  placeButton.addEventListener('click', () => {
    if (placeButton.disabled) return;
    const mine = slider.value;
    showState('calculating');
    setTimeout(() => {
      resultMineEl.textContent = mine + '%';
      resultCorrectEl.textContent = correctAnswer + '%';
      showState('result');
      if (resultAnnounce) {
        resultAnnounce.textContent = `Your prediction was ${mine}%. The correct answer was ${correctAnswer}%.`;
      }
    }, calculatingMs);
  });
}

/* ---------- Cell 05 — Censydiam ----------
   Choice data lives in one place (the `mapping` array passed in from
   screens/05-censydiam.html) and is rendered into the DOM here, so the
   temporary placeholder image paths are written exactly once instead of
   being repeated throughout the markup. `mapping` entries look like:
   { value, label, image, resultState }. */
function initCensydiam({ mapping, choiceGrid, nextButton, showState }) {
  mapping.forEach(choice => {
    const label = document.createElement('label');
    label.className = 'choice-label';
    // Markup mirrors astra/src/pages/p1/censydiam-without-rec/quiz_flow_01.astro:
    // .choice-input and .choice-content must stay direct siblings (the CSS
    // checked-state rule is `.choice-input:checked + .choice-content`), and
    // .radio-indicator lives inside .choice-content, after the image.
    label.innerHTML = `
      <input type="radio" name="censydiamChoice" value="${choice.value}" class="choice-input">
      <div class="choice-content">
        <img src="${choice.image}" alt="${choice.label}">
        <div class="radio-indicator" aria-hidden="true"></div>
      </div>
    `;
    choiceGrid.appendChild(label);
  });

  const inputs = [...choiceGrid.querySelectorAll('input[name="censydiamChoice"]')];
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      nextButton.disabled = !inputs.some(i => i.checked);
    });
  });

  nextButton.addEventListener('click', () => {
    if (nextButton.disabled) return;
    const picked = inputs.find(i => i.checked);
    if (!picked) return;
    const choice = mapping.find(c => c.value === picked.value);
    if (choice) showState(choice.resultState);
  });
}
