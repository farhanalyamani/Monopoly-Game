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
    // Kalo milih online, jangan masuk game, tapi buka pop-up lobi
    if (mode === 'online') {
        document.getElementById('onlineLobbyModal').style.display = 'flex';
        return; 
    }

    // Simpen mode yang dipilih (Lokal / AI)
    gameMode = mode;
    
    // Ngatur otak Player 2 sesuai mode yang dipilih
    if (mode === 'ai') {
        players[1].isBot = true; 
        players[1].name = "Player 2 (Bot AI)";
        document.getElementById('log').innerText = "Game Dimulai! Mode: Player vs Bot AI. Giliran Player 1 (Lu).";
    } else if (mode === 'local') {
        players[1].isBot = false; 
        players[1].name = "Player 2 (Temen lu)";
        document.getElementById('log').innerText = "Game Dimulai! Mode: Player vs Player (Lokal). Giliran Player 1.";
    }
    
    // Ngilangin lobi menu pake animasi fade out
    document.getElementById('mainMenu').classList.add('hide-menu');
    
    // Refresh UI
    if (typeof updateUI === "function" && typeof dom !== "undefined") {
        updateUI(dom);
    }
}

// 👉 EVENT BUAT TUTUP POP-UP LOBI ONLINE
document.getElementById('cancelOnlineBtn').addEventListener('click', () => {
    document.getElementById('onlineLobbyModal').style.display = 'none';
});

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

    // 👉 KUNCI ONLINE: Kalo bukan giliran lu, tombol dilarang dipencet
    if (gameMode === 'online' && currentTurn !== myPlayerId) {
        showCustomDialog("⚠️ Sabar Blay!", "Belum giliran lu ngocok dadu!", false);
        return;
    }

    isRolling = true; 
    dom.rollBtn.style.display = 'none';
    dom.buyBtn.style.display = 'none';
    
    const player = players[currentTurn];
    dom.logText.innerText = `${player.name} ngocok dadu...`;

    if(typeof sound !== 'undefined') sound.playDice();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    hasRolledDouble = (d1 === d2);
    const totalRoll = d1 + d2;

    // 👉 SINKRONISASI: Lapor ke Firebase lu dapet angka berapa
    if (gameMode === 'online') {
        roomRef.child('lastRoll').set({
            pId: myPlayerId, d1: d1, d2: d2, timestamp: Date.now()
        });
    }

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

    // 👉 KUNCI ONLINE: Biar lu ga bisa iseng nyolong turn musuh
    if (gameMode === 'online' && currentTurn !== myPlayerId) return;

    dom.endTurnBtn.style.display = 'none';
    dom.buyBtn.style.display = 'none';
    currentTurn = currentTurn === 0 ? 1 : 0; 
    
    // 👉 SINKRONISASI: Laporin ganti giliran ke HP musuh
    if (gameMode === 'online') {
        roomRef.child('turn').set(currentTurn);
    }

    const nextPlayer = players[currentTurn];
    dom.turnText.innerText = nextPlayer.name;
    dom.turnText.className = currentTurn === 0 ? 'p1-color' : 'p2-color';
    dom.logText.innerText = nextPlayer.inJail ? `Giliran ${nextPlayer.name} (Lagi di Penjara).` : `Giliran ${nextPlayer.name}.`;
    
    if (nextPlayer.isBot) {
        setTimeout(() => { if (!gameOver) dom.rollBtn.click(); }, 1500); 
    } else {
        // Cuma munculin tombol dadu kalo ini main lokal, atau kalo ini giliran lu di mode online
        if (gameMode !== 'online' || currentTurn === myPlayerId) {
            dom.rollBtn.style.display = 'block';
        }
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

// ==========================================
// LOGIKA MABAR ONLINE (FIREBASE)
// ==========================================
let myRoomCode = '';
let myPlayerId = 0; // 0 buat Host (Bandar), 1 buat Guest (Penantang)
let roomRef = null;

// 👉 1. FUNGSI BANDAR (BIKIN ROOM) DENGAN PELACAK ERROR
document.getElementById('createRoomBtn').addEventListener('click', async () => {
    const btn = document.getElementById('createRoomBtn');
    btn.innerText = "Nyiapin Lapak...";
    btn.disabled = true;

    try {
        // Generate Kode Room Acak (5 Karakter)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        myRoomCode = '';
        for (let i = 0; i < 5; i++) myRoomCode += chars.charAt(Math.floor(Math.random() * chars.length));

        roomRef = db.ref('rooms/' + myRoomCode);
        
        // Pake Promise.race biar kalo Firebase bengong lebih dari 5 detik, langsung divonis gagal (ga ngegantung)
        await Promise.race([
            roomRef.set({
                status: 'waiting', 
                turn: 0, 
                players: {
                    0: { name: "Player 1 (Lu)", ready: true },
                    1: { name: "Player 2 (Musuh)", ready: false }
                }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout! Firebase ga ngerespon. Cek lagi Realtime Database lu udah di-Create apa belum.")), 5000))
        ]);

        // Kalo sukses nembus Firebase, set lu sebagai Player 1 (Host)
        myPlayerId = 0; 
        gameMode = 'online';
        players[1].isBot = false; 

        // Ubah Tampilan Pop-Up jadi Ruang Tunggu
        const modalBox = document.querySelector('#onlineLobbyModal .modal-box');
        modalBox.style.borderColor = '#0984e3';
        modalBox.innerHTML = `
            <h2 style="color: #0984e3; margin-bottom: 10px;">Lapak Udah Buka!</h2>
            <p style="color: #dcdde1; font-size: 14px;">Kasih kode ini ke musuh lu:</p>
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; font-size: 30px; font-weight: bold; letter-spacing: 5px; color: #f1c40f; margin-bottom: 20px;">
                ${myRoomCode}
            </div>
            <p style="color: #2ecc71; font-size: 14px; margin-bottom: 20px; font-weight: bold;">⏳ Menunggu musuh join...</p>
            <button onclick="window.location.reload()" class="restart-btn" style="background: #e74c3c; color: white; width: 100%; font-size: 14px;">Tutup Lapak</button>
        `;

        // Pasang CCTV buat mantau musuh
        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.status === 'playing') {
                roomRef.off(); 
                document.getElementById('onlineLobbyModal').style.display = 'none';
                document.getElementById('mainMenu').classList.add('hide-menu');
                document.getElementById('log').innerText = `🔥 Musuh berhasil masuk! Lu main sebagai Bandar (P1).`;
                if (typeof updateUI === "function") updateUI(dom);
                // 👉 PANGGIL MESIN CCTV DISINI
                setupOnlineCCTV();
            }
        });

    } catch (error) {
        // Kalo gagal, munculin alert error-nya dan hidupin tombolnya lagi
        console.error("🔥 ERROR FIREBASE:", error);
        alert("Gagal bikin room blay!\nAlasan: " + error.message);
        btn.innerText = "Bikin Room Baru";
        btn.disabled = false;
    }
});

