// 👉 VARIABEL GLOBAL BUAT NYIMPEN MODE GAME
let gameMode = 'local'; // Default awal

// 👉 EFEK LAYAR GETAR (SCREEN SHAKE)
function triggerShake() {
    const container = document.querySelector('.game-container');
    if(container) {
        container.classList.add('shake-screen');
        setTimeout(() => container.classList.remove('shake-screen'), 400);
    }
}

// 👉 EFEK DUIT MELAYANG (FLOATING TEXT)
function showFloatingText(amount) {
    const text = document.createElement('div');
    text.classList.add('floating-text');
    
    if (amount > 0) {
        text.innerText = `+ ${formatRp(amount)}`;
        text.style.color = '#2ecc71'; 
    } else {
        text.innerText = `${formatRp(amount)}`; 
        text.style.color = '#ff4757'; 
    }

    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1500);
}

// 👉 FUNGSI BUAT MILIH MENU DI LOBI
function selectMode(mode) {
    if (mode === 'online') {
        alert("Sabar blay! Mode Online (Mabar Room) masih dalam tahap pembangunan. Pilih mode AI atau Lokal dulu yak! 🛠️");
        return; // Batalin masuk game
    }

    // Simpen mode yang dipilih
    gameMode = mode;
    
    // 👉 INI OBATNYA: Ngatur otak Player 2 sesuai mode yang dipilih
    if (mode === 'ai') {
        players[1].isBot = true; // Player 2 jadi robot
        players[1].name = "Player 2 (Bot AI)";
        document.getElementById('log').innerText = "Game Dimulai! Mode: Player vs Bot AI. Giliran Player 1 (Lu).";
    } else if (mode === 'local') {
        players[1].isBot = false; // Robotnya dimatiin, dimainin manual
        players[1].name = "Player 2 (Temen lu)";
        document.getElementById('log').innerText = "Game Dimulai! Mode: Player vs Player (Lokal). Giliran Player 1.";
    }
    
    // Ngilangin lobi menu pake animasi fade out
    document.getElementById('mainMenu').classList.add('hide-menu');
    
    // Refresh UI biar nama player ganti kalo emang ada di layar
    if (typeof updateUI === "function" && typeof dom !== "undefined") {
        updateUI(dom);
    }
}
// ==========================================
// KODE LU YANG LAMA MENDEM DI BAWAHNYA SINI:
// ==========================================
const dom = {
    board: document.getElementById('board'),
    rollBtn: document.getElementById('rollDiceBtn'),
    buyBtn: document.getElementById('buyBtn'),
    endTurnBtn: document.getElementById('endTurnBtn'),
    payJailBtn: document.getElementById('payJailBtn'),
    waitJailBtn: document.getElementById('waitJailBtn'),
    assetBtn: document.getElementById('assetBtn'),
    cube1: document.getElementById('cube1'),
    cube2: document.getElementById('cube2'),
    p1MoneyText: document.getElementById('p1Money'),
    p2MoneyText: document.getElementById('p2Money'),
    turnText: document.getElementById('turnText'),
    logText: document.getElementById('log')
};

// Render Papan
spacesConfig.forEach((config, index) => {
    const space = document.createElement('div');
    space.classList.add('space');
    space.style.gridRow = config.row; space.style.gridColumn = config.col; space.id = `space-${index}`;
    
    if(index === 0) { 
        space.classList.add('start'); space.innerText = "START"; 
    } 
    else {
        let priceHtml = config.price ? `<div class="price-tag">${formatRp(config.price)}</div>` : '';
        let komplekHtml = config.komplek ? `KMPLK ${config.komplek}` : ''; 
        space.innerHTML = `
            <div class="color-bar" style="background-color: ${config.color}">${komplekHtml}</div>
            <div class="space-name">${config.name}</div>
            ${priceHtml}
        `;
    }
    dom.board.appendChild(space);
});

// Render Pion
players.forEach(p => {
    p.el = document.createElement('div');
    p.el.classList.add('player-pin', p.class);
    document.getElementById('space-0').appendChild(p.el);
});

// FUNGSI ANIMASI JALAN (Udah Di-Upgrade Jadi Parabola Mulus)
function startMoving(player, totalRoll) {
    let stepsTaken = 0; 
    let tempPos = player.pos;
    
    const moveInterval = setInterval(() => {
        // 1. Catet koordinat awal pion sebelum dipindah
        const oldRect = player.el.getBoundingClientRect();
        
        tempPos = (tempPos + 1) % spacesConfig.length;
        
        // 2. Pindahin pion ke kotak tujuan di dalam HTML
        document.getElementById(`space-${tempPos}`).appendChild(player.el);
        
        // 3. Catet koordinat baru pion setelah mendarat
        const newRect = player.el.getBoundingClientRect();
        
        // 4. Hitung selisih jarak piksel (X dan Y)
        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;

        // 5. Tembakin Animasi JS (Terbang dari koordinat lama ke baru)
        player.el.animate([
            { translate: `${deltaX}px ${deltaY}px` }, // Start di koordinat lama
            { translate: `${deltaX / 2}px ${deltaY / 2 - 35}px` }, // Puncak lompatan (naik 35px)
            { translate: `0px 0px` } // Mendarat mulus di koordinat baru
        ], {
            duration: 250,
            easing: 'ease-in-out'
        });

        stepsTaken++;

        // Bunyi langkah tiap mendarat
        if (typeof sound !== 'undefined') sound.playStep();

        // Lewat START dapet duit
        if (tempPos === 0) {
            player.money += 20000; updateUI(dom);
            if (typeof sound !== 'undefined') sound.playMoney();
            dom.logText.innerText = `Cair! ${player.name} lewat GO dapet Rp 20.000`;
            showFloatingText(20000); 
        }

        // Kalo langkahnya udah abis
        if (stepsTaken === totalRoll) {
            clearInterval(moveInterval);
            player.pos = tempPos;
            
            // Jeda dikit biar pionnya napak ke tanah dulu sebelum nge-trigger event
            setTimeout(() => handleLanding(player, dom), 50); 
        }
    }, 250); 
}

