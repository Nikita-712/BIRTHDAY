/**
 * photobook.js  –  3-D Photo-Book
 * Renamed from script.js for use alongside existing script.js in the repo.
 * Linked from photobook.html / photobook.css.
 */

// ─── DATA ────────────────────────────────────────────────────
const SPREADS = [
  { l: 'jaipur-l.png',   r: 'jaipur-r.png',   song: 'jaipur-song.mp3'   },
  { l: 'agra-l.png',     r: 'agra-r.png',      song: 'agra-song.mp3'     },
  { l: 'udaipur-l.png',  r: 'udaipur-r.png',   song: 'udaipur-song.mp3'  },
  { l: 'us-l.png',       r: 'us-r.png',        song: 'us-song.mp3'       },
  { l: 'him-l.png',      r: 'him-r.png',       song: 'him-song.mp3'      },
];

const COVER   = 'book-cover.png';
const FLIP_MS = 680;

// ─── DOM ─────────────────────────────────────────────────────
const book         = document.getElementById('book');
const leftSide     = document.getElementById('leftSide');
const rightSide    = document.getElementById('rightSide');
const coverImg     = document.getElementById('coverImg');
const leftImg      = document.getElementById('leftImg');
const rightImg     = document.getElementById('rightImg');
const flipPage     = document.getElementById('flipPage');
const flipFrontImg = document.getElementById('flipFrontImg');
const flipBackImg  = document.getElementById('flipBackImg');
const hint         = document.getElementById('hint');
const musicBadge   = document.getElementById('musicBadge');
const musicLabel   = document.getElementById('musicLabel');

// ─── STATE ───────────────────────────────────────────────────
let state       = 'closed';
let spreadIndex = -1;
let audio       = null;

// ─── FULLSCREEN ──────────────────────────────────────────────
function enterFullscreen() {
  const el  = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
  if (req) req.call(el).catch(() => {});
}

// ─── AUDIO ───────────────────────────────────────────────────
function playSpreadSong(index) {
  if (audio) {
    const old = audio; audio = null;
    musicBadge.classList.remove('visible');
    const fade = setInterval(() => {
      if (old.volume > 0.08) old.volume = Math.max(0, old.volume - 0.08);
      else { old.pause(); clearInterval(fade); }
    }, 50);
  }
  if (index < 0 || index >= SPREADS.length) return;

  const a = new Audio(SPREADS[index].song);
  a.loop = true; a.volume = 0;

  a.play().then(() => {
    audio = a;
    const name = SPREADS[index].song
      .replace(/-song\.mp3$/i, '').replace(/[-_]/g, ' ');
    musicLabel.textContent = '♪ ' + name;
    musicBadge.classList.add('visible');
    const fi = setInterval(() => {
      if (a.volume < 0.70) a.volume = Math.min(0.75, a.volume + 0.05);
      else clearInterval(fi);
    }, 60);
  }).catch(() => {});
}

function stopAudio() {
  if (!audio) return;
  const a = audio; audio = null;
  musicBadge.classList.remove('visible');
  const fade = setInterval(() => {
    if (a.volume > 0.07) a.volume = Math.max(0, a.volume - 0.07);
    else { a.pause(); clearInterval(fade); }
  }, 60);
}

// ─── SIZING ──────────────────────────────────────────────────
function calcPageSize() {
  const marginPx = 75;
  const maxH     = window.innerHeight - marginPx * 2;
  const ratio    = 0.75;

  let pageH = maxH;
  let pageW = Math.floor(pageH * ratio);

  if (pageW * 2 > window.innerWidth - 16) {
    pageW = Math.floor((window.innerWidth - 16) / 2);
    pageH = Math.floor(pageW / ratio);
  }
  return { pageW, pageH };
}

function applySize() {
  const { pageW, pageH } = calcPageSize();
  [leftSide, rightSide].forEach(el => {
    el.style.width  = pageW + 'px';
    el.style.height = pageH + 'px';
  });
  book.style.width      = pageW * 2 + 'px';
  book.style.height     = pageH + 'px';
  flipPage.style.width  = pageW + 'px';
  flipPage.style.height = pageH + 'px';
}

// ─── CLOSED STATE ────────────────────────────────────────────
function initClosed() {
  leftSide.style.opacity       = '0';
  leftSide.style.pointerEvents = 'none';
  leftSide.classList.remove('clickable');

  coverImg.style.display = 'block';
  rightImg.style.display = 'none';
  rightSide.classList.add('clickable');

  const { pageW } = calcPageSize();
  book.style.transition = '';
  book.style.transform  = `translateX(-${pageW / 2}px)`;

  state = 'closed'; spreadIndex = -1;
}

