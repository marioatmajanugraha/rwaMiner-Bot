import axios from 'axios';
import fs from 'fs';
import chalk from 'chalk';
import CFonts from 'cfonts';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import readline from 'readline-sync';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Banner dengan animasi
CFonts.say('Airdrop 888', {
  font: 'block',
  align: 'center',
  colors: ['cyan'],
  transition: true,
  space: false,
  maxLength: '0',
  env: 'node'
});
console.log(chalk.cyan('Script coded by - @balveerxyz || Auto PlayGame RWA Miner\n'));

const useProxy = readline.question('Mau menggunakan proxy? (y/n): ').toLowerCase() === 'y';
let proxies = [];
if (useProxy) {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(Boolean);
  } catch (e) {
    console.log(chalk.red('proxy.txt tidak ditemukan!'));
    process.exit(1);
  }
}

let wallets = [];
try {
  wallets = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
} catch (e) {
  console.log(chalk.red('wallets.json tidak ditemukan atau formatnya salah!'));
  process.exit(1);
}

const apiUrl = 'https://event.goldstation.io/api-v2';

async function loginAndGetToken(wallet, proxy) {
  try {
    console.log(chalk.cyan(`Melakukan login untuk wallet: ${wallet.address}`));
    const agent = useProxy ? (proxy.startsWith('http') ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy)) : undefined;
    const uuid = uuidv4();
    const nonce = crypto.randomBytes(32).toString('hex');

    const signer = new ethers.Wallet(wallet.privateKey);
    const signature = await signer.signMessage(nonce);

    const loginResponse = await axios.post(`${apiUrl}/user/login`, {
      address: wallet.address,
      clickPower: 0.039,
      nonce: nonce,
      signature: signature,
      uuid: uuid,
      walletCode: 1,
      privateKey: wallet.privateKey
    }, {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json',
        'x-api-key': '03ad7ea4-2b75'
      }
    });

    if (loginResponse.data.success && loginResponse.data.data.token) {
      const newToken = loginResponse.data.data.token;
      console.log(chalk.green(`Berhasil mendapatkan token baru untuk wallet ${wallet.address}`));
      fs.appendFileSync('tokens.txt', `${newToken}\n`);
      return newToken;
    }
  } catch (error) {
    console.log(chalk.red(`Gagal login untuk wallet ${wallet.address}: ${error.message}`));
  }
  return null;
}

async function playGame(token, proxy, wallet) {
  try {
    const agent = useProxy ? (proxy.startsWith('http') ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy)) : undefined;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'x-api-key': '03ad7ea4-2b75'
    };

    while (true) {
      const clickResponse = await axios.post(`${apiUrl}/user/click`, { clickPower: 560 }, { headers, httpsAgent: agent });
      if (clickResponse.data.success) {
        console.log(chalk.green(`Klik berhasil! ${clickResponse.data.data.current}/${clickResponse.data.data.dailyMax}`));
        if (clickResponse.data.data.current >= clickResponse.data.data.dailyMax) {
          console.log(chalk.blue('Completed, The Daily Tap resets at midnight.'));
          break;
        }
      }
    }
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
  }
}

(async () => {
  console.log(chalk.green('Bot berjalan secara batch... Tekan CTRL + C untuk berhenti.'));

  const batchSize = 100;
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);
    console.log(chalk.yellow(`Memproses batch ${i / batchSize + 1} dengan ${batch.length} wallet...`));

    await Promise.all(batch.map(async (wallet) => {
      const proxy = useProxy ? proxies[Math.floor(Math.random() * proxies.length)] : '';
      console.log(chalk.magenta(`Menggunakan proxy: ${proxy || 'Tanpa Proxy'}`));

      const newToken = await loginAndGetToken(wallet, proxy);
      if (newToken) {
        await playGame(newToken, proxy, wallet);
      }
    }));

    console.log(chalk.blue(`Batch ${i / batchSize + 1} selesai. Melanjutkan ke batch berikutnya...`));
  }

  console.log(chalk.green('Semua batch selesai diproses!'));
})();
