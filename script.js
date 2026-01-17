// ✅ Unlock at 24 Feb 2026, 00:00 France time
const BIRTHDAY_DATE_FRANCE = "2026-02-24";

// ✅ After unlock go to this page (we'll create later)
const UNLOCK_URL = "birthday.html";

function setDigits(id1, id2, value){
  const str = String(value).padStart(2, "0");
  document.getElementById(id1).textContent = str[0];
  document.getElementById(id2).textContent = str[1];
}

// Get current time in France (Europe/Paris)
function getFranceNow(){
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now);

  const map = {};
  for (const p of parts) map[p.type] = p.value;

  return new Date(`${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`);
}

// France midnight target
function getFranceTarget(){
  return new Date(`${BIRTHDAY_DATE_FRANCE}T00:00:00`);
}

function update(){
  const franceNow = getFranceNow();
  const target = getFranceTarget();

  let diff = target.getTime() - franceNow.getTime();

  // if unlocked
  if(diff <= 0){
    setDigits("h1","h2",0);
    setDigits("m1","m2",0);
    setDigits("s1","s2",0);

    setTimeout(() => {
      window.location.href = UNLOCK_URL;
    }, 1200);
    return;
  }

  // time left
  const totalSeconds = Math.floor(diff / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // show only last 2 digits of hours (because design has 2 boxes only)
  const displayHours = hours % 100;

  setDigits("h1","h2",displayHours);
  setDigits("m1","m2",minutes);
  setDigits("s1","s2",seconds);
}

update();
setInterval(update, 1000);
// 🔒 Nikita test unlock button
const SECRET_PASSWORD = "nikita";   // ✅ change this to whatever you want

document.getElementById("unlockBtn")?.addEventListener("click", () => {
  const pass = prompt("Password:");
  if (pass === SECRET_PASSWORD) {
    window.location.href = UNLOCK_URL; // opens birthday.html
  } else {
    alert("Wrong password");
  }
});

