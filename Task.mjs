import axios from 'axios';
import chalk from 'chalk';
import CFonts from 'cfonts';
import fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import readline from 'readline-sync';
import ora from 'ora';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Banner
CFonts.say('Airdrop 888', {
  font: 'block',
  align: 'center',
  colors: ['#f80', '#ff0'],
});
console.log(chalk.green('Script coded by - @balveerxyz || Auto Task RWA Miner'));

// Load Wallets
let wallets = [];
try {
  wallets = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
} catch (e) {
  console.log(chalk.red('walletGame.json tidak ditemukan atau formatnya salah!'));
  process.exit(1);
}

// Proxy setup
let proxies = [];
let useProxy = readline.question('Mau menggunakan proxy? (y/n) : ').toLowerCase() === 'y';
if (useProxy) {
  proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').map(p => p.trim()).filter(p => p);
  if (!proxies.length) {
    console.log(chalk.red('No proxies found in proxy.txt'));
    process.exit(1);
  }
}

// Get Random Proxy
const getProxyAgent = () => {
  if (!useProxy) return null;
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  return proxy.startsWith('socks5://') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy);
};

// Login untuk mendapatkan token baru
async function loginAndGetToken(wallet) {
  console.log(chalk.cyan(`Melakukan login untuk wallet: ${wallet.address}`));
  const agent = getProxyAgent();
  const uuid = uuidv4();
  const nonce = crypto.randomBytes(32).toString('hex');
  const signer = new ethers.Wallet(wallet.privateKey);
  const signature = await signer.signMessage(nonce);

  try {
    const response = await axios.post('https://event.goldstation.io/api-v2/user/login', {
      address: wallet.address,
      clickPower: 0.039,
      nonce: nonce,
      signature: signature,
      uuid: uuid,
      walletCode: 1,
      privateKey: wallet.privateKey
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json',
        'x-api-key': '03ad7ea4-2b75'
      },
      httpsAgent: agent
    });

    if (response.data.success && response.data.data.token) {
      console.log(chalk.green('Login berhasil, token disimpan ke tokens.txt'));
      const token = response.data.data.token;
      fs.appendFileSync('tokens.txt', `${token}\n`);
      return token;
    }
  } catch (err) {
    console.log(chalk.red('Error login:'), err.message);
  }
  return null;
}

// Fetch Tasks
async function fetchTasks(token) {
  const spinner = ora('Fetching tasks...').start();
  try {
    const response = await axios.get('https://event.goldstation.io/api-v2/user/mission', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0',
        'x-api-key': '03ad7ea4-2b75'
      },
      httpsAgent: getProxyAgent()
    });
    if (response.data.success) {
      spinner.succeed('Tasks fetched successfully!');
      return response.data.data.missionHistory || [];
    }
    spinner.fail('Failed to fetch tasks.');
  } catch (err) {
    spinner.fail('Error fetching tasks: ' + err.message);
  }
  return [];
}

// Complete Task
async function completeTask(token, task) {
  if (task.complete) {
    console.log(chalk.blue(`Task ${task.id} already completed. Skipping to claim...`));
    await claimTask(token, task.id);
    return;
  }

  const spinner = ora(`Completing task ${task.id}...`).start();
  try {
    const response = await axios.post('https://event.goldstation.io/api-v2/user/mission', {
      missionId: task.id
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'x-api-key': '03ad7ea4-2b75'
      },
      httpsAgent: getProxyAgent()
    });
    if (response.data.success) {
      spinner.succeed(`Task ${task.id} completed successfully!`);
      await claimTask(token, task.id);
    } else {
      spinner.fail(`Failed to complete task ${task.id}.`);
    }
  } catch (err) {
    spinner.fail('Error completing task: ' + err.message);
  }
}

// Claim Task
async function claimTask(token, missionId) {
  const spinner = ora(`Claiming task ${missionId}...`).start();
  try {
    const response = await axios.post('https://event.goldstation.io/api-v2/user/mission', {
      missionId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'x-api-key': '03ad7ea4-2b75'
      },
      httpsAgent: getProxyAgent()
    });
    if (response.data.success) {
      spinner.succeed(`Task ${missionId} claimed successfully!`);
    } else {
      spinner.fail(`Failed to claim task ${missionId}.`);
    }
  } catch (err) {
    spinner.fail('Error claiming task: ' + err.message);
  }
}

// Main Function
(async () => {
  for (const wallet of wallets) {
    const token = await loginAndGetToken(wallet);
    if (token) {
      console.log(chalk.blue('Menggunakan token baru:'), token.substring(0, 15) + '...');
      const tasks = await fetchTasks(token);
      console.log(chalk.yellow(`Found ${tasks.length} tasks.`));
      for (const task of tasks) {
        await completeTask(token, task);
      }
    }
  }
})();
