// 👉 FITUR BARU: FUNGSI PENGGANTI ALERT & CONFIRM BAWAAN BROWSER
function showCustomDialog(title, message, isConfirm, onConfirmCallback) {
    const modal = document.getElementById('customDialogModal');
    document.getElementById('dialogTitle').innerText = title;
    document.getElementById('dialogMessage').innerText = message;
    
    const okBtn = document.getElementById('dialogOkBtn');
    const cancelBtn = document.getElementById('dialogCancelBtn');
    
    cancelBtn.style.display = isConfirm ? 'block' : 'none'; // Kalo alert doang, tombol batal ilang
    
    okBtn.onclick = () => {
        modal.style.display = 'none';
        if (onConfirmCallback) onConfirmCallback();
    };
    
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    modal.style.display = 'flex';
}

// 👉 FITUR BARU: POP-UP UI BEBAS PARKIR (Dikelompokin per Komplek)
function showTeleportModal(player, domElements) {
    const modal = document.getElementById('teleportModal');
    const teleportList = document.getElementById('teleportList');
    const cancelBtn = document.getElementById('cancelTeleportBtn');
    teleportList.innerHTML = ''; 

    let destinations = spacesConfig.map((s, i) => ({...s, id: i})).filter(s => s.price !== null);
    let grouped = {};
    destinations.forEach(dest => {
        let groupName = dest.komplek ? `Komplek ${dest.komplek}` : `Fasilitas & Stasiun`;
        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(dest);
    });

    Object.keys(grouped).sort().forEach(groupName => {
        let divider = document.createElement('div');
        divider.style.gridColumn = 'span 2'; 
        divider.style.marginTop = '10px'; divider.style.paddingBottom = '5px'; divider.style.borderBottom = '2px dashed #3498db'; divider.style.color = '#3498db'; divider.style.fontWeight = 'bold'; divider.style.textAlign = 'left';
        divider.innerText = `📍 ${groupName}`;
        teleportList.appendChild(divider);

        grouped[groupName].forEach(dest => {
            let btn = document.createElement('button');
            btn.className = 'restart-btn';
            btn.style.padding = '10px'; btn.style.fontSize = '12px'; btn.style.background = dest.color; btn.style.color = '#fff'; btn.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'; btn.style.border = '2px solid rgba(255,255,255,0.2)';
            let ownerInfo = dest.owner === null ? "(Kosong)" : dest.owner === player.id ? "(Tanah Lu)" : "(Tanah Musuh)";
            btn.innerText = `${dest.name}\n${ownerInfo}`;

            btn.onclick = () => {
                modal.style.display = 'none';
                domElements.logText.innerText = `Melesat menuju ${dest.name} ✈️`;
                player.pos = dest.id;
                document.getElementById(`space-${dest.id}`).appendChild(player.el);
                
                // 👉 SINKRONISASI TELEPORT
                if (gameMode === 'online') roomRef.child('teleport').set({ pId: player.id, targetId: dest.id, ts: Date.now() });
                
                setTimeout(() => handleLanding(player, domElements), 500);
            };
            teleportList.appendChild(btn);
        });
    });

    cancelBtn.onclick = () => {
        modal.style.display = 'none';
        domElements.logText.innerText = `Gak jadi terbang, milih rebahan.`;
        showEndTurnBtn(domElements, false);
    };
    modal.style.display = 'flex';
}

