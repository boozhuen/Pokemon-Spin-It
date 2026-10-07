/* =========================================================
   ELEMENTS
========================================================= */

const policyNamesInput =
  document.getElementById("policyNames");

const planningNamesInput =
  document.getElementById("planningNames");

const prizeCountInput =
  document.getElementById("prizeCount");

const policyCountDisplay =
  document.getElementById("policyCount");

const planningCountDisplay =
  document.getElementById("planningCount");

const totalParticipantsDisplay =
  document.getElementById("totalParticipants");

const policyRatioDisplay =
  document.getElementById("policyRatio");

const planningRatioDisplay =
  document.getElementById("planningRatio");

const policyAllocationDisplay =
  document.getElementById("policyAllocation");

const planningAllocationDisplay =
  document.getElementById("planningAllocation");

const startDrawButton =
  document.getElementById("startDraw");

const setupError =
  document.getElementById("setupError");

const drawSection =
  document.getElementById("drawSection");

const winnersSection =
  document.getElementById("winnersSection");

const canvas =
  document.getElementById("wheelCanvas");

const ctx =
  canvas.getContext("2d");

const spinButton =
  document.getElementById("spinButton");

const undoButton =
  document.getElementById("undoButton");

const resetButton =
  document.getElementById("resetButton");

const winnerAnnouncement =
  document.getElementById("winnerAnnouncement");

const winnerNameDisplay =
  document.getElementById("winnerName");

const winnerGroupDisplay =
  document.getElementById("winnerGroup");

const winnersList =
  document.getElementById("winnersList");

const prizesAwardedDisplay =
  document.getElementById("prizesAwarded");

const totalPrizesDisplay =
  document.getElementById("totalPrizes");

const policyWonDisplay =
  document.getElementById("policyWon");

const planningWonDisplay =
  document.getElementById("planningWon");

const policyTargetDisplay =
  document.getElementById("policyTarget");

const planningTargetDisplay =
  document.getElementById("planningTarget");

const eligibleMessage =
  document.getElementById("eligibleMessage");


/* =========================================================
   STATE
========================================================= */

let policyParticipants = [];
let planningParticipants = [];

let policyTarget = 0;
let planningTarget = 0;

let policyWon = 0;
let planningWon = 0;

let totalPrizes = 0;

let winners = [];

let eligibleParticipants = [];

let currentRotation = 0;
let spinning = false;


/* =========================================================
   GET NAMES
========================================================= */

function getNames(text) {

  return text
    .split("\n")
    .map(name => name.trim())
    .filter(name => name !== "");

}


/* =========================================================
   CALCULATE ALLOCATION
========================================================= */

function calculateAllocation() {

  const policy =
    getNames(policyNamesInput.value);

  const planning =
    getNames(planningNamesInput.value);

  const policyCount = policy.length;
  const planningCount = planning.length;

  const total =
    policyCount + planningCount;

  let prizes =
    parseInt(prizeCountInput.value) || 0;


  policyCountDisplay.textContent =
    `${policyCount} people`;

  planningCountDisplay.textContent =
    `${planningCount} people`;

  totalParticipantsDisplay.textContent =
    total;


  if (total === 0) {

    policyRatioDisplay.textContent = "0%";
    planningRatioDisplay.textContent = "0%";

    policyAllocationDisplay.textContent = "0";
    planningAllocationDisplay.textContent = "0";

    return {
      policyTarget: 0,
      planningTarget: 0
    };

  }


  const policyRatio =
    policyCount / total;

  const planningRatio =
    planningCount / total;


  policyRatioDisplay.textContent =
    `${(policyRatio * 100).toFixed(1)}%`;

  planningRatioDisplay.textContent =
    `${(planningRatio * 100).toFixed(1)}%`;


  /*
     We calculate Policy first.

     Planning receives the remaining prizes.

     This guarantees:

     Policy winners + Planning winners
     ALWAYS equals the number of prizes.
  */

  let calculatedPolicy =
    Math.round(prizes * policyRatio);

  let calculatedPlanning =
    prizes - calculatedPolicy;


  /*
     Prevent allocating more winners than
     there are people in a group.
  */

  if (calculatedPolicy > policyCount) {

    calculatedPolicy = policyCount;

    calculatedPlanning =
      Math.min(
        prizes - calculatedPolicy,
        planningCount
      );

  }


  if (calculatedPlanning > planningCount) {

    calculatedPlanning = planningCount;

    calculatedPolicy =
      Math.min(
        prizes - calculatedPlanning,
        policyCount
      );

  }


  policyAllocationDisplay.textContent =
    calculatedPolicy;

  planningAllocationDisplay.textContent =
    calculatedPlanning;


  return {
    policyTarget: calculatedPolicy,
    planningTarget: calculatedPlanning
  };

}


/* =========================================================
   LIVE UPDATE
========================================================= */

policyNamesInput.addEventListener(
  "input",
  calculateAllocation
);

