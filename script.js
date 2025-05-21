// MOJI กำลังคิดว่า: เข้าถึงองค์ประกอบ HTML ที่จำเป็นทั้งหมดก่อน
const racersData = [
    { id: 'racer1', name: "นักวิ่งแดง", color: '#e74c3c' },
    { id: 'racer2', name: "นักวิ่งฟ้า", color: '#3498db' },
    { id: 'racer3', name: "นักวิ่งเขียว", color: '#2ecc71' },
    { id: 'racer4', name: "นักวิ่งเหลือง", color: '#f1c40f' },
    { id: 'racer5', name: "นักวิ่งม่วง", color: '#9b59b6' }
];

let racers = [];

const startButton = document.getElementById('startButton');
const statusDisplay = document.getElementById('status');
const track = document.getElementById('track');
const finishLineElement = document.getElementById('finishLine');

const playerNameModal = document.getElementById('playerNameModal');
const playerNameInput = document.getElementById('playerNameInput');
const submitPlayerNameButton = document.getElementById('submitPlayerName');
const currentPlayerNameDisplay = document.getElementById('currentPlayerNameDisplay');

const playerGoldDisplay = document.getElementById('playerGold');
const betSelection = document.getElementById('betSelection');

const podiumArea = document.getElementById('podium-area');
const podiumStands = {
    1: podiumArea.querySelector('#pos1 .runner-name-podium'),
    2: podiumArea.querySelector('#pos2 .runner-name-podium'),
    3: podiumArea.querySelector('#pos3 .runner-name-podium')
};

const recordsArea = document.getElementById('records-area');
const playerRecordsTableBody = document.getElementById('playerRecordsTableBody');

const leaderboardArea = document.getElementById('localLeaderboardArea');
const leaderboardTableBody = document.getElementById('leaderboardTableBody');

let raceInterval;
let gameInProgress = false;
let nextRank = 1;

const INITIAL_GOLD = 5000;
const BET_AMOUNT = 500;
const WIN_REWARD = 1000;

let currentPlayerName = "ผู้เล่น";
let currentPlayerStats = {
    name: "ผู้เล่น",
    wins: 0,
    totalBets: 0,
    gold: INITIAL_GOLD,
    winPercentage: 0.0
};

// --- MOJI: ส่วนสำหรับ Firebase ---
// **สำคัญมาก:** แทนที่ "YOUR_..." ด้วย Firebase Config จริงจาก Console ของคุณ!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // << 🔥 คุณพิสิษฐ์: ไปเอาค่านี้จาก Firebase Console 🔥
  authDomain: "phisitgame-2aa1b.firebaseapp.com", // << 🔥 คุณพิสิษฐ์: ตรวจสอบค่านี้จาก Firebase Console 🔥 (ส่วนใหญ่มักจะเป็น projectId.firebaseapp.com)
  databaseURL: "https://phisitgame-2aa1b-default-rtdb.asia-southeast1.firebasedatabase.app/", // << MOJI ใส่ให้แล้วค่ะ
  projectId: "phisitgame-2aa1b", // << ชื่อนี้น่าจะถูกต้องแล้ว (ถ้าตรงกับ Project ID ใน Console)
  storageBucket: "phisitgame-2aa1b.appspot.com", // << 🔥 คุณพิสิษฐ์: ตรวจสอบค่านี้จาก Firebase Console 🔥 (ส่วนใหญ่มักจะเป็น projectId.appspot.com)
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // << 🔥 คุณพิสิษฐ์: ไปเอาค่านี้จาก Firebase Console 🔥
  appId: "YOUR_APP_ID" // << 🔥 คุณพิสิษฐ์: ไปเอาค่านี้จาก Firebase Console 🔥
};

// Initialize Firebase (คุณพิสิษฐ์: เอา comment ส่วนนี้ออกเมื่อใส่ Config ทั้งหมดถูกต้อง และเพิ่ม SDK ใน HTML แล้ว)
/*
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        window.database = firebase.database(); // ทำให้ database เข้าถึงได้จาก global scope
        console.log("Firebase Initialized Successfully!");
    } catch (e) {
        console.error("Error initializing Firebase: ", e);
        window.database = null;
    }
} else {
    console.warn("Firebase SDK not loaded or firebaseConfig is placeholder/incomplete. Firebase features will be unavailable.");
    window.database = null;
}
*/
// --- สิ้นสุดส่วน Firebase ---


