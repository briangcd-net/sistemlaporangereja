// Gantikan dengan URL rasmi Google Apps Script anda
const API_URL = "https://script.google.com/macros/s/AKfycbx_qO1HMYbFlGPO8aEjQgc_39JVzX_eMKeNgTlbOS3vFdyiJeWjzVXiMrQQ-lh_5VDV/exec";

// FUNGSI BERHUBUNG DENGAN API GOOGLE
async function panggilAPI(action, data) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...data })
    });
    return await response.json();
  } catch (error) { throw new Error("Ralat pelayan: " + error.message); }
}

// PEMBOLEH UBAH GLOBAL
var cartaJabatan = null, cartaBelanja = null, muatPertamaKali = true;
var senaraiLaporanGlobal = [], senaraiTahunUnik = []; 
var KATA_LALUAN_DISAHKAN = "", SESI_PERANAN = "", SESI_CAWANGAN = "";
var INDEX_SEDANG_DIBUKA = null, MODAL_BUTIRAN = null, MODAL_KOMPILASI = null, MODAL_EDIT = null;

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('sidebarCollapse').addEventListener('click', function() { document.getElementById('sidebar').classList.toggle('active'); });
  if(document.getElementById('modalButiran')) MODAL_BUTIRAN = new bootstrap.Modal(document.getElementById('modalButiran'));
  if(document.getElementById('modalKompilasi')) MODAL_KOMPILASI = new bootstrap.Modal(document.getElementById('modalKompilasi'));
  if(document.getElementById('modalEdit')) MODAL_EDIT = new bootstrap.Modal(document.getElementById('modalEdit'));
});

function tukarTab(tabId, element) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('d-none'));
  document.getElementById(tabId).classList.remove('d-none');
  document.querySelectorAll('#sidebar ul li').forEach(el => el.classList.remove('active'));
  if (element) element.parentElement.classList.add('active');
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
  window.scrollTo(0, 0);
}

function semakCawanganLain(selectElement) {
  var kotakLain = document.getElementById("cawanganLain");
  if (selectElement.value === "Lain-lain") { kotakLain.classList.remove("d-none"); kotakLain.required = true; } 
  else { kotakLain.classList.add("d-none"); kotakLain.required = false; kotakLain.value = ""; }
}

function hadkanGambar(input) { if (input.files.length > 6) { alert("Maksimum 6 gambar sahaja."); input.value = ""; } }

function hantarForm(e) {
  e.preventDefault();
  var btn = document.getElementById('btnSubmit'), fileInput = document.getElementById('gambarInput');
  btn.disabled = true; btn.innerText = 'Sedang Memproses...';
  var nilaiCawangan = (e.target.cawangan.value === "Lain-lain") ? document.getElementById("cawanganLain").value : e.target.cawangan.value;
  
  var formObj = { cawangan: nilaiCawangan, tarikh: e.target.tarikh.value, namaAktiviti: e.target.namaAktiviti.value, jabatan: e.target.jabatan.value, ringkasan: e.target.ringkasan.value, kelebihan: e.target.kelebihan.value, kekurangan: e.target.kekurangan.value, penambahbaikan: e.target.penambahbaikan.value, kehadiranDewasa: e.target.kehadiranDewasa.value, kehadiranKanak: e.target.kehadiranKanak.value, kehadiranPertama: e.target.kehadiranPertama.value, belanjawan: e.target.belanjawan.value, perbelanjaan: e.target.perbelanjaan.value, dilaporkanOleh: e.target.dilaporkanOleh.value, imageFiles: [] };
  
  var files = fileInput.files;
  if (files && files.length > 0) {
    var readCount = 0;
    for (var i = 0; i < files.length; i++) {
      (function(file) {
        var reader = new FileReader();
        reader.onload = function(evt) { formObj.imageFiles.push({ name: file.name, data: evt.target.result }); readCount++; if (readCount === files.length) prosesHantar(formObj); };
        reader.readAsDataURL(file);
      })(files[i]);
    }
  } else { prosesHantar(formObj); }
}

