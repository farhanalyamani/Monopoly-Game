// Variabel Status Game
let currentTurn = 0; 
let isRolling = false;
let hasRolledDouble = false;
let gameOver = false; 

const formatRp = (angka) => `Rp ${angka.toLocaleString('id-ID')}`;

const diceRotations = { 1: {x:0, y:0}, 2: {x:0, y:-90}, 3: {x:0, y:-180}, 4: {x:0, y:90}, 5: {x:-90, y:0}, 6: {x:90, y:0} };

// Data Kartu Gacha (Dana Umum & Kesempatan Classic Indo)
const cards = [
    // 💰 KARTU UANG MASUK
    { text: "Juara 2 Lomba Kecantikan. Dapet Rp 10.000", action: "money", value: 10000 },
    { text: "Warisan Cair! Dapet Rp 100.000", action: "money", value: 100000 },
    { text: "Bunga Bank Cair. Dapet Rp 25.000", action: "money", value: 25000 },
    { text: "Terima Uang Jasa. Dapet Rp 20.000", action: "money", value: 20000 },
    { text: "Menang Lotre! Dapet Rp 50.000", action: "money", value: 50000 },
    { text: "Kesalahan Bank, keuntungan di pihak lu! Dapet Rp 40.000", action: "money", value: 40000 },

    // 💸 KARTU UANG KELUAR
    { text: "Kena Tilang Polisi. Bayar Rp 15.000", action: "money", value: -15000 },
    { text: "Bayar SPP Anak. Rp 15.000", action: "money", value: -15000 },
    { text: "Bayar Pajak Jalan. Rp 20.000", action: "money", value: -20000 },
    { text: "Mabuk di Jalan, denda Rp 10.000", action: "money", value: -10000 },
    { text: "Biaya Rumah Sakit. Bayar Rp 30.000", action: "money", value: -30000 },

    // 🛫 KARTU PINDAH LOKASI
    { text: "Maju ke START. Ambil Gaji Rp 20.000", action: "move", target: 0 },
    { text: "Terciduk Polisi! Langsung Masuk Penjara!", action: "jail" },
    { text: "Jalan-jalan ke Indonesia 🇮🇩", action: "move", target: 1 }, // Kotak No 1 (Indonesia)
    { text: "Penerbangan VIP ke Bebas Parkir 🛫", action: "move", target: 20 }, // Kotak No 20 (Bebas Parkir)
    { text: "Mundur 3 Langkah!", action: "step", value: -3 },

    // 🃏 KARTU SPESIAL
    { text: "Kartu Bebas Penjara! (Disimpen otomatis buat jaga-jaga)", action: "keep_jail" }
];

// Data Player
let players = [
    { id: 0, name: "Player 1 (Lu)", pos: 0, money: 150000, class: 'pin-1', tagClass: 'bg-p1', isBot: false, inJail: false, jailTurns: 0 },
    { id: 1, name: "Player 2 (Bot AI)", pos: 0, money: 150000, class: 'pin-2', tagClass: 'bg-p2', isBot: true, inJail: false, jailTurns: 0 }
];

