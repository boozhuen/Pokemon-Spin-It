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

const canvas =
  document.getElementById(
    "wheelCanvas"
  );

const ctx =
  canvas.getContext("2d");


const winnerAnnouncement =
  document.getElementById(
    "winnerAnnouncement"
  );

const winnerNameDisplay =
  document.getElementById(
    "winnerName"
  );

const winnerGroupDisplay =
  document.getElementById(
    "winnerGroup"
  );

const prizeStatus =
  document.getElementById(
    "prizeStatus"
  );

const drawComplete =
  document.getElementById(
    "drawComplete"
  );



/* =========================================================
   STATE
========================================================= */

let currentDraw = null;

let displayedParticipants = [];

let lastSpinId = null;

let currentRotation = 0;



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
   DRAW WHEEL
========================================================= */

function drawWheel(participants) {

  displayedParticipants =
    participants;


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  const count =
    participants.length;


  if (
    count === 0
  ) {

    ctx.fillStyle =
      "#111827";

    ctx.font =
      "bold 32px Arial";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    ctx.fillText(
      "Ready!",
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
    canvas.width / 2 - 12;


  const sliceAngle =
    (Math.PI * 2) /
    count;


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



  participants.forEach(
    (person, index) => {

      const startAngle =
        index * sliceAngle;


      const endAngle =
        startAngle +
        sliceAngle;



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
        colors[
          index %
          colors.length
        ];

      ctx.fill();


      ctx.strokeStyle =
        "white";

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


      ctx.textBaseline =
        "middle";


      ctx.fillStyle =
        "white";


      if (
        count > 50
      ) {

        ctx.font =
          "bold 8px Arial";

      } else if (
        count > 30
      ) {

        ctx.font =
          "bold 10px Arial";

      } else {

        ctx.font =
          "bold 14px Arial";

      }


      let name =
        person.name;


      if (
        name.length > 18
      ) {

        name =
          name.substring(
            0,
            16
          ) + "...";

      }


      ctx.fillText(
        name,
        radius - 20,
        0
      );


      ctx.restore();

    }
  );



  /* CENTRE */

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    58,
    0,
    Math.PI * 2
  );


  ctx.fillStyle =
    "white";

  ctx.fill();


  ctx.strokeStyle =
    "#111827";

  ctx.lineWidth =
    7;

  ctx.stroke();


  ctx.fillStyle =
    "#111827";

  ctx.font =
    "bold 18px Arial";

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
   SPIN ANIMATION
========================================================= */

function animateSpin(
  winner,
  spinId
) {

  /*
     IMPORTANT:

     Use the participants currently
     displayed on the wheel.

     That guarantees the winner position
     corresponds to the visible wheel.
  */

  const winnerIndex =
    displayedParticipants.findIndex(
      person =>
        person.id === winner.id
    );


  if (
    winnerIndex === -1
  ) {

    return;

  }


  winnerAnnouncement.classList.add(
    "hidden"
  );


  drawComplete.classList.add(
    "hidden"
  );


  const count =
    displayedParticipants.length;


  const sliceDegrees =
    360 / count;


  const winnerCentre =
    winnerIndex *
    sliceDegrees +
    sliceDegrees / 2;


  /*
     Pointer is at 12 o'clock.

     Canvas begins at 3 o'clock,
     therefore pointer corresponds
     to 270 degrees.
  */

  const desiredPosition =
    270 -
    winnerCentre;


  const currentNormalised =
    (
      (
        currentRotation %
        360
      ) +
      360
    ) %
    360;


  let adjustment =
    desiredPosition -
    currentNormalised;


  while (
    adjustment < 0
  ) {

    adjustment += 360;

  }


  const extraSpins =
    6 +
    Math.floor(
      Math.random() * 3
    );


  currentRotation +=
    extraSpins * 360 +
    adjustment;


  canvas.style.transition =
    "transform 5s cubic-bezier(0.12, 0.8, 0.18, 1)";


  canvas.style.transform =
    `rotate(${currentRotation}deg)`;


  lastSpinId =
    spinId;

}



/* =========================================================
   SHOW WINNER
========================================================= */

function showWinner(winner) {

  winnerNameDisplay.textContent =
    winner.name;


  winnerGroupDisplay.textContent =
    winner.group;


  winnerAnnouncement.classList.remove(
    "hidden"
  );

}



/* =========================================================
   FIRESTORE LISTENER
========================================================= */

drawRef.onSnapshot(
  snapshot => {

    if (!snapshot.exists) {

      prizeStatus.textContent =
        "Waiting for the draw to begin...";

      drawWheel([]);

      return;

    }


    const previousDraw =
      currentDraw;


    currentDraw =
      snapshot.data();


    const winners =
      currentDraw.winners || [];


    prizeStatus.textContent =
      `${winners.length} / ${currentDraw.totalPrizes} prizes awarded`;



    /*
       NEW SPIN RECEIVED
    */

    if (
      currentDraw.spinning &&
      currentDraw.selectedWinner &&
      currentDraw.spinId !==
        lastSpinId
    ) {

      /*
         The wheel should still show
         the pre-spin eligible list.
      */

      const eligible =
        getEligibleParticipants(
          currentDraw
        );


      drawWheel(eligible);


      /*
         Browser needs a tiny moment
         to render before animation.
      */

      requestAnimationFrame(
        () => {

          requestAnimationFrame(
            () => {

              animateSpin(
                currentDraw.selectedWinner,
                currentDraw.spinId
              );

            }
          );

        }
      );


      return;

    }



    /*
       SPIN FINISHED
    */

    if (
      !currentDraw.spinning &&
      winners.length > 0
    ) {

      const latestWinner =
        winners[
          winners.length - 1
        ];


      showWinner(
        latestWinner
      );

    }



    /*
       DRAW COMPLETE
    */

    if (
      currentDraw.drawComplete
    ) {

      /*
         Keep the final winner visible
         first.

         Completion message can appear
         beneath it.
      */

      drawComplete.classList.remove(
        "hidden"
      );

    } else {

      drawComplete.classList.add(
        "hidden"
      );

    }



    /*
       Redraw wheel after winner
       has been removed.

       Do NOT redraw while spinning.
    */

    if (
      !currentDraw.spinning
    ) {

      const eligible =
        getEligibleParticipants(
          currentDraw
        );


      /*
         Wait slightly so the winner
         remains visually associated
         with the wheel landing.
      */

      setTimeout(
        () => {

          drawWheel(
            eligible
          );

        },
        800
      );

    }

  }
);



/* =========================================================
   INITIAL
========================================================= */

drawWheel([]);