function setupPlayerNameModal() {
    playerNameModal.style.display = 'flex';
    startButton.disabled = true;
    betSelection.disabled = true;
    recordsArea.style.display = 'none';
    if (leaderboardArea) leaderboardArea.style.display = 'none';

    submitPlayerNameButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
            currentPlayerName = name;
            loadPlayerStatsFromLocalStorage(currentPlayerName);
            playerNameModal.style.display = 'none';
            initializeGameUI();
        } else {
            alert("กรุณาใส่ชื่อผู้เล่นด้วยนะคะ!");
        }
    });
}

function initializeRacers() {
    racers = racersData.map(data => ({
        id: data.id,
        element: document.getElementById(data.id),
        name: data.name,
        position: 0,
        rank: 0,
        finished: false
    }));
}

function initializeGameUI() {
    currentPlayerNameDisplay.textContent = currentPlayerName;
    statusDisplay.innerHTML = `สวัสดีค่ะ <b>${currentPlayerName}</b>! <br>เลือกนักวิ่งที่คิดว่าจะชนะ แล้วคลิก "เริ่มแข่ง!"`;
    playerGoldDisplay.textContent = currentPlayerStats.gold;

    startButton.disabled = false;
    betSelection.disabled = false;
    recordsArea.style.display = 'block';
    if (leaderboardArea) leaderboardArea.style.display = 'block';

    updateCurrentPlayerRecordDisplay();

    // --- MOJI: เลือกแสดง Leaderboard ---
    // คุณพิสิษฐ์: ถ้าต้องการให้ Firebase เป็น default และ Firebase พร้อมแล้ว ให้เรียก displayFirebaseLeaderboard()
    // if (window.database) {
    //    displayFirebaseLeaderboard();
    // } else {
       displayLocalLeaderboard(); // Fallback to local or default to local
    // }
}

function loadPlayerStatsFromLocalStorage(playerName) {
    const storedStats = localStorage.getItem('playerStats_' + playerName);
    if (storedStats) {
        currentPlayerStats = JSON.parse(storedStats);
        if (typeof currentPlayerStats.gold === 'undefined') {
            currentPlayerStats.gold = INITIAL_GOLD;
        }
        if (typeof currentPlayerStats.winPercentage === 'undefined') {
            currentPlayerStats.winPercentage = currentPlayerStats.totalBets > 0 ? parseFloat(((currentPlayerStats.wins / currentPlayerStats.totalBets) * 100).toFixed(1)) : 0.0;
        }
    } else {
        currentPlayerStats = { name: playerName, wins: 0, totalBets: 0, gold: INITIAL_GOLD, winPercentage: 0.0 };
    }
}

function savePlayerStatsToLocalStorage() {
    currentPlayerStats.winPercentage = currentPlayerStats.totalBets > 0 ? parseFloat(((currentPlayerStats.wins / currentPlayerStats.totalBets) * 100).toFixed(1)) : 0.0;
    localStorage.setItem('playerStats_' + currentPlayerName, JSON.stringify(currentPlayerStats));
}

function updateCurrentPlayerRecordDisplay() {
    if (!playerRecordsTableBody) return;
    playerRecordsTableBody.innerHTML = '';
    const row = playerRecordsTableBody.insertRow();
    const losses = currentPlayerStats.totalBets - currentPlayerStats.wins;
    row.insertCell().textContent = currentPlayerStats.name;
    row.insertCell().textContent = currentPlayerStats.wins;
    row.insertCell().textContent = losses;
    row.insertCell().textContent = currentPlayerStats.totalBets;
    row.insertCell().textContent = `${currentPlayerStats.winPercentage.toFixed(1)}%`;
    row.insertCell().textContent = currentPlayerStats.gold;
}

function displayLocalLeaderboard() {
    if (!leaderboardTableBody) return;
    leaderboardTableBody.innerHTML = '';
    let allLocalStats = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('playerStats_')) {
            const stats = JSON.parse(localStorage.getItem(key));
            if (typeof stats.winPercentage === 'undefined') {
                 stats.winPercentage = stats.totalBets > 0 ? parseFloat(((stats.wins / stats.totalBets) * 100).toFixed(1)) : 0.0;
            }
            if (typeof stats.gold === 'undefined') {
                stats.gold = INITIAL_GOLD;
            }
            allLocalStats.push(stats);
        }
    }
    allLocalStats.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.totalBets - b.totalBets;
    });
    allLocalStats.slice(0, 10).forEach((stats, index) => {
        const row = leaderboardTableBody.insertRow();
        const losses = stats.totalBets - stats.wins;
        row.insertCell().textContent = `${index + 1}`;
        row.insertCell().textContent = stats.name;
        row.insertCell().textContent = stats.wins;
        row.insertCell().textContent = losses;
        row.insertCell().textContent = stats.totalBets;
        row.insertCell().textContent = `${parseFloat(stats.winPercentage).toFixed(1)}%`;
        row.insertCell().textContent = stats.gold;
    });
}

