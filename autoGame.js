import axios from 'axios';
import fs from 'fs';
import chalk from 'chalk';
import CFonts from 'cfonts';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import readline from 'readline-sync';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import ora from 'ora';

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

// Prompt penggunaan proxy
const useProxy = readline.question('Mau menggunakan proxy? (y/n): ').toLowerCase() === 'y';
let proxies = [];

if (useProxy) {
  try {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(Boolean);
  } catch (e) {
    console.log(chalk.red('proxies.txt tidak ditemukan!'));
    process.exit(1);
  }
}

// Ambil wallet dari walletGame.json
let wallets = [];
try {
  wallets = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
} catch (e) {
  console.log(chalk.red('walletGame.json tidak ditemukan atau formatnya salah!'));
  process.exit(1);
}

const apiUrl = 'https://event.goldstation.io/api-v2';

// Fungsi untuk memilih proxy
async function getProxyAgent(proxies, index = 0) {
  if (index >= proxies.length) {
    console.log(chalk.yellow('No more valid proxies. Continuing without proxy...'));
    return null;
  }
  const proxy = proxies[index];
  console.log(chalk.magenta(`Menggunakan proxy: ${proxy}`));
  return proxy.startsWith('http') ? new HttpsProxyAgent(proxy) : new SocksProxyAgent(proxy);
}

// Fungsi retry dengan proxy switching
async function requestWithRetry(config, proxies, workingProxyAgent = null, proxyIndex = 0, delay = 2000) {
  const spinner = ora('Mengirim permintaan...').start();
  config.httpsAgent = workingProxyAgent || (await getProxyAgent(proxies, proxyIndex));

  try {
    const response = await axios(config);
    spinner.succeed(chalk.green('Permintaan berhasil'));
    return { response, proxyAgent: config.httpsAgent };
  } catch (err) {
    spinner.fail(chalk.yellow(`Permintaan gagal: ${err.message}. Mencoba proxy lain...`));
    if (proxyIndex + 1 >= proxies.length) {
      console.log(chalk.yellow('Semua proxy gagal. Mencoba tanpa proxy...'));
      config.httpsAgent = null;
      const response = await axios(config);
      return { response, proxyAgent: null };
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return requestWithRetry(config, proxies, null, proxyIndex + 1, delay);
  }
}

// Fungsi delay acak
function randomDelay() {
  const delay = Math.floor(Math.random() * 4000) + 1000; // 1-5 detik
  console.log(chalk.blue(`Menunggu ${delay}ms...`));
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Fungsi untuk mengambil nonce dari server
async function getNonce(proxies, proxyAgent) {
  const spinner = ora(chalk.blue('Mengambil nonce dari server...')).start();
  const config = {
    method: 'GET',
    url: `${apiUrl}/public/nonce`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'x-api-key': '03ad7ea4-2b75',
      'Origin': 'https://event.goldstation.io',
      'Referer': 'https://event.goldstation.io/mine'
    },
    httpsAgent: proxyAgent,
    timeout: 30000
  };

  try {
    const { response, proxyAgent: newProxyAgent } = await requestWithRetry(config, proxies, proxyAgent);
    if (response.data.success && response.data.data.nonce) {
      spinner.succeed(chalk.green('Nonce berhasil diambil'));
      return { nonce: response.data.data.nonce, proxyAgent: newProxyAgent };
    } else {
      spinner.fail(chalk.red(`Gagal mengambil nonce: ${response.data.message || 'Unknown error'}`));
      return { nonce: null, proxyAgent: newProxyAgent };
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error mengambil nonce: ${error.message}`));
    return { nonce: null, proxyAgent: null };
  }
}

async function loginAndGetToken(wallet, proxies) {
  const spinner = ora(chalk.cyan(`Melakukan login untuk wallet: ${wallet.address}`)).start();
  const uuid = uuidv4();

  // Ambil nonce dari server
  let { nonce, proxyAgent } = await getNonce(proxies, null);
  if (!nonce) {
    spinner.fail(chalk.red(`Tidak bisa melanjutkan login karena nonce tidak valid`));
    return { token: null, proxyAgent: null };
  }

  const signer = new ethers.Wallet(wallet.privateKey);
  const signature = await signer.signMessage(nonce);

  console.log(chalk.yellow(`Nonce: ${nonce}`));
  console.log(chalk.yellow(`Signature: ${signature}`));

  const config = {
    method: 'POST',
    url: `${apiUrl}/user/login`,
    data: {
      address: wallet.address,
      clickPower: 0.035,
      nonce,
      signature,
      uuid,
      walletCode: 1
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': '03ad7ea4-2b75',
      'Origin': 'https://event.goldstation.io',
      'Referer': 'https://event.goldstation.io/mine'
    },
    httpsAgent: proxyAgent,
    timeout: 30000
  };

  try {
    const { response, proxyAgent: newProxyAgent } = await requestWithRetry(config, proxies, proxyAgent);
    if (response.data.success && response.data.data.token) {
      const token = response.data.data.token;
      fs.appendFileSync('tokens.txt', `${token}\n`);
      spinner.succeed(chalk.green(`Berhasil login dan mendapatkan token untuk ${wallet.address}`));
      return { token, proxyAgent: newProxyAgent };
    } else {
      spinner.fail(chalk.red(`Login gagal: ${response.data.message || 'Unknown error'}`));
    }
  } catch (error) {
    spinner.fail(chalk.red(`Gagal login untuk ${wallet.address}: ${error.message}`));
    if (error.response) {
      console.log(chalk.red(`Response: ${JSON.stringify(error.response.data)}`));
    }
  }
  return { token: null, proxyAgent: null };
}

async function getUserInfo(token, proxyAgent, proxies) {
  const spinner = ora(chalk.blue('Mengambil info pengguna...')).start();
  const config = {
    method: 'GET',
    url: `${apiUrl}/user/info`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': '03ad7ea4-2b75',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    },
    timeout: 30000
  };

  try {
    const { response, proxyAgent: newProxyAgent } = await requestWithRetry(config, proxies, proxyAgent);
    if (response.data.success) {
      spinner.succeed(chalk.green('Info pengguna berhasil diambil'));
      return { data: { level: response.data.data.userLevel, accumulatedPower: response.data.data.accumulatedPower }, proxyAgent: newProxyAgent };
    } else {
      spinner.fail(chalk.yellow(`Gagal mendapatkan info: ${response.data.message || 'Unknown error'}`));
      return { data: null, proxyAgent: newProxyAgent };
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error mengambil info: ${error.message}`));
    return { data: null, proxyAgent: null };
  }
}

