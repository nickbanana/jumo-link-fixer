// 一次性註冊 /preview 全域 slash command。
// 用法：DISCORD_APPLICATION_ID=... DISCORD_BOT_TOKEN=... node scripts/register-commands.mjs
// 需 Node 18+（內建 fetch）。

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

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