// ─── FLIP HELPER ─────────────────────────────────────────────
function runFlip(direction, frontSrc, backSrc, onSettle) {
  const { pageW } = calcPageSize();
  flipFrontImg.src = frontSrc;
  flipBackImg.src  = backSrc;

  if (direction === 'forward') {
    flipPage.style.left            = pageW + 'px';
    flipPage.style.transformOrigin = 'left center';
  } else {
    flipPage.style.left            = '0px';
    flipPage.style.transformOrigin = 'right center';
  }
  flipPage.style.transform  = 'rotateY(0deg)';
  flipPage.style.transition = '';
  flipPage.style.display    = 'block';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flipPage.style.transition = `transform ${FLIP_MS}ms cubic-bezier(.645,.045,.355,1)`;
      flipPage.style.transform  = direction === 'forward'
        ? 'rotateY(-180deg)' : 'rotateY(180deg)';
    });
  });

  setTimeout(() => {
    flipPage.style.display    = 'none';
    flipPage.style.transition = '';
    flipPage.style.transform  = '';
    onSettle();
  }, FLIP_MS + 30);
}

// ─── OPEN ────────────────────────────────────────────────────
function openBook() {
  if (state !== 'closed') return;
  state = 'flipping';
  enterFullscreen();
  hint.classList.add('hidden');

  book.style.transition = 'transform 0.42s cubic-bezier(.4,0,.2,1)';
  book.style.transform  = 'translateX(0)';

  setTimeout(() => {
    spreadIndex = 0;
    rightImg.src = SPREADS[0].r; rightImg.style.display = 'block';
    leftImg.src  = SPREADS[0].l;

    runFlip('forward', COVER, SPREADS[0].l, () => {
      coverImg.style.display       = 'none';
      leftSide.style.opacity       = '1';
      leftSide.style.pointerEvents = 'auto';
      leftSide.classList.add('clickable');
      state = 'open';
      playSpreadSong(0);
    });
  }, 450);
}

// ─── FORWARD ─────────────────────────────────────────────────
function flipForward() {
  if (state !== 'open' || spreadIndex >= SPREADS.length - 1) return;
  state = 'flipping';
  const next = spreadIndex + 1;
  rightImg.src = SPREADS[next].r;

  runFlip('forward', SPREADS[spreadIndex].r, SPREADS[next].l, () => {
    leftImg.src = SPREADS[next].l;
    spreadIndex = next;
    state = 'open';
    playSpreadSong(next);
  });
}

// ─── BACKWARD ────────────────────────────────────────────────
function flipBackward() {
  if (state !== 'open') return;
  if (spreadIndex <= 0) { closeBook(); return; }
  state = 'flipping';
  const prev = spreadIndex - 1;
  leftImg.src = SPREADS[prev].l;

  runFlip('backward', SPREADS[spreadIndex].l, SPREADS[prev].r, () => {
    rightImg.src = SPREADS[prev].r;
    spreadIndex  = prev;
    state = 'open';
    playSpreadSong(prev);
  });
}

// ─── CLOSE ───────────────────────────────────────────────────
function closeBook() {
  state = 'flipping';
  const { pageW } = calcPageSize();

  runFlip('backward', SPREADS[0].l, COVER, () => {
    leftSide.style.opacity       = '0';
    leftSide.style.pointerEvents = 'none';
    leftSide.classList.remove('clickable');
    coverImg.style.display = 'block';
    rightImg.style.display = 'none';

    book.style.transition = 'transform 0.42s cubic-bezier(.4,0,.2,1)';
    book.style.transform  = `translateX(-${pageW / 2}px)`;

    spreadIndex = -1; state = 'closed';
    stopAudio();
    hint.classList.remove('hidden');
    hint.textContent = 'click to open';
  });
}

// ─── CLICKS ──────────────────────────────────────────────────
rightSide.addEventListener('click', () => {
  if (state === 'closed') openBook();
  else if (state === 'open') flipForward();
});
leftSide.addEventListener('click', () => {
  if (state === 'open') flipBackward();
});

// ─── RESIZE ──────────────────────────────────────────────────
window.addEventListener('resize', () => {
  applySize();
  const { pageW } = calcPageSize();
  book.style.transition = '';
  book.style.transform  = state === 'closed'
    ? `translateX(-${pageW / 2}px)` : 'translateX(0)';
});

// ─── INIT ────────────────────────────────────────────────────
applySize();
initClosed();

