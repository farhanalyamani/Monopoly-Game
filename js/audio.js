// Pake file MP3 dari laptop/komputer lu sendiri (JAUH LEBIH AMAN)
const sfxDice = new Audio('../audio/dadu.mp3');
const sfxStep = new Audio('../audio/jalan.mp3');
const sfxMoney = new Audio('../audio/koin.mp3'); 

// Atur volume biar ga kekencengan
sfxStep.volume = 0.5; 
sfxDice.volume = 1.0;
sfxMoney.volume = 0.8;

// Objek untuk dipanggil dari file main.js
const sound = {
    playDice: () => {
        // Cek dulu apakah filenya beneran ada/bisa diplay biar ga error merah lagi
        if(sfxDice.readyState) {
            sfxDice.currentTime = 0;
            sfxDice.play().catch(e => console.log("Tunggu bentar blay, browser belum ngijinin play suara"));
        }
    },
    playStep: () => {
        if(sfxStep.readyState) {
            sfxStep.currentTime = 0;
            sfxStep.play().catch(e => console.log(e));
        }
    },
    playMoney: () => {
        if(sfxMoney.readyState) {
            sfxMoney.currentTime = 0;
            sfxMoney.play().catch(e => console.log(e));
        }
    }
};