async function upgradeLevel(token, proxyAgent, proxies) {
  const spinner = ora(chalk.blue('Meningkatkan level...')).start();
  const config = {
    method: 'POST',
    url: `${apiUrl}/user/levelup`,
    data: {},
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-api-key': '03ad7ea4-2b75',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    },
    timeout: 30000
  };

  try {
    const { response, proxyAgent: newProxyAgent } = await requestWithRetry(config, proxies, proxyAgent);
    if (response.status === 201 && response.data.success) {
      spinner.succeed(chalk.green('Level berhasil ditingkatkan'));
      return { success: true, proxyAgent: newProxyAgent };
    } else {
      spinner.fail(chalk.yellow(`Upgrade gagal: ${response.data.message || 'Unknown error'}`));
      return { success: false, proxyAgent: newProxyAgent };
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error meningkatkan level: ${error.message}`));
    return { success: false, proxyAgent: null };
  }
}

async function playGame(token, proxyAgent, wallet, proxies) {
  const spinner = ora(chalk.blue(`Memulai permainan untuk ${wallet.address}...`)).start();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-api-key': '03ad7ea4-2b75',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  };

  let currentProxyAgent = proxyAgent;
  try {
    let { data: userInfo, proxyAgent: infoProxyAgent } = await getUserInfo(token, currentProxyAgent, proxies);
    currentProxyAgent = infoProxyAgent;
    if (!userInfo) {
      spinner.fail(chalk.red(`Gagal mengambil info awal untuk ${wallet.address}. Melewati...`));
      return currentProxyAgent;
    }
    let currentLevel = userInfo.level;
    let accumulatedPower = userInfo.accumulatedPower;
    console.log(chalk.cyan(`Level saat ini: B${currentLevel}`));
    console.log(chalk.cyan(`Accumulated Power: ${accumulatedPower} GOLD`));

    if (currentLevel < 50) {
      while (currentLevel < 50 && accumulatedPower > 0) {
        const { success, proxyAgent: upgradeProxyAgent } = await upgradeLevel(token, currentProxyAgent, proxies);
        currentProxyAgent = upgradeProxyAgent;
        if (success) {
          const { data: newUserInfo, proxyAgent: newInfoProxyAgent } = await getUserInfo(token, currentProxyAgent, proxies);
          currentProxyAgent = newInfoProxyAgent;
          if (newUserInfo) {
            currentLevel = newUserInfo.level;
            accumulatedPower = newUserInfo.accumulatedPower;
            console.log(chalk.green(`Level berhasil ditingkatkan ke B${currentLevel}`));
            console.log(chalk.cyan(`Accumulated Power: ${accumulatedPower} GOLD`));
          } else {
            console.log(chalk.yellow('Gagal memperbarui info setelah level up.'));
            break;
          }
        } else {
          break;
        }
        await randomDelay();
      }
      if (currentLevel >= 50) {
        console.log(chalk.green(`Level maksimum B50 tercapai untuk ${wallet.address}!`));
      } else if (accumulatedPower <= 0) {
        console.log(chalk.yellow(`Berhenti meningkatkan level karena power tidak cukup.`));
      }
    } else {
      console.log(chalk.green(`Wallet ${wallet.address} sudah di level maksimum B50.`));
    }

    while (true) {
      const clickConfig = {
        method: 'POST',
        url: `${apiUrl}/user/click`,
        data: { clickPower: 560 },
        headers,
        httpsAgent: currentProxyAgent,
        timeout: 30000
      };
      const { response, proxyAgent: clickProxyAgent } = await requestWithRetry(clickConfig, proxies, currentProxyAgent);
      currentProxyAgent = clickProxyAgent;

      if (response.data.success) {
        console.log(chalk.green(`Klik berhasil! ${response.data.data.current}/${response.data.data.dailyMax}`));
        if (response.data.data.current >= response.data.data.dailyMax) {
          console.log(chalk.blue('Batas tap harian tercapai. Reset tengah malam.'));
          break;
        }
      } else {
        console.log(chalk.yellow(`Klik gagal: ${response.data.message || 'Unknown error'}`));
        break;
      }
      await randomDelay();
    }

    const { data: finalUserInfo, proxyAgent: finalProxyAgent } = await getUserInfo(token, currentProxyAgent, proxies);
    currentProxyAgent = finalProxyAgent;
    if (finalUserInfo) {
      console.log(chalk.cyan(`Final Accumulated Power: ${finalUserInfo.accumulatedPower} GOLD`));
    }
    spinner.succeed(chalk.green(`Permainan selesai untuk ${wallet.address}`));
    return currentProxyAgent;
  } catch (error) {
    spinner.fail(chalk.red(`Error bermain untuk ${wallet.address}: ${error.message}`));
    if (error.response) {
      console.log(chalk.red(`Response: ${JSON.stringify(error.response.data)}`));
    }
    return currentProxyAgent;
  }
}

(async () => {
  console.log(chalk.green('Bot sedang berjalan... Tekan CTRL + C untuk berhenti.'));

  for (const wallet of wallets) {
    const { token, proxyAgent } = await loginAndGetToken(wallet, proxies);
    let workingProxyAgent = proxyAgent;
    if (token) {
      workingProxyAgent = await playGame(token, workingProxyAgent, wallet, proxies);
    } else {
      console.log(chalk.red(`Login gagal untuk ${wallet.address}, melewati...`));
    }
    await randomDelay();
  }
})();