// 👉 2. FUNGSI PENANTANG (JOIN ROOM)
document.getElementById('joinRoomBtn').addEventListener('click', async () => {
    const btn = document.getElementById('joinRoomBtn');
    const codeInput = document.getElementById('roomCodeInput').value.trim().toUpperCase();

    // Kalo kolom kodenya kosong tapi nekat diklik
    if (!codeInput) {
        alert("Masukin kodenya dulu blay!");
        return;
    }

    // Ubah teks tombol biar kelihatan mikir
    btn.innerText = "Nyari Lapak...";
    btn.disabled = true;

    try {
        // Nyari lapak di Firebase berdasarkan kode yang diketik
        const tempRef = db.ref('rooms/' + codeInput);
        const snapshot = await tempRef.once('value');

        if (snapshot.exists()) {
            const roomData = snapshot.val();
            
            // Cek apakah room masih nunggu musuh (belum penuh)
            if (roomData.status === 'waiting') {
                // Berhasil nemu lapak!
                myRoomCode = codeInput;
                myPlayerId = 1; // Lu jadi Player 2 (Guest)
                gameMode = 'online';
                players[1].isBot = false; // Matiin otak bot
                roomRef = tempRef; // Set global roomRef

                // 👉 INI KUNCI SINKRONISASINYA:
                // Ngubah status room jadi 'playing' biar HP si Bandar (Host) otomatis masuk ke game
                await roomRef.update({
                    status: 'playing',
                    'players/1/ready': true
                });

                // Tutup semua pop-up lobi di HP lu (Guest)
                document.getElementById('onlineLobbyModal').style.display = 'none';
                document.getElementById('mainMenu').classList.add('hide-menu');
                
                document.getElementById('log').innerText = `🔥 Berhasil masuk lapak! Lu main sebagai Penantang (P2). Giliran P1 jalan duluan.`;
                if (typeof updateUI === "function") updateUI(dom);
                // 👉 PANGGIL MESIN CCTV DISINI
                 setupOnlineCCTV();

            } else {
                alert("Waduh blay, room-nya udah penuh atau udah mulai main!");
            }
        } else {
            alert("Kodenya salah blay! Lapak ga ditemuin.");
        }
    } catch (error) {
        console.error("🔥 ERROR JOIN ROOM:", error);
        alert("Gagal join room blay!\nAlasan: " + error.message);
    }

    // Balikin tombol kayak semula kalo lu gagal join
    btn.innerText = "Join Room";
    btn.disabled = false;
});