// 👉 UPDATE: TAMPILIN & JUAL ASET (SINKRONISASI ONLINE & FIX BUG)
function showAssetModal(player, domElements, isForced = false) {
    const modal = document.getElementById('assetModal');
    const assetList = document.getElementById('assetList');
    const closeBtn = document.getElementById('closeAssetBtn');
    assetList.innerHTML = ''; 

    let myAssets = spacesConfig.filter(s => s.owner === player.id);

    if (myAssets.length === 0) {
        if (isForced && player.money < 0) {
            modal.style.display = 'none';
            checkBankrupt(player, domElements); 
            return;
        } else {
            assetList.innerHTML = '<p style="text-align:center; color:#e74c3c;">Lu belum punya tanah sama sekali blay! Kismin.</p>';
        }
    } else {
        let grouped = {};
        myAssets.forEach(space => {
            let groupName = space.komplek ? `Komplek ${space.komplek}` : `Fasilitas & Stasiun`;
            if (!grouped[groupName]) grouped[groupName] = [];
            grouped[groupName].push(space);
        });

        let sortedGroups = Object.keys(grouped).sort();

        sortedGroups.forEach(groupName => {
            let divider = document.createElement('div');
            divider.style.marginTop = '15px'; divider.style.paddingBottom = '5px'; divider.style.borderBottom = '2px dashed #9b59b6'; divider.style.color = '#9b59b6'; divider.style.fontWeight = 'bold';
            divider.innerText = `📍 ${groupName}`;
            assetList.appendChild(divider);

            grouped[groupName].forEach(space => {
                let totalModal = space.price + (space.level * space.housePrice);
                let jualRugi = Math.floor(totalModal / 2); 
                let statusBangunan = space.level === 0 ? "Tanah Kosong" : space.level === 5 ? "Hotel 🏨" : `${space.level} Rumah 🏠`;
                let dendaSekarang = space.rent[space.level]; 

                let assetItem = document.createElement('div');
                assetItem.style.background = '#353b48'; assetItem.style.padding = '10px'; assetItem.style.borderRadius = '8px'; assetItem.style.display = 'flex'; assetItem.style.justifyContent = 'space-between'; assetItem.style.alignItems = 'center';

                assetItem.innerHTML = `
                    <div>
                        <strong style="color:${space.color}; text-shadow: 1px 1px 1px #000;">${space.name}</strong><br>
                        <small style="color:#dcdde1;">Status: ${statusBangunan}</small><br>
                        <small style="color:#e84118; font-weight: bold;">Denda Musuh: ${formatRp(dendaSekarang)}</small>
                    </div>
                `;

                let jualBtn = document.createElement('button');
                jualBtn.innerText = `Jual\n(${formatRp(jualRugi)})`;
                jualBtn.style.background = '#e74c3c'; jualBtn.style.color = 'white'; jualBtn.style.border = 'none'; jualBtn.style.padding = '5px 10px'; jualBtn.style.borderRadius = '5px'; jualBtn.style.cursor = 'pointer'; jualBtn.style.fontSize = '12px';

                jualBtn.onclick = () => {
                    showCustomDialog(
                        `⚠️ Yakin Jual ${space.name}?`, 
                        `Harga Jual (Rugi 50%): ${formatRp(jualRugi)}\n\nTanah bakal disita Bank dan bangunan hangus!`, 
                        true, 
                        () => {
                            player.money += jualRugi; 
                            space.owner = null; 
                            space.level = 0; 
                            
                            let posIndex = spacesConfig.indexOf(space);
                            const spaceEl = document.getElementById(`space-${posIndex}`);
                            
                            // 👉 FIX BUG: Sapu bersih semua class tag & rumah pake querySelectorAll biar pasti ilang
                            let tags = spaceEl.querySelectorAll('.owner-tag'); 
                            tags.forEach(t => t.remove());
                            let indicators = spaceEl.querySelectorAll('.building-indicator'); 
                            indicators.forEach(i => i.remove());

                            updateUI(domElements);
                            if(typeof sound !== 'undefined') sound.playMoney(); 
                            domElements.logText.innerText = `Jual rugi! ${space.name} dilepas seharga ${formatRp(jualRugi)}.`;
                            
                            // 👉 SINKRONISASI: Laporin ke musuh kalo lu udah ngejual tanah ini
                            if (gameMode === 'online') {
                                roomRef.child('sellProperty').set({ spaceId: posIndex, sellerId: player.id, refund: jualRugi, ts: Date.now() });
                            }

                            showAssetModal(player, domElements, isForced);
                        }
                    );
                };
                assetItem.appendChild(jualBtn);
                assetList.appendChild(assetItem);
            });
        });
    }

    if (isForced) {
        closeBtn.innerText = "Selesai Gadai";
        closeBtn.style.background = "#e1b12c";
        closeBtn.onclick = () => {
            if (player.money < 0) {
                showCustomDialog("⚠️ Masih Ngutang!", `Utang lu masih ${formatRp(Math.abs(player.money))} blay!\nJual lagi aset lu yang lain!`, false);
            } else {
                modal.style.display = 'none';
                domElements.logText.innerText = `Fuh! Selamat dari kebangkrutan.`;
                showEndTurnBtn(domElements, false); 
            }
        };
    } else {
        closeBtn.innerText = "Tutup";
        closeBtn.style.background = "#7f8fa6";
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    modal.style.display = 'flex';
}

// 👉 UPDATE: CEK BANGKRUT (Pake Pop-Up Custom buat Peringatan)
function checkBankrupt(player, domElements) {
    if (player.money < 0) {
        let myAssets = spacesConfig.filter(s => s.owner === player.id);

        if (player.isBot) {
            myAssets.sort((a, b) => {
                let valA = a.price + (a.level * a.housePrice);
                let valB = b.price + (b.level * b.housePrice);
                return valA - valB;
            });

            for (let i = 0; i < myAssets.length; i++) {
                if (player.money >= 0) break; 
                let space = myAssets[i];
                let totalModal = space.price + (space.level * space.housePrice);
                let jualRugi = Math.floor(totalModal / 2);

                player.money += jualRugi;
                space.owner = null; 
                space.level = 0; 

                let posIndex = spacesConfig.indexOf(space);
                const spaceEl = document.getElementById(`space-${posIndex}`);
                let tag = spaceEl.querySelector('.owner-tag'); if(tag) tag.remove();
                let indicator = spaceEl.querySelector('.building-indicator'); if(indicator) indicator.remove();

                let prevText = domElements.logText.innerText;
                domElements.logText.innerText = `${prevText}\n🤖 Bot kepepet! Gadai ${space.name}.`;
                if(typeof sound !== 'undefined') sound.playMoney();
            }
        } else {
            if (myAssets.length > 0) {
                // PAKE POP-UP CUSTOM, GAK PAKE ALERT() LAGI
                showCustomDialog(
                    "⚠️ WADUH MINUS!", 
                    "Duit lu minus blay.\nLu harus gadai tanah dulu buat bayar utang!", 
                    false, 
                    () => {
                        // Kalo lu klik OK, pop-up Aset langsung kebuka paksa
                        showAssetModal(player, domElements, true); 
                    }
                );
                return true; 
            }
        }

        if (player.money < 0) {
            domElements.logText.innerHTML = `💀 <strong>GAME OVER!</strong> ${player.name} Bangkrut!`;
            domElements.buyBtn.style.display = 'none';
            domElements.endTurnBtn.style.display = 'none';
            domElements.rollBtn.style.display = 'none';
            gameOver = true;
            updateUI(domElements);

            const winnerName = player.id === 0 ? players[1].name : players[0].name;
            setTimeout(() => {
                const modal = document.getElementById('gameOverModal');
                document.getElementById('winnerTitle').innerText = `🎉 ${winnerName} MENANG! 🎉`;
                document.getElementById('loserText').innerText = `Yaaah... ${player.name} resmi jadi gembel!`;
                modal.style.display = 'flex'; 
            }, 1000);
            return true; 
        } else {
            updateUI(domElements);
            return false;
        }
    }
    return false; 
}

// Cek Syarat Komplek
function checkMonopoly(komplekId, playerId) {
    if(!komplekId) return false;
    const komplekSpaces = spacesConfig.filter(s => s.komplek === komplekId);
    return komplekSpaces.every(s => s.owner === playerId);
}

// Visual Bangunan
function updateBuildingUI(posIndex, level) {
    const spaceEl = document.getElementById(`space-${posIndex}`);
    let indicator = spaceEl.querySelector('.building-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'building-indicator';
        indicator.style.fontSize = '12px';
        indicator.style.marginTop = '2px';
        indicator.style.fontWeight = 'bold';
        indicator.style.textAlign = 'center';
        spaceEl.appendChild(indicator);
    }
    
    if (level === 5) {
        indicator.innerText = '🏨';
    } else if (level > 0) {
        indicator.innerText = '🏠'.repeat(level);
    }
}

// 👉 FITUR BARU: POP-UP UI BANGUN RUMAH & HOTEL
function offerBuilding(player, space, domElements) {
    // 👉 FIX BUG: Musuh dilarang ngebuka pop-up bangun rumah pas giliran kita!
    if (gameMode === 'online' && currentTurn !== myPlayerId) return;

    if (space.level === 5) {
        domElements.logText.innerText = `Udah HOTEL! Nunggu musuh nginjek 😈`;
        showEndTurnBtn(domElements, false);
        return;
    }
    if (space.level === 4 && !checkMonopoly(space.komplek, player.id)) {
        domElements.logText.innerText = `Syarat Hotel kurang (Komplek ${space.komplek} bolong).`;
        showEndTurnBtn(domElements, false);
        return;
    }

    const modal = document.getElementById('buildModal');
    const title = document.getElementById('buildTitle');
    const info = document.getElementById('buildInfo');
    const buttonsContainer = document.getElementById('buildButtons');
    const cancelBtn = document.getElementById('cancelBuildBtn');
    buttonsContainer.innerHTML = ''; 

    if (space.level < 4) {
        let maxBeli = 4 - space.level;
        document.getElementById('buildIcon').innerText = '🏠';
        title.innerText = `Bangun di ${space.name}`;
        info.innerHTML = `Harga 1 Rumah: <strong>${formatRp(space.housePrice)}</strong><br>Duit lu sekarang: <strong>${formatRp(player.money)}</strong>`;

        for (let i = 1; i <= maxBeli; i++) {
            let totalHarga = i * space.housePrice;
            let btn = document.createElement('button');
            btn.className = 'restart-btn';
            btn.style.padding = '10px 15px';
            btn.style.fontSize = '14px';

            if (player.money >= totalHarga) {
                btn.innerText = `Beli ${i} 🏠\n(${formatRp(totalHarga)})`;
                btn.onclick = () => {
                    player.money -= totalHarga;
                    space.level += i;
                    domElements.logText.innerText = `Mantap! Bangun ${i} rumah di ${space.name}.`;
                    updateBuildingUI(player.pos, space.level);
                    updateUI(domElements);
                    modal.style.display = 'none';
                    
                    // 👉 SINKRONISASI BANGUN RUMAH
                    if (gameMode === 'online') roomRef.child('buildProperty').set({ spaceId: player.pos, level: space.level, cost: totalHarga, ownerId: player.id, ts: Date.now() });
                    showEndTurnBtn(domElements, false);
                };
            } else {
                btn.innerText = `Beli ${i} 🏠\n(Duit Kurang)`;
                btn.style.background = '#7f8fa6';
                btn.disabled = true;
            }
            buttonsContainer.appendChild(btn);
        }
    } 
    else if (space.level === 4) {
        document.getElementById('buildIcon').innerText = '🏨';
        title.innerText = `🔥 Upgrade HOTEL di ${space.name} 🔥`;
        info.innerHTML = `Syarat terpenuhi!<br><br>Harga Hotel: <strong>${formatRp(space.housePrice)}</strong>`;

        let btn = document.createElement('button');
        btn.className = 'restart-btn';
        if (player.money >= space.housePrice) {
            btn.innerText = `Bikin HOTEL 🏨 (${formatRp(space.housePrice)})`;
            btn.style.background = '#e84118';
            btn.style.color = 'white';
            btn.onclick = () => {
                player.money -= space.housePrice;
                space.level = 5;
                domElements.logText.innerText = `🔥 GILA! Bikin HOTEL di ${space.name}!!`;
                updateBuildingUI(player.pos, space.level);
                updateUI(domElements);
                modal.style.display = 'none';

                // 👉 SINKRONISASI BIKIN HOTEL
                if (gameMode === 'online') roomRef.child('buildProperty').set({ spaceId: player.pos, level: space.level, cost: space.housePrice, ownerId: player.id, ts: Date.now() });
                showEndTurnBtn(domElements, false);
            };
        } else {
            btn.innerText = `Bikin HOTEL (Duit Kurang)`;
            btn.style.background = '#7f8fa6';
            btn.disabled = true;
        }
        buttonsContainer.appendChild(btn);
    }

    cancelBtn.onclick = () => {
        domElements.logText.innerText = `Nyantai aja dulu. Duit disimpen 😎`;
        modal.style.display = 'none';
        showEndTurnBtn(domElements, false); 
    };
    modal.style.display = 'flex'; 
}

function handleLanding(player, domElements) {
    const space = spacesConfig[player.pos];
    const otherPlayer = players[currentTurn === 0 ? 1 : 0];
    
    setTimeout(() => {
        // --- MASUK PENJARA ---
        if (space.name.includes('Masuk Penjara')) {
            if (player.hasJailCard > 0) {
                player.hasJailCard--; 
                domElements.logText.innerText = `Kartu Bebas Penjara dipake! ${player.name} gajadi dipenjara.`;
                showEndTurnBtn(domElements, false);
            } else {
                domElements.logText.innerText = `WADUH! ${player.name} ditangkap! Masuk Penjara!`;
                player.pos = 10; player.inJail = true; player.jailTurns = 0;
                document.getElementById('space-10').appendChild(player.el);
                hasRolledDouble = false; 
                if (!checkBankrupt(player, domElements)) showEndTurnBtn(domElements, false);
            }
        }
        // --- BEBAS PARKIR ---
        else if (space.name.includes('Bebas Parkir')) {
            domElements.logText.innerText = `🛫 BEBAS PARKIR! Bersiap terbang...`;
            setTimeout(() => {
                if (player.isBot) {
                    let targetIndex = -1;
                    let unowned = spacesConfig.map((s, i) => ({...s, id: i})).filter(s => s.price && s.owner === null);
                    if (unowned.length > 0) { unowned.sort((a, b) => b.price - a.price); targetIndex = unowned[0].id; } else { targetIndex = 0; }
                    
                    if (targetIndex !== -1 && targetIndex !== 20) { 
                        domElements.logText.innerText = `Melesat menuju ${spacesConfig[targetIndex].name} ✈️`;
                        player.pos = targetIndex;
                        document.getElementById(`space-${targetIndex}`).appendChild(player.el);
                        setTimeout(() => handleLanding(player, domElements), 500);
                    } else { showEndTurnBtn(domElements, false); }
                } else {
                    // 👉 FIX TELEPORT BARENGAN
                    if (gameMode !== 'online' || currentTurn === myPlayerId) showTeleportModal(player, domElements);
                    else domElements.logText.innerText = `Nunggu musuh milih negara tujuan...`;
                }
            }, 800);
        }
        // --- PAJAK ---
        else if (space.name.includes('Pajak')) {
            player.money -= 20000;
            domElements.logText.innerText = `Kena Pajak blay! Bayar Rp 20.000.`;
            if (!checkBankrupt(player, domElements)) showEndTurnBtn(domElements, false);
        } 
        // --- KARTU GACHA ---
        else if (space.name.includes('Kesempatan') || space.name.includes('Dana Umum')) {
            // 👉 FIX GACHA KARTU BIAR 100% SAMA DI DUA LAYAR
            if (gameMode === 'online') {
                if (currentTurn === myPlayerId) {
                    let randomCardIndex = Math.floor(Math.random() * cards.length);
                    roomRef.child('gachaCard').set({ index: randomCardIndex, pId: currentTurn, spaceName: space.name, ts: Date.now() });
                } else {
                    domElements.logText.innerText = `Nunggu musuh narik kartu...`;
                }
            } else {
                let randomCardIndex = Math.floor(Math.random() * cards.length);
                executeGachaCard(player, randomCardIndex, space.name, domElements);
            }
        }
        // --- LOGIKA TANAH ---
        else if (space.price) {
            // 1. TANAH KOSONG
            if (space.owner === null) {
                if (player.isBot) {
                    // .. logika bot biarin kosong ga kepake online
                } 
                else {
                    domElements.logText.innerText = `${space.name} kosong. Beli? (${formatRp(space.price)})`;
                    showEndTurnBtn(domElements, true); 

                    domElements.buyBtn.onclick = () => {
                        if (player.money >= space.price) {
                            player.money -= space.price; 
                            space.owner = player.id;
                            const tag = document.createElement('div');
                            tag.classList.add('owner-tag', player.tagClass); 
                            tag.innerText = player.id === 0 ? 'P1' : 'P2';
                            document.getElementById(`space-${player.pos}`).appendChild(tag);
                            domElements.logText.innerText = `Sah! Beli ${space.name}.`;
                            domElements.buyBtn.style.display = 'none'; 
                            updateUI(domElements);
                            
                            // 👉 SINKRONISASI PAS BELI TANAH KE MUSUH
                            if (gameMode === 'online') roomRef.child('buyProperty').set({ spaceId: player.pos, ownerId: player.id, tagClass: player.tagClass, ts: Date.now() });
                            
                            showEndTurnBtn(domElements, false);
                        } else { 
                            showCustomDialog("⚠️ Bokek Blay!", "Duit lu kurang blay buat beli tanah ini!\nNabung dulu gih.", false);
                        }
                    };
                }
            }
            // 2. TANAH SENDIRI
            else if (space.owner === player.id) {
                if (player.isBot) { /* bot logic.. */ } else { offerBuilding(player, space, domElements); }
            } 
            // 3. TANAH LAWAN
            else {
                let denda = space.rent[space.level]; 
                player.money -= denda; otherPlayer.money += denda;
                let namaBangunan = space.level === 0 ? "Tanah Kosong" : space.level === 5 ? "🔥 HOTEL 🔥" : `${space.level} Rumah`;
                domElements.logText.innerText = `Apes! Nginjek ${namaBangunan} lawan. Bayar denda ${formatRp(denda)}!`;
                triggerShake(); showFloatingText(-denda); 
                if (!checkBankrupt(player, domElements)) showEndTurnBtn(domElements, false);
            }
        } 
        else {
            domElements.logText.innerText = `Mendarat di ${space.name}.`;
            showEndTurnBtn(domElements, false);
        }
        updateUI(domElements);
    }, 400);
}

// Tombol dan Giliran
function showEndTurnBtn(domElements, canBuy = false) {
    if (gameOver) return; 
    const player = players[currentTurn];

    // 👉 FIX BUG: Cuma munculin tombol Beli kalo emang ini HP yang punya giliran
    if (canBuy && !player.isBot && (gameMode !== 'online' || currentTurn === myPlayerId)) {
        domElements.buyBtn.style.display = 'block';
    } else {
        domElements.buyBtn.style.display = 'none';
    }

    isRolling = false; 
    
    if (hasRolledDouble && !player.inJail) {
        domElements.logText.innerText += ` | DADU DOBEL! Jalan lagi.`;
        if (player.isBot) { setTimeout(() => domElements.rollBtn.click(), 2000); } 
        else if (gameMode !== 'online' || currentTurn === myPlayerId) { 
            domElements.rollBtn.style.display = 'block'; 
        }
    } else {
        if (player.isBot) { setTimeout(() => domElements.endTurnBtn.click(), 2000); } 
        else if (gameMode !== 'online' || currentTurn === myPlayerId) { 
            domElements.endTurnBtn.style.display = 'block'; 
        }
    }
    resetDiceAnim(domElements);
}

function updateUI(domElements) {
    domElements.p1MoneyText.innerText = formatRp(players[0].money);
    domElements.p2MoneyText.innerText = formatRp(players[1].money);
}

function resetDiceAnim(domElements) {
    setTimeout(() => {
        domElements.cube1.style.transition = 'none'; domElements.cube2.style.transition = 'none';
        domElements.cube1.style.transform = `translateZ(-25px) rotateX(0deg) rotateY(0deg)`;
        domElements.cube2.style.transform = `translateZ(-25px) rotateX(0deg) rotateY(0deg)`;
        setTimeout(() => {
            domElements.cube1.style.transition = 'transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            domElements.cube2.style.transition = 'transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }, 50);
    }, 500);
}

// 👉 FUNGSI BARU BUAT BACA KARTU BARENGAN (Taruh di baris paling bawah rules.js)
function executeGachaCard(player, cardIndex, spaceName, domElements) {
    const randomCard = cards[cardIndex];
    domElements.logText.innerText = `Menarik kartu...`;

    const centerCard = document.getElementById('centerCard');
    const cardType = document.getElementById('cardType');
    const cardText = document.getElementById('cardText');

    if(spaceName.includes('Kesempatan')) {
        cardType.innerText = '❓ Kesempatan';
        centerCard.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)'; 
    } else {
        cardType.innerText = '📦 Dana Umum';
        centerCard.style.background = 'linear-gradient(135deg, #3498db, #2980b9)'; 
    }

    cardText.innerText = randomCard.text;
    centerCard.classList.add('show');
    
    setTimeout(() => {
        centerCard.classList.remove('show'); 
        setTimeout(() => {
            domElements.logText.innerText = `Efek: "${randomCard.text}"`;
            
            if (randomCard.action === "money") {
                player.money += randomCard.value;
                if (randomCard.value > 0 && typeof sound !== 'undefined') sound.playMoney();
                showFloatingText(randomCard.value); 
                if (randomCard.value < 0) triggerShake();
                if (!checkBankrupt(player, domElements)) showEndTurnBtn(domElements, false);
            } 
            else if (randomCard.action === "move") {
                player.pos = randomCard.target;
                document.getElementById(`space-${player.pos}`).appendChild(player.el);
                if (player.pos === 0) { 
                    player.money += 20000; 
                    if(typeof sound !== 'undefined') sound.playMoney(); 
                    showFloatingText(20000); 
                }
                setTimeout(() => handleLanding(player, domElements), 400); 
            }
            else if (randomCard.action === "step") {
                let newPos = player.pos + randomCard.value;
                if (newPos < 0) newPos = spacesConfig.length + newPos; 
                player.pos = newPos;
                document.getElementById(`space-${player.pos}`).appendChild(player.el);
                setTimeout(() => handleLanding(player, domElements), 400);
            }
            else if (randomCard.action === "jail") {
                player.pos = 10; player.inJail = true; player.jailTurns = 0;
                document.getElementById('space-10').appendChild(player.el);
                hasRolledDouble = false;
                if (!checkBankrupt(player, domElements)) showEndTurnBtn(domElements, false);
            }
            else if (randomCard.action === "keep_jail") {
                player.hasJailCard = (player.hasJailCard || 0) + 1; 
                showEndTurnBtn(domElements, false);
            }
            updateUI(domElements);
        }, 400); 
    }, 2500); 
}