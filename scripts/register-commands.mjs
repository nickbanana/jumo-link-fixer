// 一次性註冊 /preview 全域 slash command。
// 用法：node scripts/register-commands.mjs
//   會優先讀環境變數，缺漏時自動 fallback 讀取專案根目錄的 .dev.vars。
// 需 Node 18+（內建 fetch）。

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 解析 .dev.vars（dotenv 格式），回傳 key=>value。檔案不存在則回空物件。
function loadDevVars() {
    const path = join(dirname(fileURLToPath(import.meta.url)), '..', '.dev.vars');
    let raw;
    try {
        raw = readFileSync(path, 'utf8');
    } catch {
        return {};
    }
    const vars = {};
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        // 去掉成對的引號
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        vars[key] = value;
    }
    return vars;
}

const devVars = loadDevVars();
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID ?? devVars.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? devVars.DISCORD_BOT_TOKEN;

if (!APPLICATION_ID || !BOT_TOKEN) {
    console.error('缺少環境變數：請設定 DISCORD_APPLICATION_ID 與 DISCORD_BOT_TOKEN');
    process.exit(1);
}

const commands = [
    {
        name: 'preview',
        type: 1, // CHAT_INPUT
        description: '產生社群連結的預覽 embed（X / Instagram / Threads / Facebook）',
        options: [
            {
                name: 'url',
                description: '要預覽的連結',
                type: 3, // STRING
                required: true,
            },
        ],
    },
];

const res = await fetch(`https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
});

if (!res.ok) {
    console.error(`註冊失敗：${res.status}`);
    console.error(await res.text());
    process.exit(1);
}

console.log('指令註冊成功：');
console.log(JSON.stringify(await res.json(), null, 2));