async function prosesHantar(formObj) {
  var btn = document.getElementById('btnSubmit'), alertBox = document.getElementById('alertBox');
  try {
    const res = await panggilAPI("simpanLaporan", { formObj: formObj });
    if(res.status === "error") throw new Error(res.message);
    alertBox.className = 'alert alert-success'; alertBox.innerText = res.message;
    document.getElementById('laporanForm').reset();
    var kotakLain = document.getElementById("cawanganLain"); if(kotakLain) { kotakLain.classList.add("d-none"); kotakLain.required = false; }
  } catch(err) { alertBox.className = 'alert alert-danger'; alertBox.innerText = 'Ralat: ' + err.message; }
  btn.disabled = false; btn.innerText = 'Hantar Laporan'; window.scrollTo(0, 0);
}

async function prosesLogMasuk() {
  var pass = document.getElementById("inputPassword").value, btn = document.getElementById("btnLogMasuk");
  btn.innerText = "Menyemak..."; btn.disabled = true;
  try {
    const sesi = await panggilAPI("logMasuk", { password: pass });
    if (sesi && sesi.sah) {
      KATA_LALUAN_DISAHKAN = pass; SESI_PERANAN = sesi.peranan; SESI_CAWANGAN = sesi.cawangan;
      document.getElementById("loginSection").classList.add("d-none"); document.getElementById("dashboardSection").classList.remove("d-none"); document.getElementById("menuLogKeluar").classList.remove("d-none");
      
      if (SESI_PERANAN === "SUPER_ADMIN") { document.getElementById("labelPeranan").innerText = "Super Admin"; document.getElementById("ruangKawalanUtama").classList.remove("d-none"); document.getElementById("ruangKompilasi").classList.remove("d-none"); } 
      else if (SESI_PERANAN === "ADMIN_CAWANGAN") { document.getElementById("labelPeranan").innerText = "Admin Cawangan (" + SESI_CAWANGAN + ")"; document.getElementById("ruangKawalanUtama").classList.add("d-none"); } 
      else { document.getElementById("labelPeranan").innerText = "Mod Paparan Sahaja"; document.getElementById("ruangKawalanUtama").classList.remove("d-none"); document.getElementById("ruangKompilasi").classList.add("d-none"); }
      tarikDataDariPelayan(SESI_CAWANGAN === "Semua" ? "Semua" : SESI_CAWANGAN);
    } else { throw new Error("Kata laluan tidak sah."); }
  } catch(e) { document.getElementById("mesejRalat").classList.remove("d-none"); }
  btn.innerText = "Log Masuk"; btn.disabled = false;
}

function logKeluar() {
  KATA_LALUAN_DISAHKAN = ""; SESI_PERANAN = ""; SESI_CAWANGAN = ""; senaraiLaporanGlobal = [];
  document.getElementById("inputPassword").value = ""; document.getElementById("dashboardSection").classList.add("d-none");
  document.getElementById("loginSection").classList.remove("d-none"); document.getElementById("menuLogKeluar").classList.add("d-none");
  document.getElementById("mesejRalat").classList.add("d-none"); window.scrollTo(0, 0);
}

async function kemaskiniFilter() { tarikDataDariPelayan(document.getElementById("filterCawangan").value); }

async function tarikDataDariPelayan(caw) {
  try { const data = await panggilAPI("dapatkanData", { cawangan: caw, password: KATA_LALUAN_DISAHKAN }); binaGraf(data); } catch(e) { alert(e.message); }
}