// ==========================================
// MESIN CCTV SINKRONISASI ONLINE
// ==========================================
function setupOnlineCCTV() {
    // 1. Umpetin tombol dadu di awal kalo bukan giliran kita
    if (currentTurn !== myPlayerId) dom.rollBtn.style.display = 'none';

    // 2. Pantau kalo musuh ngocok dadu
    roomRef.child('lastRoll').on('value', (snapshot) => {
        const data = snapshot.val();
        // Kalo ada data dan yang ngocok itu musuh (bukan kita)
        if (data && data.pId !== myPlayerId) {
            isRolling = true;
            dom.rollBtn.style.display = 'none';
            dom.buyBtn.style.display = 'none';
            
            const enemyPlayer = players[data.pId];
            dom.logText.innerText = `Musuh ngocok dadu...`;
            if(typeof sound !== 'undefined') sound.playDice();

            hasRolledDouble = (data.d1 === data.d2);
            const totalRoll = data.d1 + data.d2;

            // Animasikan dadu di layar lu pake angka dari musuh
            dom.cube1.style.transform = `translateZ(-25px) rotateX(${diceRotations[data.d1].x + 1080}deg) rotateY(${diceRotations[data.d1].y + 1080}deg)`;
            dom.cube2.style.transform = `translateZ(-25px) rotateX(${diceRotations[data.d2].x + 1080}deg) rotateY(${diceRotations[data.d2].y + 1080}deg)`;

            setTimeout(() => { startMoving(enemyPlayer, totalRoll); }, 1500);
        }
    });

    // 3. Pantau kalo musuh selesai giliran (End Turn)
    roomRef.child('turn').on('value', (snapshot) => {
        const newTurn = snapshot.val();
        if (newTurn !== null && newTurn !== currentTurn) {
            currentTurn = newTurn;
            const nextPlayer = players[currentTurn];
            
            dom.turnText.innerText = nextPlayer.name;
            dom.turnText.className = currentTurn === 0 ? 'p1-color' : 'p2-color';
            dom.logText.innerText = nextPlayer.inJail ? `Giliran ${nextPlayer.name} (Lagi di Penjara).` : `Giliran ${nextPlayer.name}.`;

            // Kalo gilirannya pindah ke kita, baru munculin tombol dadunya
            if (currentTurn === myPlayerId) dom.rollBtn.style.display = 'block';
            else dom.rollBtn.style.display = 'none';
        }
    });
}