// ─── SPARKLE MAGIC WAND EFFECT ───────────────────────────────
(function () {
  // Warm romantic palette matching the scrapbook aesthetic
  const COLOURS = [
    '#f9d6e3', // blush pink
    '#fce4a0', // warm gold
    '#f7b2c1', // rose
    '#fff0a0', // champagne yellow
    '#e8c4f0', // lavender
    '#ffd6b0', // peach
    '#ffffff',  // white
    '#f4c2d8', // dusty pink
  ];

  const SHAPES = ['star', 'dot', 'dot', 'star']; // weighted – more dots for trail feel

  let lastX = -999, lastY = -999;
  let frameId = null;
  let mouseX = 0, mouseY = 0;
  let active = false;

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  function spawnSparkle(x, y) {
    const el    = document.createElement('div');
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
    const size  = shape === 'star'
      ? randomBetween(8, 18)
      : randomBetween(3, 7);

    // Scatter a bit around cursor so it feels like a trail burst
    const ox = randomBetween(-14, 14);
    const oy = randomBetween(-14, 14);

    el.className  = `sparkle ${shape}`;
    el.style.cssText = `
      left: ${x + ox}px;
      top:  ${y + oy}px;
      width:  ${size}px;
      height: ${size}px;
      background: ${colour};
      box-shadow: 0 0 ${size * 1.2}px ${colour};
      animation-duration: ${randomBetween(450, 800)}ms;
    `;

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function onMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only emit when cursor actually moves enough
    if (dist < 6) return;

    lastX = mouseX;
    lastY = mouseY;
    active = true;

    // Emit 2–4 sparkles per move event depending on speed
    const count = dist > 25 ? 4 : dist > 12 ? 3 : 2;
    for (let i = 0; i < count; i++) spawnSparkle(mouseX, mouseY);
  }

  // Touch support (mobile)
  function onTouch(e) {
    const t = e.touches[0];
    onMove({ clientX: t.clientX, clientY: t.clientY });
  }

  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('touchmove', onTouch,  { passive: true });
})();

// ─── SPARKLE MAGIC WAND ──────────────────────────────────────
(function () {
  // Warm, romantic colour palette matching the scrapbook aesthetic
  const COLOURS = [
    '#f9d6e0', '#f7b2c1', '#fce4b0', '#f9c96e',
    '#fff0a0', '#e8c4f0', '#c4d4f7', '#ffffff',
    '#ffd6a5', '#ffb3c6',
  ];

  // SVG star path (4-point)
  const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
    <polygon points="10,1 12.5,8.5 20,8.5 14,13 16.5,20 10,15.5 3.5,20 6,13 0,8.5 7.5,8.5"
             fill="currentColor"/>
  </svg>`;

  let lastX = -999, lastY = -999;
  let frameId = null;
  let mouseX = 0, mouseY = 0;

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function spawnParticle(x, y) {
    const colour = COLOURS[Math.floor(Math.random() * COLOURS.length)];
    const isStar = Math.random() > 0.45;
    const size   = randomBetween(isStar ? 10 : 4, isStar ? 18 : 10);
    const dx     = randomBetween(-28, 28);
    const dy     = randomBetween(-32, 8);
    const dur    = randomBetween(500, 850);

    const el = document.createElement('div');
    el.classList.add('sparkle');

    if (isStar) {
      el.classList.add('star');
      el.style.width  = size + 'px';
      el.style.height = size + 'px';
      el.style.color  = colour;
      el.innerHTML    = STAR_SVG;
      // drop-shadow glow
      el.style.filter = `drop-shadow(0 0 3px ${colour})`;
    } else {
      el.style.width      = size + 'px';
      el.style.height     = size + 'px';
      el.style.background = colour;
      el.style.boxShadow  = `0 0 ${size}px ${colour}`;
    }

    el.style.left              = x + 'px';
    el.style.top               = y + 'px';
    el.style.animationDuration = dur + 'ms';

    // Give each particle a random drift via CSS custom properties
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');

    // Apply drift via inline keyframe override using translate addition
    // We animate in JS for flexibility
    document.body.appendChild(el);

    // Drift the element while it fades (JS-driven position)
    const start = performance.now();
    const startX = x, startY = y;

    function drift(now) {
      const t = Math.min(1, (now - start) / dur);
      el.style.left = (startX + dx * t) + 'px';
      el.style.top  = (startY + dy * t) + 'px';
      if (t < 1) requestAnimationFrame(drift);
    }
    requestAnimationFrame(drift);

    // Remove after animation
    setTimeout(() => el.remove(), dur + 50);
  }

  function spawnBurst(x, y) {
    const count = Math.floor(randomBetween(2, 5));
    for (let i = 0; i < count; i++) {
      // Slight spread around cursor
      const ox = randomBetween(-6, 6);
      const oy = randomBetween(-6, 6);
      spawnParticle(x + ox, y + oy);
    }
  }

  // Throttle: only spawn when mouse moves enough
  const MIN_DIST = 12;   // px between spawns

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MIN_DIST) {
      lastX = mouseX;
      lastY = mouseY;
      spawnBurst(mouseX, mouseY);
    }
  });

  // Extra burst on click for delight
  document.addEventListener('click', e => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => spawnParticle(e.clientX, e.clientY), i * 30);
    }
  });
})();
