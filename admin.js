/* =========================================================
   ADMIN PIN
========================================================= */

const ADMIN_PIN = "1211";

const pinLock =
  document.getElementById("pinLock");

const adminContent =
  document.getElementById("adminContent");

const pinInput =
  document.getElementById("pinInput");

const pinButton =
  document.getElementById("pinButton");

const pinError =
  document.getElementById("pinError");


function unlockAdmin() {

  const enteredPin =
    pinInput.value.trim();


  if (enteredPin === ADMIN_PIN) {

    pinLock.classList.add("pin-hidden");

    adminContent.classList.remove("hidden");

    sessionStorage.setItem(
      "pokemonAdminUnlocked",
      "true"
    );

  } else {

    pinError.textContent =
      "Incorrect PIN. Please try again.";

    pinInput.value = "";

    pinInput.focus();

  }

}


pinButton.addEventListener(
  "click",
  unlockAdmin
);


pinInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      unlockAdmin();

    }

  }
);


/*
   Keep admin unlocked when refreshing
   the page in the same browser tab.
*/

if (
  sessionStorage.getItem(
    "pokemonAdminUnlocked"
  ) === "true"
) {

  pinLock.classList.add("hidden");

  adminContent.classList.remove("hidden");

}

/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyD7sHpbgESBLvdegJLgUmN-AYzC1UMzMXw",
  authDomain: "pokemon-spin-it.firebaseapp.com",
  projectId: "pokemon-spin-it",
  storageBucket: "pokemon-spin-it.firebasestorage.app",
  messagingSenderId: "173320668039",
  appId: "1:173320668039:web:0817a1af6afb06e7cf4922"
};

firebase.initializeApp(firebaseConfig);

const db =
  firebase.firestore();


const drawRef =
  db.collection("luckyDraw")
    .doc("current");



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


const saveDrawButton =
  document.getElementById("saveDraw");

const setupMessage =
  document.getElementById("setupMessage");

const controlSection =
  document.getElementById("controlSection");


const spinButton =
  document.getElementById("spinButton");

const undoButton =
  document.getElementById("undoButton");

const resetButton =
  document.getElementById("resetButton");


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


const latestWinner =
  document.getElementById("latestWinner");

const latestWinnerName =
  document.getElementById("latestWinnerName");

const latestWinnerGroup =
  document.getElementById("latestWinnerGroup");



/* =========================================================
   LOCAL STATE
========================================================= */

let currentDraw = null;

let spinLocked = false;



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


  const policyCount =
    policy.length;

  const planningCount =
    planning.length;

  const total =
    policyCount + planningCount;


  const prizes =
    parseInt(prizeCountInput.value) || 0;


  policyCountDisplay.textContent =
    `${policyCount} people`;

  planningCountDisplay.textContent =
    `${planningCount} people`;

  totalParticipantsDisplay.textContent =
    total;


  if (total === 0) {

    policyRatioDisplay.textContent =
      "0%";

    planningRatioDisplay.textContent =
      "0%";

    policyAllocationDisplay.textContent =
      "0";

    planningAllocationDisplay.textContent =
      "0";


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


  let policyTarget =
    Math.round(
      prizes * policyRatio
    );


  let planningTarget =
    prizes - policyTarget;



  /*
     Prevent allocation exceeding
     available participants.
  */

  if (
    policyTarget >
    policyCount
  ) {

    policyTarget =
      policyCount;

    planningTarget =
      Math.min(
        prizes - policyTarget,
        planningCount
      );

  }


  if (
    planningTarget >
    planningCount
  ) {

    planningTarget =
      planningCount;

    policyTarget =
      Math.min(
        prizes - planningTarget,
        policyCount
      );

  }


  policyAllocationDisplay.textContent =
    policyTarget;

  planningAllocationDisplay.textContent =
    planningTarget;


  return {
    policyTarget,
    planningTarget
  };

}



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
   SAVE / START DRAW
========================================================= */

saveDrawButton.addEventListener(
  "click",
  saveDraw
);