planningNamesInput.addEventListener(
  "input",
  calculateAllocation
);

prizeCountInput.addEventListener(
  "input",
  calculateAllocation
);


/* =========================================================
   START DRAW
========================================================= */

startDrawButton.addEventListener(
  "click",
  startDraw
);


function startDraw() {

  setupError.textContent = "";

  policyParticipants =
    getNames(policyNamesInput.value)
      .map(name => ({
        name,
        group: "Policy"
      }));


  planningParticipants =
    getNames(planningNamesInput.value)
      .map(name => ({
        name,
        group: "Planning"
      }));


  const totalParticipants =
    policyParticipants.length +
    planningParticipants.length;


  totalPrizes =
    parseInt(prizeCountInput.value);


  if (totalParticipants === 0) {

    setupError.textContent =
      "Please enter at least one participant.";

    return;

  }


  if (
    !totalPrizes ||
    totalPrizes < 1
  ) {

    setupError.textContent =
      "Please enter a valid number of prizes.";

    return;

  }


  if (totalPrizes > totalParticipants) {

    setupError.textContent =
      "There cannot be more prizes than participants.";

    return;

  }


  const allocation =
    calculateAllocation();


  policyTarget =
    allocation.policyTarget;

  planningTarget =
    allocation.planningTarget;


  policyWon = 0;
  planningWon = 0;

  winners = [];

  currentRotation = 0;


  totalPrizesDisplay.textContent =
    totalPrizes;

  policyTargetDisplay.textContent =
    policyTarget;

  planningTargetDisplay.textContent =
    planningTarget;


  drawSection.classList.remove("hidden");

  winnersSection.classList.remove("hidden");

  winnerAnnouncement.classList.add("hidden");


  updateDraw();

  drawSection.scrollIntoView({
    behavior: "smooth"
  });

}


/* =========================================================
   DETERMINE ELIGIBLE PEOPLE
========================================================= */

function getEligibleParticipants() {

  const winnerNames =
    new Set(
      winners.map(winner => winner.name)
    );


  const policyRemaining =
    policyParticipants.filter(
      person =>
        !winnerNames.has(person.name)
    );


  const planningRemaining =
    planningParticipants.filter(
      person =>
        !winnerNames.has(person.name)
    );


  /*
     If Policy has reached its quota,
     only Planning can appear.

     If Planning has reached its quota,
     only Policy can appear.

     Otherwise BOTH groups appear.
  */

  if (policyWon >= policyTarget) {

    return planningRemaining;

  }


  if (planningWon >= planningTarget) {

    return policyRemaining;

  }


  return [
    ...policyRemaining,
    ...planningRemaining
  ];

}


/* =========================================================
   DRAW WHEEL
========================================================= */

function drawWheel() {

  eligibleParticipants =
    getEligibleParticipants();


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  const count =
    eligibleParticipants.length;


  if (count === 0) {

    ctx.font =
      "bold 26px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "Draw Complete!",
      canvas.width / 2,
      canvas.height / 2
    );

    return;

  }


  const centerX =
    canvas.width / 2;

  const centerY =
    canvas.height / 2;

  const radius =
    canvas.width / 2 - 10;

  const sliceAngle =
    (Math.PI * 2) / count;


  const colors = [
    "#ef4444",
    "#3b82f6",
    "#facc15",
    "#22c55e",
    "#a855f7",
    "#f97316",
    "#06b6d4",
    "#ec4899"
  ];


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const startAngle =
      i * sliceAngle;

    const endAngle =
      startAngle + sliceAngle;


    /* SLICE */

    ctx.beginPath();

    ctx.moveTo(
      centerX,
      centerY
    );

    ctx.arc(
      centerX,
      centerY,
      radius,
      startAngle,
      endAngle
    );

    ctx.closePath();

    ctx.fillStyle =
      colors[i % colors.length];

    ctx.fill();

    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth =
      3;

    ctx.stroke();


    /* NAME */

    ctx.save();

    ctx.translate(
      centerX,
      centerY
    );

    ctx.rotate(
      startAngle +
      sliceAngle / 2
    );

    ctx.textAlign =
      "right";

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      count > 25
        ? "bold 11px Arial"
        : "bold 14px Arial";


    let displayName =
      eligibleParticipants[i].name;


    if (displayName.length > 20) {

      displayName =
        displayName.substring(0, 18) +
        "...";

    }


    ctx.fillText(
      displayName,
      radius - 20,
      5
    );

    ctx.restore();

  }


  /* CENTRE CIRCLE */

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    55,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#ffffff";

  ctx.fill();

  ctx.strokeStyle =
    "#111827";

  ctx.lineWidth =
    6;

  ctx.stroke();


  ctx.fillStyle =
    "#111827";

  ctx.font =
    "bold 17px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    "SPIN",
    centerX,
    centerY
  );

}


/* =========================================================
   SPIN
========================================================= */

