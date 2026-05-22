const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot running');
});

app.listen(process.env.PORT || 3000);

const GROUP_ID = -100XXXXXXXXXX;

const WEBHOOK_URL =
'https://telegram-rest-bot.onrender.com';

const bot = new TelegramBot(
  process.env.BOT_TOKEN
);

bot.setWebHook(
  `${WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`
);

app.post(
  `/bot${process.env.BOT_TOKEN}`,
  (req, res) => {

    bot.processUpdate(req.body);

    res.sendStatus(200);
  }
);

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

let summaryMessageId = null;

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

function getNext10Days() {

  let days = [];

  for (let i = 0; i < 10; i++) {

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

  const days = getNext10Days();

  let keyboard = [];

  for (let i = 0; i < days.length; i += 2) {

    let row = [];

    for (let j = i; j < i + 2 && j < days.length; j++) {

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

  const closed = schedule[date] || [];

  let keyboard = [];

  for (let i = 0; i < stalls.length; i += 2) {

    let row = [];

    for (let j = i; j < i + 2 && j < stalls.length; j++) {

      const stall = stalls[j];

      const isClosed =
        closed.includes(stall.id);

      row.push({

        text: isClosed
          ? `🔴${stall.id}`
          : `🟢${stall.id}`,

        callback_data:
          `stall_${date}_${stall.id}`
      });
    }

    keyboard.push(row);
  }

  keyboard.push([
    {
      text:'⬅️返回日期',
      callback_data:'back'
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildDateText(date) {

  const closed = schedule[date] || [];

  let text = `📅 ${date}\n\n`;

  text += `🔴休息档口：\n`;

  if (closed.length === 0) {

    text += `无`;

  } else {

    closed.forEach(id => {

      const stall =
        stalls.find(s => s.id === id);

      if (stall) {

        text += `\n${stall.id} ${stall.name}`;
      }
    });
  }

  return text;
}

function buildSummaryText() {

  let text = '📋未来10天休息总览\n\n';

  getNext10Days().forEach(date => {

    text += `📅 ${date.slice(5)}\n`;

    const closed = schedule[date] || [];

    if (closed.length === 0) {

      text += '🟢全部营业\n\n';

    } else {

      for (let i = 0; i < closed.length; i += 2) {

        let row = '';

        for (
          let j = i;
          j < i + 2 && j < closed.length;
          j++
        ) {

          const stall =
            stalls.find(
              s => s.id === closed[j]
            );

          if (stall) {

            row +=
              `🔴${stall.id} ${stall.name}   `;
          }
        }

        text += row + '\n';
      }

      text += '\n';
    }
  });

  return text;
}

async function refreshSummary() {

  try {

    if (summaryMessageId) {

      try {

        await bot.editMessageText(
          buildSummaryText(),
          {
            chat_id: GROUP_ID,
            message_id: summaryMessageId
          }
        );

        return;

      } catch(e) {

        console.log('edit fail');
      }
    }

    const msg = await bot.sendMessage(
      GROUP_ID,
      buildSummaryText()
    );

    summaryMessageId = msg.message_id;

  } catch(err) {

    console.log(err.message);
  }
}

bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    '📅请选择日期',
    {
      reply_markup: buildDateKeyboard()
    }
  );

  await refreshSummary();

});

bot.onText(/\/id/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    `群组ID: ${msg.chat.id}`
  );

});

bot.on('callback_query', async (query) => {

  try {

    await bot.answerCallbackQuery(query.id);

    const data = query.data;

    if (data.startsWith('date_')) {

      const date =
        data.replace('date_', '');

      await bot.editMessageText(
        buildDateText(date),
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id,

          reply_markup:
            buildStallKeyboard(date)
        }
      );
    }

    else if (
      data.startsWith('stall_')
    ) {

      const parts = data.split('_');

      const date = parts[1];

      const stallId = parts[2];

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

      await bot.editMessageText(
        buildDateText(date),
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id,

          reply_markup:
            buildStallKeyboard(date)
        }
      );

      await refreshSummary();
    }

    else if (data === 'back') {

      await bot.editMessageText(
        '📅请选择日期',
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id,

          reply_markup:
            buildDateKeyboard()
        }
      );
    }

  } catch(err) {

    console.log(err.message);
  }
});

setInterval(async () => {

  const now = new Date();

  if (
    (now.getHours() === 7 ||
     now.getHours() === 19)
    &&
    now.getMinutes() === 0
  ) {

    await refreshSummary();
  }

}, 60000);