async function saveDraw() {

  setupMessage.textContent = "";


  const policy =
    getNames(policyNamesInput.value);


  const planning =
    getNames(planningNamesInput.value);


  const totalParticipants =
    policy.length +
    planning.length;


  const totalPrizes =
    parseInt(
      prizeCountInput.value
    );


  if (totalParticipants === 0) {

    setupMessage.textContent =
      "Please enter participants.";

    return;

  }


  if (
    !totalPrizes ||
    totalPrizes < 1
  ) {

    setupMessage.textContent =
      "Please enter a valid number of prizes.";

    return;

  }


  if (
    totalPrizes >
    totalParticipants
  ) {

    setupMessage.textContent =
      "There cannot be more prizes than participants.";

    return;

  }


  const allocation =
    calculateAllocation();


  const policyParticipants =
    policy.map((name, index) => ({

      id: `policy-${index}`,
      name,
      group: "Policy"

    }));


  const planningParticipants =
    planning.map((name, index) => ({

      id: `planning-${index}`,
      name,
      group: "Planning"

    }));


  const participants = [
    ...policyParticipants,
    ...planningParticipants
  ];


  await drawRef.set({

    participants,

    winners: [],

    totalPrizes,

    policyTarget:
      allocation.policyTarget,

    planningTarget:
      allocation.planningTarget,

    policyWon: 0,

    planningWon: 0,

    spinId: 0,

    spinning: false,

    selectedWinner: null,

    drawComplete: false,

    updatedAt:
      firebase.firestore.FieldValue
        .serverTimestamp()

  });


  setupMessage.textContent =
    "✓ Lucky draw saved! Broadcast screen is ready.";

}



/* =========================================================
   GET ELIGIBLE PARTICIPANTS
========================================================= */

function getEligibleParticipants(draw) {

  if (!draw) {
    return [];
  }


  const winners =
    draw.winners || [];


  const winnerIds =
    new Set(
      winners.map(
        winner => winner.id
      )
    );


  const remaining =
    draw.participants.filter(
      person =>
        !winnerIds.has(person.id)
    );


  const policyRemaining =
    remaining.filter(
      person =>
        person.group === "Policy"
    );


  const planningRemaining =
    remaining.filter(
      person =>
        person.group === "Planning"
    );


  if (
    draw.policyWon >=
    draw.policyTarget
  ) {

    return planningRemaining;

  }


  if (
    draw.planningWon >=
    draw.planningTarget
  ) {

    return policyRemaining;

  }


  return remaining;

}



/* =========================================================
   RANDOM WINNER
========================================================= */

function randomWinner(eligible) {

  if (eligible.length === 0) {
    return null;
  }


  const randomIndex =
    Math.floor(
      Math.random() *
      eligible.length
    );


  return eligible[randomIndex];

}



/* =========================================================
   SPIN
========================================================= */

spinButton.addEventListener(
  "click",
  spinWheel
);


async function spinWheel() {

  if (
    spinLocked ||
    !currentDraw
  ) {
    return;
  }


  if (
    currentDraw.drawComplete
  ) {
    return;
  }


  const eligible =
    getEligibleParticipants(
      currentDraw
    );


  if (
    eligible.length === 0
  ) {
    return;
  }


  spinLocked = true;

  spinButton.disabled = true;


  const winner =
    randomWinner(eligible);


  const newSpinId =
    (currentDraw.spinId || 0) + 1;


  /*
     First tell the broadcast screen
     to begin spinning.
  */

  await drawRef.update({

    spinning: true,

    selectedWinner: winner,

    spinId: newSpinId,

    updatedAt:
      firebase.firestore.FieldValue
        .serverTimestamp()

  });


  /*
     Wheel animation lasts ~5 seconds.

     Afterward, officially register
     the winner.
  */

  setTimeout(
    async () => {

      try {

        const snapshot =
          await drawRef.get();


        if (!snapshot.exists) {
          return;
        }


        const draw =
          snapshot.data();


        const winners =
          draw.winners || [];


        /*
           Avoid accidentally registering
           the same spin twice.
        */

        if (
          winners.some(
            existing =>
              existing.spinId ===
              newSpinId
          )
        ) {

          return;

        }


        const winnerRecord = {

          ...winner,

          spinId: newSpinId

        };


        const updatedWinners = [
          ...winners,
          winnerRecord
        ];


        let policyWon =
          draw.policyWon || 0;

        let planningWon =
          draw.planningWon || 0;


        if (
          winner.group ===
          "Policy"
        ) {

          policyWon++;

        } else {

          planningWon++;

        }


        const drawComplete =
          updatedWinners.length >=
          draw.totalPrizes;


        await drawRef.update({

          winners:
            updatedWinners,

          policyWon,

          planningWon,

          spinning: false,

          drawComplete,

          updatedAt:
            firebase.firestore.FieldValue
              .serverTimestamp()

        });


      } finally {

        spinLocked = false;

        spinButton.disabled = false;

      }

    },
    5500
  );

}



