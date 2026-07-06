// 👉 CONFIG DARI LU (Udah gua rapihin dan tambahin databaseURL)
const firebaseConfig = {
    apiKey: "AIzaSyC3CpoVxmYUR7c-jtIbrkdi50Mg6j6WKF4",
    authDomain: "monopoly-game-alyamani.firebaseapp.com",
    
    // ⚠️ PENTING: Lu harus pastiin URL ini bener! 
    // Liat di halaman Realtime Database lu, biasanya URL-nya kayak gini:
    databaseURL: "https://monopoly-game-alyamani-default-rtdb.asia-southeast1.firebasedatabase.app", 
    
    projectId: "monopoly-game-alyamani",
    storageBucket: "monopoly-game-alyamani.firebasestorage.app",
    messagingSenderId: "573823475178",
    appId: "1:573823475178:web:aae905cec42d960531e693"
};

// Nyalain Mesin Firebase-nya
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

console.log("🔥 Mesin Firebase sukses nyala blay!");