// Peta 40 Kotak dengan Data Komplek A-H
const spacesConfig = [
    { row: 11, col: 11, color: '#e84118', name: '🏁 START', price: null, owner: null },
    { row: 11, col: 10, color: '#8e44ad', name: '🇮🇩 Indonesia', price: 6000, owner: null, komplek: 'A' },
    { row: 11, col: 9, color: '#dfe6e9', name: '📦 Dana Umum', price: null, owner: null },
    { row: 11, col: 8, color: '#8e44ad', name: '🇲🇾 Malaysia', price: 6000, owner: null, komplek: 'A' },
    { row: 11, col: 7, color: '#dfe6e9', name: '💸 Pajak Jalan', price: null, owner: null },
    { row: 11, col: 6, color: '#2d3436', name: '✈️ Changi Airport', price: 20000, owner: null },
    { row: 11, col: 5, color: '#3498db', name: '🇸🇬 Singapore', price: 10000, owner: null, komplek: 'B' },
    { row: 11, col: 4, color: '#dfe6e9', name: '❓ Kesempatan', price: null, owner: null },
    { row: 11, col: 3, color: '#3498db', name: '🇭🇰 Hongkong', price: 10000, owner: null, komplek: 'B' },
    { row: 11, col: 2, color: '#3498db', name: '🇪🇬 Mesir', price: 12000, owner: null, komplek: 'B' },

    { row: 11, col: 1, color: '#ff9f43', name: '🚔 Penjara', price: null, owner: null },
    { row: 10, col: 1, color: '#e84393', name: '🇵🇭 Philipina', price: 14000, owner: null, komplek: 'C' },
    { row: 9, col: 1, color: '#b2bec3', name: '💡 Listrik', price: 15000, owner: null },
    { row: 8, col: 1, color: '#e84393', name: '🇹🇭 Thailand', price: 14000, owner: null, komplek: 'C' },
    { row: 7, col: 1, color: '#e84393', name: '🇻🇳 Vietnam', price: 16000, owner: null, komplek: 'C' },
    { row: 6, col: 1, color: '#2d3436', name: '🚌 Terminal Tokyo', price: 20000, owner: null },
    { row: 5, col: 1, color: '#e67e22', name: '🇯🇵 Jepang', price: 18000, owner: null, komplek: 'D' },
    { row: 4, col: 1, color: '#dfe6e9', name: '📦 Dana Umum', price: null, owner: null },
    { row: 3, col: 1, color: '#e67e22', name: '🇰🇷 Korea', price: 18000, owner: null, komplek: 'D' },
    { row: 2, col: 1, color: '#e67e22', name: '🇮🇳 India', price: 20000, owner: null, komplek: 'D' },

    { row: 1, col: 1, color: '#e84118', name: '🅿️ Bebas Parkir', price: null, owner: null },
    { row: 1, col: 2, color: '#e74c3c', name: '🇨🇳 China', price: 22000, owner: null, komplek: 'E' },
    { row: 1, col: 3, color: '#dfe6e9', name: '❓ Kesempatan', price: null, owner: null },
    { row: 1, col: 4, color: '#e74c3c', name: '🇮🇹 Italia', price: 22000, owner: null, komplek: 'E' },
    { row: 1, col: 5, color: '#e74c3c', name: '🇷🇺 Uni Soviet', price: 24000, owner: null, komplek: 'E' },
    { row: 1, col: 6, color: '#2d3436', name: '🚂 Stasiun London', price: 20000, owner: null },
    { row: 1, col: 7, color: '#f1c40f', name: '🇬🇧 Inggris', price: 26000, owner: null, komplek: 'F' },
    { row: 1, col: 8, color: '#f1c40f', name: '🇫🇷 Prancis', price: 26000, owner: null, komplek: 'F' },
    { row: 1, col: 9, color: '#b2bec3', name: '🚰 Air Minum', price: 15000, owner: null },
    { row: 1, col: 10, color: '#f1c40f', name: '🇳🇱 Belanda', price: 28000, owner: null, komplek: 'F' },

    { row: 1, col: 11, color: '#ff9f43', name: '🚨 Masuk Penjara', price: null, owner: null },
    { row: 2, col: 11, color: '#2ecc71', name: '🇨🇦 Kanada', price: 30000, owner: null, komplek: 'G' },
    { row: 3, col: 11, color: '#2ecc71', name: '🇺🇸 Amerika Serikat', price: 30000, owner: null, komplek: 'G' },
    { row: 4, col: 11, color: '#dfe6e9', name: '📦 Dana Umum', price: null, owner: null },
    { row: 5, col: 11, color: '#2ecc71', name: '🇧🇷 Brazil', price: 32000, owner: null, komplek: 'G' },
    { row: 6, col: 11, color: '#2d3436', name: '🚢 Pelabuhan Sydney', price: 20000, owner: null },
    { row: 7, col: 11, color: '#dfe6e9', name: '❓ Kesempatan', price: null, owner: null },
    { row: 8, col: 11, color: '#0984e3', name: '🇦🇺 Australia', price: 35000, owner: null, komplek: 'H' },
    { row: 9, col: 11, color: '#dfe6e9', name: '💸 Pajak Istimewa', price: null, owner: null },
    { row: 10, col: 11, color: '#0984e3', name: '🇿🇦 Afrika', price: 40000, owner: null, komplek: 'H' }
];

// OTOMATIS NGITUNG HARGA RUMAH & DENDA SEWA TINGKAT DEWA
spacesConfig.forEach(space => {
    if (space.price) {
        space.level = 0; // 0=Tanah, 1-4=Rumah, 5=Hotel
        space.housePrice = Math.floor(space.price * 0.5); // Harga 1 rumah = 50% harga tanah
        
        // Daftar Denda (Naik Drastis pas di Hotel!)
        space.rent = [
            Math.floor(space.price * 0.1),   // Lvl 0: Sewa Tanah (10%)
            Math.floor(space.price * 0.5),   // Lvl 1: 1 Rumah (50%)
            Math.floor(space.price * 1.5),   // Lvl 2: 2 Rumah (150%)
            Math.floor(space.price * 3.0),   // Lvl 3: 3 Rumah (300%)
            Math.floor(space.price * 5.0),   // Lvl 4: 4 Rumah (500%)
            Math.floor(space.price * 15.0)   // Lvl 5: HOTEL (1500% alias GILA-GILAAN!)
        ];
    }
});