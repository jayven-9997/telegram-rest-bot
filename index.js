process.env.NTBA_FIX_350 = 1;

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

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
{ id:'805', name:'福州美食' }

];

let schedule = {};

if (fs.existsSync('save.json')) {

  schedule = JSON.parse(
    fs.readFileSync('save.json')
  );
}

function saveData() {

  fs.writeFileSync(
    'save.json',
    JSON.stringify(schedule)
  );
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

  let keyboard = [];

  let days = getNext14Days();

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

      let stall = stalls[j];

      let active = closed.includes(stall.id);

      row.push({
        text: active
          ? `${stall.id} ${stall.name} 🔴`
          : `${stall.id} ${stall.name} 🟢`,
        callback_data:
          `stall_${date}_${stall.id}`
      });
    }

    keyboard.push(row);
  }

  keyboard.push([
    {
      text:'⬅️返回',
      callback_data:'back'
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildStatusText(date) {

  let closed = schedule[date] || [];

  let text = `📅 ${date}\n\n`;

  if (closed.length === 0) {

    text += '🟢 全部营业';

  } else {

    text += '🔴 休息档口：\n\n';

    closed.forEach(id => {

      let stall =
        stalls.find(x => x.id === id);

      text += `${stall.id} ${stall.name}\n`;
    });
  }

  return text;
}

bot.onText(/\/panel/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    '📅请选择休息日期',
    {
      reply_markup:
        buildDateKeyboard()
    }
  );
});

bot.on('callback_query', async (query) => {

  const data = query.data;

  if (data.startsWith('date_')) {

    let date =
      data.replace('date_', '');

    await bot.sendMessage(
      query.message.chat.id,
      buildStatusText(date),
      {
        reply_markup:
          buildStallKeyboard(date)
      }
    );
  }

  else if (
    data.startsWith('stall_')
  ) {

    let parts = data.split('_');

    let date = parts[1];

    let stallId = parts[2];

    if (!schedule[date]) {

      schedule[date] = [];
    }

    if (
      schedule[date].includes(stallId)
    ) {

      schedule[date] =
        schedule[date].filter(
          x => x !== stallId
        );

    } else {

      schedule[date].push(stallId);
    }

    saveData();

    await bot.sendMessage(
      query.message.chat.id,
      buildStatusText(date),
      {
        reply_markup:
          buildStallKeyboard(date)
      }
    );
  }

  else if (data === 'back') {

    await bot.sendMessage(
      query.message.chat.id,
      '📅请选择休息日期',
      {
        reply_markup:
          buildDateKeyboard()
      }
    );
  }

  await bot.answerCallbackQuery(
    query.id
  );
});

setInterval(async () => {

  let now = new Date();

  let h = now.getHours();
  let m = now.getMinutes();

  if (
    (h === 7 || h === 19) &&
    m === 0
  ) {

    await bot.sendMessage(
      GROUP_ID,
      '📅请选择休息日期',
      {
        reply_markup:
          buildDateKeyboard()
      }
    );
  }

}, 1000 * 60);

setInterval(() => {}, 1000);
