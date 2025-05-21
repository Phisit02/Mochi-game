// MOJI กำลังคิดว่า: เข้าถึงองค์ประกอบ HTML ที่จำเป็นทั้งหมดก่อน
const racersData = [
    { id: 'racer1', name: "นักวิ่งแดง", color: '#e74c3c' },
    { id: 'racer2', name: "นักวิ่งฟ้า", color: '#3498db' },
    { id: 'racer3', name: "นักวิ่งเขียว", color: '#2ecc71' },
    { id: 'racer4', name: "นักวิ่งเหลือง", color: '#f1c40f' },
    { id: 'racer5', name: "นักวิ่งม่วง", color: '#9b59b6' } // แก้ไข quote ที่ชื่อนักวิ่งม่วงแล้ว
];

let racers = []; // จะถูก populate ใน initializeRacers

const startButton = document.getElementById('startButton');
const statusDisplay = document.getElementById('status');
const track = document.getElementById('track');
const finishLineElement = document.getElementById('finishLine');

// Player Name Modal Elements
const playerNameModal = document.getElementById('playerNameModal');
const playerNameInput = document.getElementById('playerNameInput');
const submitPlayerNameButton = document.getElementById('submitPlayerName');
const currentPlayerNameDisplay = document.getElementById('currentPlayerNameDisplay');

// Betting System Elements
const playerGoldDisplay = document.getElementById('playerGold');
const betSelection = document.getElementById('betSelection');

// Podium Elements
const podiumArea = document.getElementById('podium-area');
const podiumStands = {
    1: podiumArea.querySelector('#pos1 .runner-name-podium'),
    2: podiumArea.querySelector('#pos2 .runner-name-podium'),
    3: podiumArea.querySelector('#pos3 .runner-name-podium')
};

// Player Record Table Elements
const recordsArea = document.getElementById('records-area');
const playerRecordsTableBody = document.getElementById('playerRecordsTableBody');

let raceInterval;
let gameInProgress = false;
let nextRank = 1;

// Game State
let currentPlayerName = "ผู้เล่น";
let playerGold = 5000;
const BET_AMOUNT = 500;
const WIN_REWARD = 1000;

// Player records (for current session)
let playerStats = {
    name: "ผู้เล่น",
    wins: 0,
    totalBets: 0,
    gold: 5000
};

// MOJI กำลังคิดว่า: ต้องมีฟังก์ชันสำหรับจัดการชื่อผู้เล่น
function setupPlayerNameModal() {
    playerNameModal.style.display = 'flex';
    startButton.disabled = true;
    betSelection.disabled = true;
    recordsArea.style.display = 'none';

    submitPlayerNameButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
            currentPlayerName = name;
            playerStats.name = currentPlayerName;
            // playerStats.gold = playerGold; // ตั้งทองเริ่มต้นในสถิติ (ย้ายไปทำตอน initializeGameUI หรือเมื่อเริ่มเกมครั้งแรก)
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
    
    // ตั้งค่าทองและสถิติเริ่มต้นสำหรับผู้เล่นใหม่ (ถ้ายังไม่มี)
    // หรือโหลดจาก localStorage หากมีการ implement
    playerStats.gold = playerGold; // ใช้ playerGold ปัจจุบัน (อาจจะมาจาก default หรือ localStorage)
    playerGoldDisplay.textContent = playerStats.gold;


    startButton.disabled = false; // <--- จุดสำคัญ: เปิดการใช้งานปุ่ม
    betSelection.disabled = false; // <--- จุดสำคัญ: เปิดการใช้งานตัวเลือก
    recordsArea.style.display = 'block';
    updatePlayerRecordDisplay();
}

function updateBettingDisplay() {
    playerGoldDisplay.textContent = playerStats.gold; // อัปเดตจาก playerStats
}