function binaGraf(data) {
  if(!data) return;
  senaraiLaporanGlobal = data.senaraiLaporan || [];
  var setTahun = new Set();
  senaraiLaporanGlobal.forEach(function(rep) { if(rep.tarikh) { var thn = rep.tarikh.split("/")[2] || rep.tarikh.split("-")[0]; if(thn && thn.length === 4) setTahun.add(thn); } });
  senaraiTahunUnik = Array.from(setTahun).sort().reverse();

  if (muatPertamaKali) {
    var menuCawangan = document.getElementById("filterCawangan"), menuKompCaw = document.getElementById("kompCawangan");
    menuCawangan.innerHTML = '<option value="Semua">Semua Cawangan</option>';
    if (SESI_PERANAN === "SUPER_ADMIN") menuKompCaw.innerHTML = '<option value="Semua">Semua Cawangan</option>'; else menuKompCaw.innerHTML = '';
    for (var i = 0; i < data.senaraiCawangan.length; i++) {
      var caw = data.senaraiCawangan[i]; menuCawangan.innerHTML += `<option value="${caw}">${caw}</option>`;
      if (SESI_PERANAN === "SUPER_ADMIN" || caw === SESI_CAWANGAN) menuKompCaw.innerHTML += `<option value="${caw}">${caw}</option>`;
    }
    muatPertamaKali = false;
  }
  document.getElementById("totalLaporan").innerText = data.jumlahLaporan; document.getElementById("totalKehadiran").innerText = data.jumlahKehadiran; document.getElementById("totalBelanja").innerText = "RM " + data.jumlahPerbelanjaan.toFixed(2);
  if (cartaJabatan) cartaJabatan.destroy(); if (cartaBelanja) cartaBelanja.destroy();
  if (Object.keys(data.jabatanData).length > 0) cartaJabatan = new Chart(document.getElementById('jabatanChart').getContext('2d'), { type: 'pie', data: { labels: Object.keys(data.jabatanData), datasets: [{ data: Object.values(data.jabatanData), backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#20c997'] }] } });
  if (data.namaAktivitiList.length > 0) cartaBelanja = new Chart(document.getElementById('belanjaChart').getContext('2d'), { type: 'bar', data: { labels: data.namaAktivitiList, datasets: [{ label: 'Perbelanjaan (RM)', data: data.perbelanjaanList, backgroundColor: '#dc3545' }] } });
  lukisJadual();
}

function lukisJadual() {
  var tbody = document.getElementById("jadualLaporanTbody"); tbody.innerHTML = "";
  if (senaraiLaporanGlobal.length === 0) { tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Tiada rekod</td></tr>"; return; }
  senaraiLaporanGlobal.forEach(function(rep, i) {
    var badgeStatus = (String(rep.status).trim() === "Telah Disahkan") ? `<span class="badge bg-success">Disahkan</span>` : `<span class="badge bg-warning text-dark">Belum Disahkan</span>`;
    var butangTindakan = `<button class="btn btn-sm btn-info text-white shadow-sm mb-1" onclick="bukaModal(${i})">Butiran</button>`;
    if (SESI_PERANAN === "SUPER_ADMIN") butangTindakan += ` <button class="btn btn-sm btn-success text-white shadow-sm mb-1" onclick="bukaModalEdit(${i})">Edit</button> <button class="btn btn-sm btn-danger text-white shadow-sm mb-1" onclick="padamLaporan(${i})">Padam</button>`;
    else if (SESI_PERANAN === "ADMIN_CAWANGAN") { if (String(rep.status).trim() !== "Telah Disahkan") butangTindakan += ` <button class="btn btn-sm btn-success text-white shadow-sm mb-1" onclick="bukaModalEdit(${i})">Edit</button>`; butangTindakan += ` <button class="btn btn-sm btn-warning text-dark shadow-sm mb-1" onclick="mohonPadam(${i})">Mohon Padam</button>`; }
    tbody.innerHTML += `<tr><td class="fw-bold">#${rep.idLaporan}</td><td>${rep.tarikh}</td><td class="text-primary fw-bold">${rep.namaAktiviti}</td><td>${rep.cawangan}</td><td>${badgeStatus}</td><td>${butangTindakan}</td></tr>`;
  });
}

function bukaModalKompilasi() {
  var menuTahun = document.getElementById("kompTahun"); menuTahun.innerHTML = "";
  if(senaraiTahunUnik.length === 0) { var t = new Date().getFullYear(); menuTahun.innerHTML = `<option value="${t}">${t}</option>`; } 
  else { senaraiTahunUnik.forEach(function(thn) { menuTahun.innerHTML += `<option value="${thn}">${thn}</option>`; }); }
  MODAL_KOMPILASI.show();
}

async function laksanakanKompilasi() {
  var caw = document.getElementById("kompCawangan").value, thn = document.getElementById("kompTahun").value, btn = document.getElementById("btnProsesKompilasi");
  btn.innerText = "Sedang Menjana..."; btn.disabled = true;
  try {
    const res = await panggilAPI("janaKompilasi", { cawangan: caw, tahun: thn, password: KATA_LALUAN_DISAHKAN });
    if(res.status === "error") throw new Error(res.message); alert(res); MODAL_KOMPILASI.hide();
  } catch(e) { alert("Ralat: " + e.message); }
  btn.innerText = "Jana & Hantar E-mel"; btn.disabled = false;
}

function bukaModal(index) {
  INDEX_SEDANG_DIBUKA = index; var rep = senaraiLaporanGlobal[index];
  document.getElementById("modIdLaporan").innerText = rep.idLaporan; document.getElementById("modAktiviti").innerText = rep.namaAktiviti; document.getElementById("modCawangan").innerText = rep.cawangan; document.getElementById("modTarikh").innerText = rep.tarikh; document.getElementById("modJabatan").innerText = rep.jabatan; document.getElementById("modPelapor").innerText = rep.pelapor; document.getElementById("modRingkasan").innerText = rep.ringkasan; document.getElementById("modKelebihan").innerText = rep.kelebihan; document.getElementById("modKekurangan").innerText = rep.kekurangan; document.getElementById("modPenambahbaikan").innerText = rep.penambahbaikan; document.getElementById("modDewasa").innerText = rep.hadirDewasa; document.getElementById("modKanak").innerText = rep.hadirKanak; document.getElementById("modPertama").innerText = rep.hadirPertama; document.getElementById("modBelanjawan").innerText = Number(rep.belanjawan).toFixed(2); document.getElementById("modPerbelanjaan").innerText = Number(rep.perbelanjaan).toFixed(2);
  var kp = document.getElementById("kotakPengesahan"), bs = document.getElementById("btnSahkanPopup");
  if (String(rep.status).trim() === "Telah Disahkan") { kp.className = "alert alert-success mb-3 text-center"; document.getElementById("modTeksStatus").innerText = "Telah Disahkan"; document.getElementById("modTeksWaktu").innerText = rep.tarikhSahkan; bs.classList.add("d-none"); } else { kp.className = "alert alert-warning mb-3 text-center"; document.getElementById("modTeksStatus").innerText = "Belum Disahkan"; document.getElementById("modTeksWaktu").innerText = "-"; if (SESI_PERANAN === "SUPER_ADMIN") bs.classList.remove("d-none"); else bs.classList.add("d-none"); }
  var divGambar = document.getElementById("modGambar"); divGambar.innerHTML = "";
  if (rep.gambar && rep.gambar.indexOf("Tiada Gambar") === -1) { rep.gambar.split(/\r?\n/).forEach(function(u) { var id = u.match(/[-\w]{25,}/); if(id) divGambar.innerHTML += `<div class="col-4 mb-2"><a target="_blank" href="${u}"><img src="https://drive.google.com/thumbnail?id=${id[0]}&sz=w800" class="img-fluid rounded border shadow-sm" style="height:120px; object-fit:cover;"></a></div>`; }); }
  MODAL_BUTIRAN.show();
}

async function laksanakanPengesahan() {
  if(confirm("Sahkan laporan ini? Fail PDF akan dijana.")) {
    document.getElementById("btnSahkanPopup").disabled = true;
    try {
      const res = await panggilAPI("sahkanLaporan", { nomborBaris: senaraiLaporanGlobal[INDEX_SEDANG_DIBUKA].nomborBaris, password: KATA_LALUAN_DISAHKAN });
      if(res.status === "error") throw new Error(res.message); alert(res); MODAL_BUTIRAN.hide(); kemaskiniFilter();
    } catch(e) { alert("Ralat: " + e.message); }
    document.getElementById("btnSahkanPopup").disabled = false;
  }
}

async function padamLaporan(i) {
  var r = senaraiLaporanGlobal[i];
  if(confirm("Padam Laporan #" + r.idLaporan + "?")) {
    try { const res = await panggilAPI("padamLaporan", { nomborBaris: r.nomborBaris, password: KATA_LALUAN_DISAHKAN }); alert(res); kemaskiniFilter(); } catch(e) { alert(e.message); }
  }
}

async function mohonPadam(i) {
  var r = senaraiLaporanGlobal[i], s = prompt("Sebab pemadaman:");
  if(s) { try { const res = await panggilAPI("mohonPadam", { nomborBaris: r.nomborBaris, password: KATA_LALUAN_DISAHKAN, sebab: s }); alert(res); } catch(e) { alert(e.message); } }
}

function bukaModalEdit(index) {
  var rep = senaraiLaporanGlobal[index];
  document.getElementById("editRow").value = rep.nomborBaris; document.getElementById("editModId").innerText = rep.idLaporan; document.getElementById("editTarikh").value = (rep.tarikh.indexOf("/") !== -1) ? rep.tarikh.split("/")[2] + "-" + rep.tarikh.split("/")[1] + "-" + rep.tarikh.split("/")[0] : rep.tarikh;
  document.getElementById("editAktiviti").value = rep.namaAktiviti; document.getElementById("editJabatan").value = rep.jabatan; document.getElementById("editRingkasan").value = rep.ringkasan; document.getElementById("editKelebihan").value = rep.kelebihan; document.getElementById("editKekurangan").value = rep.kekurangan; document.getElementById("editPenambahbaikan").value = rep.penambahbaikan; document.getElementById("editDewasa").value = rep.hadirDewasa; document.getElementById("editKanak").value = rep.hadirKanak; document.getElementById("editPertama").value = rep.hadirPertama; document.getElementById("editBelanjawan").value = rep.belanjawan; document.getElementById("editPerbelanjaan").value = rep.perbelanjaan; document.getElementById("editPelapor").value = rep.pelapor; MODAL_EDIT.show();
}

async function simpanKemaskiniLaporan() {
  var btn = document.getElementById("btnSimpanEdit"); btn.innerText = "Menyimpan..."; btn.disabled = true;
  var dataEdit = { nomborBaris: document.getElementById("editRow").value, idLaporan: document.getElementById("editModId").innerText, tarikh: document.getElementById("editTarikh").value, namaAktiviti: document.getElementById("editAktiviti").value, jabatan: document.getElementById("editJabatan").value, ringkasan: document.getElementById("editRingkasan").value, kelebihan: document.getElementById("editKelebihan").value, kekurangan: document.getElementById("editKekurangan").value, penambahbaikan: document.getElementById("editPenambahbaikan").value, hadirDewasa: document.getElementById("editDewasa").value, hadirKanak: document.getElementById("editKanak").value, hadirPertama: document.getElementById("editPertama").value, belanjawan: document.getElementById("editBelanjawan").value, perbelanjaan: document.getElementById("editPerbelanjaan").value, pelapor: document.getElementById("editPelapor").value };
  try {
    const res = await panggilAPI("kemaskiniLaporan", { dataEdit: dataEdit, password: KATA_LALUAN_DISAHKAN });
    if(res.status === "error") throw new Error(res.message); alert(res); MODAL_EDIT.hide(); kemaskiniFilter();
  } catch(e) { alert("Ralat: " + e.message); }
  btn.innerText = "Simpan Perubahan"; btn.disabled = false;
}