// Event Kocok Dadu
dom.rollBtn.addEventListener('click', () => {
    if (isRolling || gameOver) return; 
    isRolling = true; 
    dom.rollBtn.style.display = 'none';
    dom.buyBtn.style.display = 'none';
    
    const player = players[currentTurn];
    dom.logText.innerText = `${player.name} ngocok dadu...`;

    // Bunyi dadu
    sound.playDice();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    hasRolledDouble = (d1 === d2);
    const totalRoll = d1 + d2;

    dom.cube1.style.transform = `translateZ(-25px) rotateX(${diceRotations[d1].x + 1080}deg) rotateY(${diceRotations[d1].y + 1080}deg)`;
    dom.cube2.style.transform = `translateZ(-25px) rotateX(${diceRotations[d2].x + 1080}deg) rotateY(${diceRotations[d2].y + 1080}deg)`;

    setTimeout(() => {
        // --- LOGIKA KELUAR PENJARA ---
        if (player.inJail) {
            if (hasRolledDouble) {
                dom.logText.innerText = `Hoki! Dadu dobel, bebas penjara!`;
                player.inJail = false;
                player.jailTurns = 0;
                startMoving(player, totalRoll); 
            } else {
                player.jailTurns++;
                if (player.jailTurns >= 3) {
                    // BOT AI
                    if (player.isBot) {
                        if (player.money > 100000) {
                            player.money -= 50000;
                            player.inJail = false;
                            player.jailTurns = 0;
                            updateUI(dom);
                            sound.playMoney();
                            dom.logText.innerText = `🤖 Bot bayar denda Rp 50rb & jalan!`;
                            startMoving(player, totalRoll);
                        } else {
                            dom.logText.innerText = `🤖 Bot milih nginep penjara (Lagi bokek).`;
                            showEndTurnBtn(dom, false);
                        }
                    } 
                    // PLAYER MANUSIA (Pakai 2 Tombol Baru)
                    else {
                        dom.logText.innerText = `3x gagal dobel! Mau ngapain lu blay?`;
                        dom.payJailBtn.style.display = 'block';
                        dom.waitJailBtn.style.display = 'block';

                        dom.payJailBtn.onclick = () => {
                            dom.payJailBtn.style.display = 'none';
                            dom.waitJailBtn.style.display = 'none';
                            player.money -= 50000;
                            player.inJail = false;
                            player.jailTurns = 0;
                            updateUI(dom);
                            sound.playMoney(); // Efek suara bayar
                            dom.logText.innerText = `Bayar denda Rp 50.000 dan langsung jalan!`;
                            startMoving(player, totalRoll);
                        };

                        dom.waitJailBtn.onclick = () => {
                            dom.payJailBtn.style.display = 'none';
                            dom.waitJailBtn.style.display = 'none';
                            dom.logText.innerText = `Milih tetep nyantai di penjara...`;
                            showEndTurnBtn(dom, false);
                        };
                    }
                } else {
                    dom.logText.innerText = `Apes blay, dadu ga dobel. Sisa percobaan: ${3 - player.jailTurns}`;
                    showEndTurnBtn(dom, false);
                }
            }
        } else {
            // Kalau nggak di penjara, langsung jalan aja
            startMoving(player, totalRoll);
        }
    }, 1500); 
});

// Event Ganti Pemain
dom.endTurnBtn.addEventListener('click', () => {
    if (gameOver) return;
    dom.endTurnBtn.style.display = 'none';
    dom.buyBtn.style.display = 'none';
    currentTurn = currentTurn === 0 ? 1 : 0; 
    
    const nextPlayer = players[currentTurn];
    dom.turnText.innerText = nextPlayer.name;
    dom.turnText.className = currentTurn === 0 ? 'p1-color' : 'p2-color';
    
    if (nextPlayer.inJail) {
        dom.logText.innerText = `Giliran ${nextPlayer.name} (Lagi di Penjara).`;
    } else {
        dom.logText.innerText = `Giliran ${nextPlayer.name}.`;
    }
    
    if (nextPlayer.isBot) {
        setTimeout(() => {
            if (!gameOver) dom.rollBtn.click();
        }, 1500); 
    } else {
        dom.rollBtn.style.display = 'block';
    }
});

// 👉 FITUR BARU: Event Buka Modal Aset (Pake Custom Dialog kalo bukan gilirannya)
dom.assetBtn.addEventListener('click', () => {
    if (gameOver) return;
    const player = players[currentTurn];
    
    // Cuma bisa dibuka pas giliran Lu (Manusia)
    if (player.isBot) {
        // Ganti alert bawaan browser pake custom dialog kita
        showCustomDialog(
            "⚠️ Sabar Blay!", 
            "Ini lagi giliran Bot AI, lu ga bisa utak-atik aset sekarang.", 
            false
        );
        return;
    }
    
    showAssetModal(player, dom);
});