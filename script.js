let layar = document.getElementById("layar");
let daftarRiwayat = document.getElementById("daftar-riwayat");
let riwayat = []; // Array untuk menampung riwayat

function masukkanNilai(nilai) { layar.value += nilai; }
function bersihkanLayar() { layar.value = ""; }
function hapusSatu() { layar.value = layar.value.slice(0, -1); }

function catatRiwayat(operasi, hasil) {
  riwayat.unshift(operasi + " = " + hasil); // Tambah ke awal array
  if (riwayat.length > 5) riwayat.pop();    // Batasi maksimal 5 data

  daftarRiwayat.innerHTML = "";
  riwayat.forEach(item => {
    let li = document.createElement("li");
    li.innerText = item;
    daftarRiwayat.appendChild(li);
  });
}

function hitungHasil() {
  try {
    let op = layar.value;
    let hasil = eval(op);
    layar.value = hasil;
    catatRiwayat(op, hasil);
  } catch (error) { layar.value = "Error"; }
}

function hitungIlmiah(tipe) {
  let nilai = parseFloat(layar.value);
  if (isNaN(nilai)) { layar.value = "Error"; return; }
  try {
    let hasil = 0;
    let op = tipe + "(" + nilai + ")";
    if (tipe === 'sqrt') {
      if (nilai < 0) throw "Negatif";
      hasil = Math.sqrt(nilai).toFixed(5);
    } else {
      let rad = nilai * (Math.PI / 180);
      if (tipe === 'sin') hasil = Math.sin(rad).toFixed(5);
      if (tipe === 'cos') hasil = Math.cos(rad).toFixed(5);
      if (tipe === 'tan') hasil = Math.tan(rad).toFixed(5);
    }
    layar.value = parseFloat(hasil); // hilangkan nol berlebih
    catatRiwayat(op, layar.value);
  } catch (e) { layar.value = "Error"; }
}

function toggleRiwayat() {
  document.querySelector(".panel-riwayat").classList.toggle("tampil");
}

// Fitur Keyboard Listener
document.addEventListener("keydown", function(event) {
  let key = event.key;
  if (/^[0-9+\-*/.]$/.test(key)) {
    event.preventDefault(); // cegah Quick Find browser pada tombol "/"
    masukkanNilai(key);
  }
  else if (key === "Enter") { event.preventDefault(); hitungHasil(); }
  else if (key === "Backspace") hapusSatu();
  else if (key === "Escape") bersihkanLayar();
});