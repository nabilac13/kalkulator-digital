let layar = document.getElementById("layar");

// Layar berupa <div>: teks panjang dibungkus ke baris baru dan hurufnya mengecil otomatis,
// jadi angka paling belakang tetap terlihat. Tetap bisa dipakai seperti input lewat layar.value.
(function () {
  const isi = document.createElement("span");
  layar.appendChild(isi);
  Object.defineProperty(layar, "value", {
    get() { return isi.textContent; },
    set(v) {
      isi.textContent = v;
      const n = String(v).length;
      layar.dataset.ukuran = n > 28 ? "xs" : n > 18 ? "s" : n > 11 ? "m" : "l";
      layar.scrollTop = layar.scrollHeight;
    }
  });
  layar.value = "";
})();

let modeSudut = "DEG"; // DEG = derajat, RAD = radian
function ubahSudut() {
  modeSudut = (modeSudut === "DEG") ? "RAD" : "DEG";
  document.getElementById("tombol-sudut").textContent = modeSudut;
}
let daftarRiwayat = document.getElementById("daftar-riwayat");
let riwayat = []; // Array untuk menampung riwayat

const ANGKA_AKHIR = /(\d+\.?\d*|\.\d+)$/;

function masukkanNilai(nilai) {
  if (layar.value === "Error") layar.value = "";
  layar.value += nilai;
}
function bersihkanLayar() { layar.value = ""; }
function hapusSatu() {
  if (layar.value === "Error") { layar.value = ""; return; }
  layar.value = layar.value.slice(0, -1);
}

// CE: hapus angka terakhir yang sedang diketik (beserta tanda %)
function hapusAngka() {
  if (layar.value === "Error") { layar.value = ""; return; }
  let baru = layar.value.replace(/[0-9.]+%*$/, "");
  layar.value = (baru === layar.value) ? layar.value.slice(0, -1) : baru;
}