/* =========================================================
   UNDO LAST WINNER
========================================================= */

undoButton.addEventListener(
  "click",
  undoLastWinner
);


async function undoLastWinner() {

  if (
    !currentDraw ||
    currentDraw.spinning
  ) {
    return;
  }


  const winners =
    [
      ...(currentDraw.winners || [])
    ];


  if (
    winners.length === 0
  ) {
    return;
  }


  const removed =
    winners.pop();


  let policyWon =
    currentDraw.policyWon || 0;

  let planningWon =
    currentDraw.planningWon || 0;


  if (
    removed.group ===
    "Policy"
  ) {

    policyWon =
      Math.max(
        0,
        policyWon - 1
      );

  } else {

    planningWon =
      Math.max(
        0,
        planningWon - 1
      );

  }


  await drawRef.update({

    winners,

    policyWon,

    planningWon,

    drawComplete: false,

    selectedWinner: null,

    spinning: false,

    updatedAt:
      firebase.firestore.FieldValue
        .serverTimestamp()

  });

}



/* =========================================================
   RESET DRAW
========================================================= */

resetButton.addEventListener(
  "click",
  resetDraw
);


async function resetDraw() {

  if (!currentDraw) {
    return;
  }


  const confirmed =
    confirm(
      "Reset all winners and restart the lucky draw?"
    );


  if (!confirmed) {
    return;
  }


  await drawRef.update({

    winners: [],

    policyWon: 0,

    planningWon: 0,

    spinId:
      (currentDraw.spinId || 0) + 1,

    spinning: false,

    selectedWinner: null,

    drawComplete: false,

    updatedAt:
      firebase.firestore.FieldValue
        .serverTimestamp()

  });

}



/* =========================================================
   FIRESTORE LIVE LISTENER
========================================================= */

drawRef.onSnapshot(
  snapshot => {

    if (!snapshot.exists) {

      currentDraw = null;

      controlSection.classList.add(
        "hidden"
      );

      return;

    }


    currentDraw =
      snapshot.data();


    controlSection.classList.remove(
      "hidden"
    );


    prizesAwardedDisplay.textContent =
      (
        currentDraw.winners || []
      ).length;


    totalPrizesDisplay.textContent =
      currentDraw.totalPrizes;


    policyWonDisplay.textContent =
      currentDraw.policyWon;


    planningWonDisplay.textContent =
      currentDraw.planningWon;


    policyTargetDisplay.textContent =
      currentDraw.policyTarget;


    planningTargetDisplay.textContent =
      currentDraw.planningTarget;


    const winners =
      currentDraw.winners || [];


    if (
      winners.length > 0
    ) {

      const winner =
        winners[
          winners.length - 1
        ];


      latestWinnerName.textContent =
        winner.name;


      latestWinnerGroup.textContent =
        winner.group;


      latestWinner.classList.remove(
        "hidden"
      );

    } else {

      latestWinner.classList.add(
        "hidden"
      );

    }


    spinButton.disabled =
      currentDraw.spinning ||
      currentDraw.drawComplete;

  }
);



/* =========================================================
   INITIAL
========================================================= */

calculateAllocation();