function updatePlayerRecordDisplay() {
    if (!playerRecordsTableBody) return;
    playerRecordsTableBody.innerHTML = '';

    const row = playerRecordsTableBody.insertRow();
    const winPercentage = playerStats.totalBets > 0 ? ((playerStats.wins / playerStats.totalBets) * 100).toFixed(1) : "0.0";
    const losses = playerStats.totalBets - playerStats.wins;

    row.insertCell().textContent = playerStats.name;
    row.insertCell().textContent = playerStats.wins;
    row.insertCell().textContent = losses;
    row.insertCell().textContent = playerStats.totalBets;
    row.insertCell().textContent = `${winPercentage}%`;
    row.insertCell().textContent = playerStats.gold;
}

function startGame() {
    if (gameInProgress) return;

    if (playerStats.gold < BET_AMOUNT) {
        statusDisplay.textContent = "ทองไม่พอสำหรับเดิมพันค่ะ!";
        return;
    }

    playerStats.gold -= BET_AMOUNT;
    playerStats.totalBets++;
    updateBettingDisplay();
    updatePlayerRecordDisplay();

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
            if (!racer.finished) {
                moveRacer(racer);
            }
            if(racer.finished) finishersCount++;
        });

        checkFinishersAndProcess(); // ไม่ต้องส่ง playerBetOnRacerId ไปแล้ว เพราะเช็คตอนจบ

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
            if (racer.rank === 1) {
                console.log(`${racer.name} เข้าเส้นชัยเป็นอันดับ 1!`);
            }
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
            playerStats.gold += WIN_REWARD;
            playerStats.wins++;
        } else {
            finalMessage += ` คุณ <b>${currentPlayerName}</b> ทายผิด (ทาย ${racers.find(r=>r.id === playerBetOnRacerId).name}) ไม่ได้รับทองเพิ่มค่ะ`;
        }
    } else {
        finalMessage += " ไม่พบผู้ชนะที่ชัดเจนในการเดิมพันรอบนี้ค่ะ";
    }
    // playerStats.gold ได้ถูกอัปเดตไปแล้วในเงื่อนไขข้างบน

    statusDisplay.innerHTML = finalMessage;
    updateBettingDisplay();
    updatePlayerRecordDisplay();

    startButton.disabled = false;
    betSelection.disabled = false;
    startButton.textContent = "แข่งอีกครั้ง!";

    displayPodium();
}

function displayPodium() {
    podiumArea.style.display = 'block';
    const rankedRacers = [...racers].sort((a, b) => {
        if (a.rank === 0 && b.rank > 0) return 1;
        if (b.rank === 0 && a.rank > 0) return -1;
        if (a.rank === 0 && b.rank === 0) return 0; // ทั้งคู่ไม่จบ ให้เรียงตามตำแหน่งปัจจุบันก็ได้ถ้าต้องการ
        if (a.rank === 0) return 1; // a ไม่จบ b จบ
        if (b.rank === 0) return -1; // b ไม่จบ a จบ
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
    setupPlayerNameModal(); // เรียกเพื่อให้ modal แสดงขึ้น และตั้งค่า initial disable ให้ปุ่ม
    
    // Populate betSelection dropdown
    betSelection.innerHTML = ''; // Clear existing options
    racersData.forEach((racer, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // Value should be 1-based index for selection
        option.textContent = `นักวิ่ง ${index + 1} (${racer.name})`;
        betSelection.appendChild(option);
    });
    betSelection.value = "1"; // Set default selection

    // การตั้งค่าชื่อนักวิ่งบนตัวนักวิ่งเอง ควรทำหลังจาก initializeRacers
    racers.forEach(racerInstance => { // ใช้ racers ที่เป็น instance ของ DOM elements
        racerInstance.element.querySelector('.runner-name').textContent = racerInstance.name;
        racerInstance.element.querySelector('.runner-number').textContent = racerInstance.id.replace('racer','');
    });
};

startButton.addEventListener('click', startGame);