// ± : ubah tanda angka terakhir
function ubahTanda() {
  let s = layar.value;
  if (s === "Error") return;
  let m = s.match(/\(-(\d+\.?\d*|\.\d+)\)$/);      // sudah berbentuk (-5) -> kembalikan
  if (m) { layar.value = s.slice(0, m.index) + m[1]; return; }
  m = s.match(/([(+×÷^])-(\d+\.?\d*|\.\d+)$/);   // sin(-30, 5+-3 -> hilangkan minus
  if (m) { layar.value = s.slice(0, m.index) + m[1] + m[2]; return; }
  m = s.match(ANGKA_AKHIR);
  if (!m) return;
  let awal = s.slice(0, m.index);
  if (awal === "") layar.value = "-" + m[1];
  else if (awal === "-") layar.value = m[1];
  else if (/[(+×÷^]$/.test(awal)) layar.value = awal + "-" + m[1];
  else layar.value = awal + "(-" + m[1] + ")";
}

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

/* ---------- Mesin hitung (tanpa eval) ----------
   Mendukung + - × ÷ ^ ( ) dan %.
   Persen: "200+10%" = 220 (10% dari 200), "50%" = 0.5, "200×10%" = 20 */
function tokenisasi(teks) {
  let token = [], i = 0;
  while (i < teks.length) {
    let c = teks[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < teks.length && /[0-9.]/.test(teks[j])) j++;
      let angka = Number(teks.slice(i, j));
      if (isNaN(angka)) throw "angka tidak valid";
      token.push(angka);
      i = j;
    } else if (/[a-z]/.test(c)) {
      let j = i;
      while (j < teks.length && /[a-z]/.test(teks[j])) j++;
      let nama = teks.slice(i, j);
      if (!["sin", "cos", "tan"].includes(nama)) throw "fungsi tidak dikenal";
      token.push(nama);
      i = j;
    } else if ("+-×÷^()%√".includes(c)) {
      token.push(c);
      i++;
    } else throw "karakter tidak dikenal";
  }
  // Perkalian tersirat: 2(3+4) -> 2×(3+4), (1+2)(3+4) -> (1+2)×(3+4)
  let hasil = [];
  token.forEach(x => {
    let sebelum = hasil[hasil.length - 1];
    let mulaiNilai = typeof x === "number" || x === "(" || x === "√" || x === "sin" || x === "cos" || x === "tan";
    let akhirNilai = typeof sebelum === "number" || sebelum === ")" || sebelum === "%";
    if (akhirNilai && mulaiNilai) hasil.push("×");
    hasil.push(x);
  });
  return hasil;
}

function hitung(teks) {
  let t = tokenisasi(teks.replace(/\//g, "÷")), p = 0;
  const intip = () => t[p];

  function ekspresi() {
    let kiri = suku();
    while (intip() === "+" || intip() === "-") {
      let op = t[p++];
      let mulai = p;
      let kanan = suku();
      // a + b%  ->  b% dari a
      let persenMurni = (p - mulai === 2 && typeof t[mulai] === "number" && t[mulai + 1] === "%");
      if (persenMurni) kanan = kiri * kanan;
      kiri = (op === "+") ? kiri + kanan : kiri - kanan;
    }
    return kiri;
  }
  function suku() {
    let kiri = tanda();
    while (intip() === "×" || intip() === "÷") {
      let op = t[p++];
      let kanan = tanda();
      if (op === "÷" && kanan === 0) throw "dibagi nol";
      kiri = (op === "×") ? kiri * kanan : kiri / kanan;
    }
    return kiri;
  }
  function tanda() {
    if (intip() === "-") { p++; return -tanda(); }
    if (intip() === "+") { p++; return tanda(); }
    return pangkat();
  }
  function pangkat() {
    let dasar = persen();
    if (intip() === "^") { p++; return Math.pow(dasar, tanda()); }
    return dasar;
  }
  function persen() {
    let n = utama();
    while (intip() === "%") { p++; n = n / 100; }
    return n;
  }
  function utama() {
    let x = intip();
    if (typeof x === "number") { p++; return x; }
    if (x === "(") {
      p++;
      let v = ekspresi();
      if (intip() === ")") p++;                    // kurung penutup boleh dilewat di akhir
      else if (p < t.length) throw "kurung tidak lengkap";
      return v;
    }
    if (x === "√" || x === "sin" || x === "cos" || x === "tan") {
      p++;
      let a = utama();                             // argumen: angka atau (...)
      if (x === "√") {
        if (a < 0) throw "akar negatif";
        return Math.sqrt(a);
      }
      let rad = (modeSudut === "DEG") ? a * Math.PI / 180 : a;   // derajat atau radian
      if (x === "tan" && Math.abs(Math.cos(rad)) < 1e-12) throw "tan tak terdefinisi";
      let f = x === "sin" ? Math.sin : x === "cos" ? Math.cos : Math.tan;
      return parseFloat(f(rad).toFixed(10));
    }
    throw "sintaks salah";
  }

  let hasil = ekspresi();
  if (p < t.length) throw "sintaks salah";
  if (!isFinite(hasil)) throw "hasil tidak valid";
  return hasil;
}

function bulatkan(x) { return parseFloat(x.toPrecision(15)); }

function hitungHasil() {
  let op = layar.value;
  if (op === "" || op === "Error") return;
  try {
    let hasil = bulatkan(hitung(op));
    let kurangTutup = (op.match(/\(/g) || []).length - (op.match(/\)/g) || []).length;
    if (kurangTutup > 0) op += ")".repeat(kurangTutup);   // tampilkan kurung lengkap di riwayat
    if (/sin|cos|tan/.test(op)) op += " [" + modeSudut + "]";   // catat satuan sudut di riwayat
    layar.value = String(hasil);
    catatRiwayat(op, hasil);
  } catch (error) { layar.value = "Error"; }
}

// Tombol sin, cos, tan, √ hanya menuliskan rumusnya di layar; hasil baru muncul setelah "="
function hitungIlmiah(tipe) {
  const teks = { sin: "sin(", cos: "cos(", tan: "tan(", sqrt: "√(" };
  if (teks[tipe]) masukkanNilai(teks[tipe]);
}

function toggleRiwayat() {
  document.querySelector(".kalkulator").classList.toggle("mode-riwayat");
}

// Fitur Keyboard Listener
document.addEventListener("keydown", function(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  let key = event.key;
  if (key === "*" || key === "x" || key === "X") { event.preventDefault(); masukkanNilai("×"); }
  else if (key === "/") { event.preventDefault(); masukkanNilai("÷"); } // cegah Quick Find browser
  else if (/^[0-9+\-.()^%]$/.test(key)) { event.preventDefault(); masukkanNilai(key); }
  else if (key === "Enter") { event.preventDefault(); hitungHasil(); }
  else if (key === "Backspace") hapusSatu();
  else if (key === "Escape") bersihkanLayar();
});