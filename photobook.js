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