function startGame() {
    if (gameInProgress) return;
    if (currentPlayerStats.gold < BET_AMOUNT) {
        statusDisplay.textContent = "ทองไม่พอสำหรับเดิมพันค่ะ!";
        return;
    }
    currentPlayerStats.gold -= BET_AMOUNT;
    currentPlayerStats.totalBets++;
    playerGoldDisplay.textContent = currentPlayerStats.gold;
    updateCurrentPlayerRecordDisplay();
    const playerBetOnRacerId = racers[parseInt(betSelection.value) - 1].id;
    gameInProgress = true;
    nextRank = 1;
    podiumArea.style.display = 'none';
    statusDisplay.textContent = "กำลังแข่ง... ลุ้นๆ!";
    startButton.disabled = true;
    betSelection.disabled = true;
    racers.forEach(racer => {
        racer.element.style.left = '15px';
        racer.position = 15;
        racer.finished = false;
        racer.rank = 0;
    });
    raceInterval = setInterval(() => {
        let finishersCount = 0;
        racers.forEach(racer => {
            if (!racer.finished) moveRacer(racer);
            if(racer.finished) finishersCount++;
        });
        checkFinishersAndProcess();
        const winner = racers.find(r => r.rank === 1);
        if (winner && (finishersCount >= 3 || finishersCount === racers.length)) {
             endRaceProcedure(playerBetOnRacerId, `${winner.name} ชนะแล้ว!`);
        } else if (finishersCount === racers.length && !winner) {
            endRaceProcedure(playerBetOnRacerId, "การแข่งขันสิ้นสุดแล้ว!");
        }
    }, 100);
}

function moveRacer(racer) {
    const currentPosition = racer.position;
    const moveDistance = Math.floor(Math.random() * 18) + 6;
    racer.position = currentPosition + moveDistance;
    racer.element.style.left = racer.position + 'px';
}

function checkFinishersAndProcess() {
    const finishLineTriggerPoint = finishLineElement.offsetLeft;
    racers.forEach(racer => {
        if (!racer.finished && (racer.element.offsetLeft + racer.element.offsetWidth) >= finishLineTriggerPoint) {
            racer.finished = true;
            racer.rank = nextRank++;
        }
    });
}

function endRaceProcedure(playerBetOnRacerId, raceEndMessage) {
    clearInterval(raceInterval);
    gameInProgress = false;
    const winner = racers.find(r => r.rank === 1);
    let finalMessage = raceEndMessage;
    if (winner) {
        if (winner.id === playerBetOnRacerId) {
            finalMessage += ` คุณ <b>${currentPlayerName}</b> ทายถูก! ได้รับ ${WIN_REWARD} ทอง!`;
            currentPlayerStats.gold += WIN_REWARD;
            currentPlayerStats.wins++;
        } else {
            finalMessage += ` คุณ <b>${currentPlayerName}</b> ทายผิด (ทาย ${racers.find(r=>r.id === playerBetOnRacerId).name}) ไม่ได้รับทองเพิ่มค่ะ`;
        }
    } else {
        finalMessage += " ไม่พบผู้ชนะที่ชัดเจนในการเดิมพันรอบนี้ค่ะ";
    }
    savePlayerStatsToLocalStorage();
    // --- MOJI: ถ้าใช้ Firebase และ Firebase พร้อมแล้ว ให้เรียกฟังก์ชันบันทึก ---
    // if (window.database) savePlayerStatsToFirebase(currentPlayerStats);

    statusDisplay.innerHTML = finalMessage;
    playerGoldDisplay.textContent = currentPlayerStats.gold;
    updateCurrentPlayerRecordDisplay();

    // --- MOJI: เลือกแสดง Leaderboard ---
    // if (window.database) {
    //    displayFirebaseLeaderboard();
    // } else {
       displayLocalLeaderboard();
    // }

    startButton.disabled = false;
    betSelection.disabled = false;
    startButton.textContent = "แข่งอีกครั้ง!";
    displayPodium();
}