spinButton.addEventListener(
  "click",
  spinWheel
);


function spinWheel() {

  if (spinning) {
    return;
  }


  if (
    winners.length >=
    totalPrizes
  ) {

    return;

  }


  eligibleParticipants =
    getEligibleParticipants();


  if (
    eligibleParticipants.length === 0
  ) {

    return;

  }


  spinning = true;

  spinButton.disabled = true;

  winnerAnnouncement.classList.add(
    "hidden"
  );


  /*
     Select winner first.

     The wheel animation then lands
     on that selected winner.
  */

  const winnerIndex =
    Math.floor(
      Math.random() *
      eligibleParticipants.length
    );


  const winner =
    eligibleParticipants[
      winnerIndex
    ];


  const sliceAngle =
    360 /
    eligibleParticipants.length;


  /*
     Canvas slice 0 begins at
     the right-hand side.

     Pointer is at the top,
     therefore -90 degrees.
  */

  const winnerCentre =
    winnerIndex *
    sliceAngle +
    sliceAngle / 2;


  const extraSpins =
    5 +
    Math.floor(
      Math.random() * 4
    );


  const desiredPosition =
    270 -
    winnerCentre;


  const currentNormalised =
    ((currentRotation % 360) + 360) %
    360;


  let adjustment =
    desiredPosition -
    currentNormalised;


  while (
    adjustment < 0
  ) {

    adjustment += 360;

  }


  const spinAmount =
    extraSpins * 360 +
    adjustment;


  currentRotation +=
    spinAmount;


  canvas.style.transition =
    "transform 5s cubic-bezier(0.12, 0.8, 0.18, 1)";


  canvas.style.transform =
    `rotate(${currentRotation}deg)`;


  setTimeout(
    () => {

      registerWinner(winner);

      spinning = false;

      spinButton.disabled =
        winners.length >= totalPrizes;

    },
    5200
  );

}


/* =========================================================
   REGISTER WINNER
========================================================= */

function registerWinner(winner) {

  winners.push(winner);


  if (
    winner.group === "Policy"
  ) {

    policyWon++;

  } else {

    planningWon++;

  }


  winnerNameDisplay.textContent =
    winner.name;

  winnerGroupDisplay.textContent =
    winner.group;


  winnerAnnouncement.classList.remove(
    "hidden"
  );


  updateDraw();

}


/* =========================================================
   UPDATE DRAW
========================================================= */

function updateDraw() {

  prizesAwardedDisplay.textContent =
    winners.length;

  policyWonDisplay.textContent =
    policyWon;

  planningWonDisplay.textContent =
    planningWon;


  const eligible =
    getEligibleParticipants();


  eligibleMessage.textContent =
    `${eligible.length} participants currently eligible`;


  renderWinners();

  drawWheel();


  if (
    winners.length >=
    totalPrizes
  ) {

    spinButton.disabled = true;

    eligibleMessage.textContent =
      "🎉 All prizes have been awarded!";

  } else {

    spinButton.disabled = false;

  }

}


/* =========================================================
   WINNERS LIST
========================================================= */

function renderWinners() {

  winnersList.innerHTML = "";


  if (
    winners.length === 0
  ) {

    winnersList.innerHTML =
      "<p>No winners yet. Spin the wheel!</p>";

    return;

  }


  winners.forEach(
    (winner, index) => {

      const row =
        document.createElement("div");

      row.className =
        "winner-row";


      row.innerHTML = `
        <span class="winner-number">
          #${index + 1}
        </span>

        <div class="winner-info">
          <strong>
            ${winner.name}
          </strong>

          <div class="winner-group">
            ${winner.group}
          </div>
        </div>

        <span>
          🏆
        </span>
      `;


      winnersList.appendChild(row);

    }
  );

}


/* =========================================================
   UNDO
========================================================= */

undoButton.addEventListener(
  "click",
  undoWinner
);


function undoWinner() {

  if (
    winners.length === 0 ||
    spinning
  ) {

    return;

  }


  const removedWinner =
    winners.pop();


  if (
    removedWinner.group ===
    "Policy"
  ) {

    policyWon--;

  } else {

    planningWon--;

  }


  winnerAnnouncement.classList.add(
    "hidden"
  );


  updateDraw();

}


/* =========================================================
   RESET
========================================================= */

resetButton.addEventListener(
  "click",
  resetDraw
);


function resetDraw() {

  if (spinning) {
    return;
  }


  const confirmed =
    confirm(
      "Reset the entire lucky draw?"
    );


  if (!confirmed) {
    return;
  }


  winners = [];

  policyWon = 0;
  planningWon = 0;

  currentRotation = 0;


  canvas.style.transition =
    "none";

  canvas.style.transform =
    "rotate(0deg)";


  winnerAnnouncement.classList.add(
    "hidden"
  );


  updateDraw();

}


/* =========================================================
   INITIAL DISPLAY
========================================================= */

calculateAllocation();
