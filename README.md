# rwaMiner-Bot ⚡

Script ini digunakan untuk mengotomatiskan tugas di platform **GoldStation**, seperti daily check-in, klik maksimal, level-up, dan aksi chance (`open` / `purchase`).  
Dibuat untuk efisiensi dan kemudahan penggunaan dengan dukungan multi-akun dan proxy.

![GoldStation](https://via.placeholder.com/800x400.png?text=GoldStation+Bot) <!-- Ganti dengan gambar terkait jika ada -->

---

## 📌 Fitur

- ✅ **Auto Daily Check-in**: Klaim hadiah harian secara otomatis untuk semua akun.
- ⚡ **Max Click Automation**: Melakukan klik maksimal dalam satu request untuk hasil real-time.
- 🎯 **Level-Up**: Otomatis naik level saat accumulated power mencapai ambang batas (800.746).
- 🎁 **Chance Actions**: Mendukung aksi `open` dan `purchase` dengan laporan reward (misalnya, 1000 gold).
- 🔌 **Proxy Support**: Gunakan proxy dari `proxy.txt` untuk koneksi aman.
- 📊 **Real-Time Status**: Menampilkan level, power, dan status operasi dalam tabel interaktif.
- 🛠 **Multi-Account**: Mendukung banyak akun menggunakan cookies dari `cookies.txt`.
- ⏰ **Smart Delays**: Jeda 1 jam saat daily max tercapai, 10 menit untuk siklus berikutnya.

---

## 🚀 Cara Penggunaan

### 1. Clone Repository Ini
```bash
git clone https://github.com/marioatmajanugraha/rwaMiner-Bot.git
cd rwaMiner-Bot
```

### 2. Install Dependencies
```bash
npm install axios chalk cfonts cli-table3 http-proxy-agent socks-proxy-agent
```

### 3. Siapkan File Cookies

Buat file `cookies.txt` dan isi dengan string cookies untuk setiap akun, satu akun per baris. Contoh:
```
_ga=GA1.1.536226239.1740469567; auth_token=eyJhbGciOi...; stan.auth.token=0x0098...; wagmi.store=...
_ga=GA1.1.123456789.1740469567; auth_token=eyJhbGciOi...; stan.auth.token=0x1234...; wagmi.store=...
```

> 💡 Dapatkan cookies dari browser melalui *Developer Tools > Network > Headers > Cookie* setelah login ke GoldStation.

### 4. (Opsional) Siapkan Proxy

Jika ingin menggunakan proxy, buat file `proxy.txt` dengan format seperti ini:
```
http://username:password@host:port
socks5://username:password@host:port
```

### 5. Jalankan Script

```bash
node index.obf.js
```

### 6. Ikuti Instruksi

- Pilih apakah ingin menggunakan proxy (`y` untuk ya, `n` untuk tidak).
- Script akan berjalan otomatis, melakukan check-in, chance actions, klik maksimal, dan level-up untuk setiap akun.
- Status akan ditampilkan secara real-time dalam tabel interaktif.

---

## ⚠️ Disclaimer

Gunakan script ini dengan bijak dan sesuai aturan platform **GoldStation**.  
**Developer tidak bertanggung jawab atas penyalahgunaan atau banned akun.**

---

## 🤝 Kontribusi

Ingin berkontribusi?  
Silakan **fork repo ini** dan ajukan **pull request**!  
Kami terbuka untuk ide baru, perbaikan bug, atau optimalisasi script.

---

## 📞 Kontak

📬 Hubungi: [@balveerxyz](https://t.me/balveerxyz)  
📢 Join channel Telegram gratis: [t.me/airdroplocked](https://t.me/airdroplocked)