// --- MOJI: ฟังก์ชันตัวอย่างสำหรับ Firebase (คุณพิสิษฐ์: เอา comment ออกและปรับปรุงเมื่อพร้อม) ---
/*
function savePlayerStatsToFirebase(statsToSave) {
  if (window.database) {
    const safePlayerName = statsToSave.name.replace(/[.#$[\]]/g, '_');
    const playerRef = window.database.ref('leaderboard/' + safePlayerName);
    playerRef.set({
      name: statsToSave.name,
      wins: statsToSave.wins,
      totalBets: statsToSave.totalBets,
      gold: statsToSave.gold,
      winPercentage: statsToSave.winPercentage,
      lastPlayed: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      console.log("สถิติบันทึกไป Firebase สำหรับ " + statsToSave.name);
    }).catch((error) => {
      console.error("เกิดข้อผิดพลาดในการบันทึกสถิติไป Firebase: ", error);
    });
  } else {
    console.warn("Firebase Database is not initialized. Cannot save stats to Firebase.");
  }
}

function displayFirebaseLeaderboard() {
  if (window.database && leaderboardTableBody) {
    const leaderboardRef = window.database.ref('leaderboard').orderByChild('winPercentage').limitToLast(10);
    leaderboardRef.on('value', (snapshot) => {
      leaderboardTableBody.innerHTML = '';
      const leaderboardData = [];
      snapshot.forEach((childSnapshot) => {
        leaderboardData.push(childSnapshot.val());
      });
      leaderboardData.reverse();
      leaderboardData.sort((a,b) => {
          if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.totalBets - b.totalBets;
      });
      leaderboardData.forEach((stats, index) => {
          const row = leaderboardTableBody.insertRow();
          const losses = stats.totalBets - stats.wins;
          row.insertCell().textContent = `${index + 1}`;
          row.insertCell().textContent = stats.name;
          row.insertCell().textContent = stats.wins;
          row.insertCell().textContent = losses;
          row.insertCell().textContent = stats.totalBets;
          row.insertCell().textContent = `${parseFloat(stats.winPercentage).toFixed(1)}%`;
          row.insertCell().textContent = stats.gold;
      });
    }, (error) => {
        console.error("Error fetching Firebase leaderboard: ", error);
        leaderboardTableBody.innerHTML = '<tr><td colspan="7">ไม่สามารถโหลดตารางอันดับจากเซิร์ฟเวอร์ได้</td></tr>';
        // Fallback to local leaderboard if Firebase fetch fails
        // displayLocalLeaderboard();
    });
  } else {
    console.warn("Firebase Database is not initialized or leaderboard table body not found. Displaying local leaderboard.");
    displayLocalLeaderboard(); // Fallback
  }
}
*/
// --- สิ้นสุดส่วน Firebase ---

function displayPodium() {
    podiumArea.style.display = 'block';
    const rankedRacers = [...racers].sort((a, b) => {
        if (a.rank === 0 && b.rank > 0) return 1;
        if (b.rank === 0 && a.rank > 0) return -1;
        if (a.rank === 0 && b.rank === 0) return 0;
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
    });
    for (let i = 1; i <= 3; i++) {
        if (podiumStands[i]) podiumStands[i].textContent = '-';
    }
    for (let i = 0; i < Math.min(rankedRacers.length, 3); i++) {
        const racer = rankedRacers[i];
        if (racer.rank > 0 && racer.rank <= 3) {
            if (podiumStands[racer.rank]) {
                podiumStands[racer.rank].textContent = racer.name;
            }
        }
    }
}

window.onload = () => {
    initializeRacers();
    setupPlayerNameModal();
    betSelection.innerHTML = '';
    racersData.forEach((racer, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = `นักวิ่ง ${index + 1} (${racer.name})`;
        betSelection.appendChild(option);
    });
    betSelection.value = "1";
    racers.forEach(racerInstance => {
        racerInstance.element.querySelector('.runner-name').textContent = racerInstance.name;
        racerInstance.element.querySelector('.runner-number').textContent = racerInstance.id.replace('racer','');
    });

    // --- MOJI: Initialize Firebase (คุณพิสิษฐ์: เอา comment ส่วนนี้ออกเมื่อใส่ Config ทั้งหมดถูกต้อง) ---
    /*
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.databaseURL !== "YOUR_DATABASE_URL") {
        try {
            firebase.initializeApp(firebaseConfig);
            window.database = firebase.database();
            console.log("Firebase Initialized Successfully!");
        } catch (e) {
            console.error("Error initializing Firebase: ", e);
            window.database = null;
        }
    } else {
        console.warn("Firebase SDK not loaded or firebaseConfig is placeholder/incomplete. Firebase features will be unavailable.");
        window.database = null;
    }
    */
    // --- สิ้นสุดการ Initialize Firebase ---
};

startButton.addEventListener('click', startGame);