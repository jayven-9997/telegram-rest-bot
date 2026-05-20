const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');

const token = process.env.BOT_TOKEN;

const GROUP_ID = -5260137598;

const app = express();

app.get('/', (req, res) => {
  res.send('Bot running');
});

app.listen(process.env.PORT || 3000);

const bot = new TelegramBot(token, {
  polling: true
});

console.log('Bot started');

const stalls = [
{ id:'888', name:'杂菜饭' },
{ id:'801', name:'桦记椰浆饭' },
{ id:'802', name:'大姑猪肠粉' },
{ id:'803', name:'鱼头米粉' },
{ id:'804', name:'许记云吞面' },
{ id:'805', name:'福州美食' },
{ id:'806', name:'吉祥面粉粿' },
{ id:'807', name:'大吉咖喱鱼头' },
{ id:'808', name:'包点' },
{ id:'809', name:'JC煮炒' },
{ id:'810', name:'肉骨茶' },
{ id:'811', name:'兰姐砂锅菜' },
{ id:'812', name:'日本餐' },
{ id:'813', name:'老陈粿条汤' },
{ id:'815', name:'药材鱼汤' },
{ id:'816', name:'监牢饭' },
{ id:'817', name:'薄饼' },
{ id:'818', name:'ROJAK' },
{ id:'819', name:'鹿鼎记' },
{ id:'820', name:'面包王' },
{ id:'823', name:'麻辣烫' },
{ id:'824', name:'靓汤王' },
{ id:'826', name:'擂茶' },
{ id:'827', name:'可爱粥' },
{ id:'829', name:'可爱鸡' },
{ id:'830', name:'古早味云吞面' },
{ id:'831', name:'228炒粿条' },
{ id:'832', name:'老黄酿豆腐' },
{ id:'833', name:'西餐' },
{ id:'834', name:'鸡饭' },
{ id:'835', name:'泰国炒' },
{ id:'901', name:'二哥汉堡' },
{ id:'902', name:'面粉粿' },
{ id:'903', name:'SATAY' },
{ id:'904', name:'烤鸡翅膀' },
{ id:'905', name:'烧鱼' },
{ id:'906', name:'经济米粉' },
{ id:'907', name:'油条' },
{ id:'908', name:'糕点' }
];

let schedule = {};

if (fs.existsSync('save.json')) {

  const data = fs.readFileSync('save.json');

  schedule = JSON.parse(data);
}

function saveData() {

  fs.writeFileSync(
    'save.json',
    JSON.stringify(schedule)
  );
}

function cleanOldDates() {

  const today = new Date();

  today.setHours(0,0,0,0);

  Object.keys(schedule).forEach(date => {

    if (new Date(date) < today) {

      delete schedule[date];
    }
  });

  saveData();
}

function getNext14Days() {

  let days = [];

  for (let i = 0; i < 14; i++) {

    let d = new Date();

    d.setDate(d.getDate() + i);

    let key =
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');

    days.push(key);
  }

  return days;
}

function buildDateKeyboard() {

  const days = getNext14Days();

  let keyboard = [];

  for (let i = 0; i < days.length; i += 3) {

    let row = [];

    for (let j = i; j < i + 3 && j < days.length; j++) {

      row.push({
        text: days[j].slice(5),
        callback_data: 'date_' + days[j]
      });
    }

    keyboard.push(row);
  }

  return {
    inline_keyboard: keyboard
  };
}

function buildStallKeyboard(date) {

  let keyboard = [];

  let closed = schedule[date] || [];

  for (let i = 0; i < stalls.length; i += 2) {

    let row = [];

    for (let j = i; j < i + 2 && j < stalls.length; j++) {

      const stall = stalls[j];

      const isClosed = closed.includes(stall.id);

      row.push({
        text: isClosed
          ? `${stall.id}|${stall.name}🔴`
          : `${stall.id}|${stall.name}🟢`,
        callback_data: `stall_${date}_${stall.id}`
      });
    }

    keyboard.push(row);
  }

  keyboard.push([
    {
      text: '⬅️返回日期',
      callback_data: 'back_dates'
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildDateMessage(date) {

  let closed = schedule[date] || [];

  let text = `📅 ${date}\n\n`;

  text += `🔴 休息档口：\n\n`;

  if (closed.length === 0) {

    text += '无';

  } else {

    closed.forEach(id => {

      let stall = stalls.find(s => s.id === id);

      if (stall) {

        text += `${stall.id} ${stall.name}\n`;
      }
    });
  }

  text += '\n\n━━━━━━━━━━\n\n点击下面档口切换状态';

  return text;
}

function buildSummaryText() {

  let text = '📋未来14天休息总览\n\n';

  const days = getNext14Days();

  days.forEach(date => {

    text += `📅 ${date}\n`;

    const closed = schedule[date] || [];

    if (closed.length === 0) {

      text += '🟢 全部营业\n';

    } else {

      closed.forEach(id => {

        const stall = stalls.find(s => s.id === id);

        if (stall) {

          text += `🔴 ${stall.id} ${stall.name}\n`;
        }
      });
    }

    text += '\n━━━━━━━━━━\n\n';
  });

  return text;
}

async function sendPanel(chatId) {

  await bot.sendMessage(
    chatId,
    '📅请选择休息日期',
    {
      reply_markup: buildDateKeyboard()
    }
  );
}

async function sendSummary() {

  await bot.sendMessage(
    GROUP_ID,
    buildSummaryText()
  );
}

async function sendTodayAnnouncement() {

  const today = new Date();

  const key =
    today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');

  let text = '📢 今日休息通知\n\n';

  const closed = schedule[key] || [];

  if (closed.length === 0) {

    text += '🟢 今天全部营业';

  } else {

    closed.forEach(id => {

      const stall = stalls.find(s => s.id === id);

      if (stall) {

        text += `🔴 ${stall.id} ${stall.name}\n`;
      }
    });
  }

  await bot.sendMessage(GROUP_ID, text);
}

bot.onText(/\/start/, async (msg) => {

  await sendPanel(msg.chat.id);
});

bot.on('callback_query', async (query) => {

  try {

    await bot.answerCallbackQuery(query.id);

    const data = query.data;

    if (data.startsWith('date_')) {

      const date = data.replace('date_', '');

      await bot.editMessageText(
        buildDateMessage(date),
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: buildStallKeyboard(date)
        }
      );
    }

    else if (data.startsWith('stall_')) {

      const parts = data.split('_');

      const date = parts[1];

      const stallId = parts[2];

      if (!schedule[date]) {

        schedule[date] = [];
      }

      if (schedule[date].includes(stallId)) {

        schedule[date] =
          schedule[date].filter(x => x !== stallId);

      } else {

        schedule[date].push(stallId);
      }

      saveData();

      await bot.editMessageText(
        buildDateMessage(date),
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: buildStallKeyboard(date)
        }
      );

      await sendSummary();
    }

    else if (data === 'back_dates') {

      await bot.editMessageText(
        '📅请选择休息日期',
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          reply_markup: buildDateKeyboard()
        }
      );
    }

  } catch(err) {

    console.log(err.message);
  }
});

cleanOldDates();

bot.sendMessage(
  GROUP_ID,
  '✅ 档口休息系统已启动'
);

sendPanel(GROUP_ID);

sendSummary();

setInterval(() => {

  cleanOldDates();

}, 1000 * 60 * 30);

setInterval(() => {

  const now = new Date();

  if (
    (now.getHours() === 7 || now.getHours() === 19)
    &&
    now.getMinutes() === 0
  ) {

    sendTodayAnnouncement();
  }

}, 1000 * 60);
