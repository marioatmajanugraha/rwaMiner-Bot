# RWA Miner Bot

Script ini adalah bot otomatis untuk memainkan game di platform RWA menggunakan wallet kripto. Dibuat oleh **@balveerxyz**, bot ini mendukung penggunaan proxy dan berjalan secara batch untuk mengoptimalkan proses mining.

## 🚀 Fitur
- **Login Otomatis**: Menggunakan private key wallet untuk menghasilkan tanda tangan digital.
- **Proxy Support**: Bisa menggunakan proxy HTTP/SOCKS untuk keamanan tambahan.
- **Batch Processing**: Mengelola banyak wallet sekaligus dalam satu sesi.
- **Auto Click**: Mengotomatiskan klik hingga mencapai batas harian.

## New Update 
- **Auto Relogin**: Relog for all wallets

## 📂 Struktur File
```
.
├── autoGame.js          # Skrip utama bot
├── Task.mjs             # Skrip Auto Complete Task
├── wallets.json         # File berisi daftar wallet
├── proxy.txt            # (Opsional) Daftar proxy
├── tokens.txt           # Token yang berhasil login
```

## ⚙️ Persiapan
1. **Install Dependensi**:
```bash
npm install axios ethers chalk cfonts readline-sync https-proxy-agent socks-proxy-agent uuid crypto
```

2. **Buat File Wallets** (`wallets.json`):
```json
[
  {
    "address": "0xAlamatWallet",
    "privateKey": "PrivateKeyWallet"
  }
]
```

3. **(Opsional) Tambahkan Proxy** (`proxy.txt`):
```
http://user:pass@host:port
socks5://host:port
```

## 🏁 Menjalankan Bot
Jalankan AutoGame perintah berikut:
```bash
node autoGame.mjs
```
Jalankan Task perintah berikut:
```bash
node Task.mjs
```
Ikuti instruksi yang muncul di terminal.

## 🛠️ Troubleshooting
- **403 Forbidden**: Periksa API key, private key, atau koneksi proxy.
- **wallets.json error**: Pastikan format JSON valid dan kunci cocok dengan wallet.
- **API tidak merespons**: Cek apakah server API masih aktif atau coba tanpa proxy.

## 📝 Lisensi
MIT License.

---
*Dibuat dengan ❤️ oleh Airdrop 888.*

Kalau ada yang kurang jelas, langsung saja buka issue di repo ini! 🚀

---

## 📞 Kontak
Jika ada pertanyaan, hubungi: [@balveerxyz](https://t.me/balveerxyz)

Join channel Telegram: [Airdrop 888](https://t.me/airdroplocked)


