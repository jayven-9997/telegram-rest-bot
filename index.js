// ===== TELEGRAM 档口休息系统 V3 商业版 =====

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const cron = require('node-cron');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot running');
});

app.listen(process.env.PORT || 3000);

const GROUP_ID = -1003518294043;

const ADMIN_ID = 990373699;

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

// ===== 档口资料 =====

const stalls = [

{ id:'888', name:'杂菜饭', type:'早' },
{ id:'801', name:'桦记椰浆饭', type:'早' },
{ id:'802', name:'大姑猪肠粉', type:'早' },
{ id:'803', name:'鱼头米粉', type:'早晚' },
{ id:'804', name:'许记云吞面', type:'早' },
{ id:'805', name:'福州美食', type:'早' },
{ id:'806', name:'吉祥面粉粿', type:'早' },
{ id:'807', name:'大吉咖喱鱼头', type:'晚' },
{ id:'808', name:'包点', type:'早' },
{ id:'809', name:'JC煮炒', type:'早晚' },
{ id:'810', name:'肉骨茶', type:'早晚' },
{ id:'811', name:'兰姐砂锅菜', type:'早晚' },
{ id:'812', name:'日本餐', type:'早晚' },
{ id:'813', name:'老陈粿条汤', type:'早晚' },
{ id:'815', name:'药材鱼汤', type:'早晚' },
{ id:'816', name:'监牢饭', type:'早晚' },
{ id:'817', name:'薄饼', type:'早晚' },
{ id:'818', name:'ROJAK', type:'早晚' },
{ id:'819', name:'鹿鼎记', type:'早' },
{ id:'820', name:'面包王', type:'早' },
{ id:'823', name:'麻辣烫', type:'晚' },
{ id:'824', name:'靓汤王', type:'早晚' },
{ id:'826', name:'擂茶', type:'早' },
{ id:'827', name:'可爱粥', type:'晚' },
{ id:'829', name:'可爱鸡', type:'晚' },
{ id:'830', name:'古早味云吞面', type:'晚' },
{ id:'831', name:'228炒粿条', type:'早晚' },
{ id:'832', name:'老黄酿豆腐', type:'早晚' },
{ id:'833', name:'西餐', type:'晚' },
{ id:'834', name:'鸡饭', type:'早' },
{ id:'835', name:'泰国炒', type:'早晚' },
{ id:'901', name:'二哥汉堡', type:'晚' },
{ id:'902', name:'面粉粿', type:'晚' },
{ id:'903', name:'SATAY', type:'晚' },
{ id:'904', name:'烤鸡翅膀', type:'晚' },
{ id:'905', name:'烧鱼', type:'晚' },
{ id:'906', name:'经济米粉', type:'晚' },
{ id:'907', name:'油条', type:'早' },
{ id:'908', name:'糕点', type:'早' }

];

// ===== 数据 =====

let schedule = {};
let owners = {};
let summaryMessageId = null;

if (fs.existsSync('save.json')) {

  schedule = JSON.parse(
    fs.readFileSync('save.json')
  );
}

if (fs.existsSync('owners.json')) {

  owners = JSON.parse(
    fs.readFileSync('owners.json')
  );
}

function saveData() {

  fs.writeFileSync(
    'save.json',
    JSON.stringify(schedule)
  );

  fs.writeFileSync(
    'owners.json',
    JSON.stringify(owners)
  );
}

// ===== 日期 =====

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

// ===== 统计班次 =====

function countShift(date, shift) {

  const closed = schedule[date] || [];

  let count = 0;

  closed.forEach(id => {

    const stall =
      stalls.find(s => s.id === id);

    if (!stall) return;

    if (
      stall.type === shift ||
      stall.type === '早晚'
    ) {
      count++;
    }
  });

  return count;
}

// ===== 权限 =====

function hasPermission(userId, stallId) {

  if (userId === ADMIN_ID) return true;

  if (!owners[stallId]) return false;

  return owners[stallId].includes(userId);
}

// ===== 日期按钮 =====

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

// ===== 档口按钮 =====

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
          ? `🔴${stall.id} ${stall.name}【${stall.type}】`
          : `🟢${stall.id} ${stall.name}【${stall.type}】`,

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

// ===== 日期内容 =====

function buildDateText(date) {

  const closed = schedule[date] || [];

  let text = `📅 ${date}\n\n`;

  text += `🌞早班休息：${countShift(date,'早')}/3\n`;
  text += `🌙晚班休息：${countShift(date,'晚')}/3\n\n`;

  text += `🔴休息档口：\n`;

  if (closed.length === 0) {

    text += `无`;

  } else {

    closed.forEach(id => {

      const stall =
        stalls.find(s => s.id === id);

      if (stall) {

        text +=
          `\n${stall.id} ${stall.name}`;
      }
    });
  }

  return text;
}

// ===== 总览 =====

function buildSummaryText() {

  let text = '📋未来10天休息总览\n\n';

  getNext10Days().forEach(date => {

    text +=
`━━━ 📅 ${date.slice(5)} ━━━

`;

    const closed = schedule[date] || [];

    const early = [];
    const night = [];

    closed.forEach(id => {

      const stall =
        stalls.find(s => s.id === id);

      if (!stall) return;

      if (
        stall.type === '早' ||
        stall.type === '早晚'
      ) {

        early.push(
          `🔴${stall.id} ${stall.name}`
        );
      }

      if (
        stall.type === '晚' ||
        stall.type === '早晚'
      ) {

        night.push(
          `🔴${stall.id} ${stall.name}`
        );
      }
    });

    text += '🌞早班\n';

    if (early.length === 0) {

      text += '🟢无\n';

    } else {

      text += early.join('\n') + '\n';
    }

    text += '\n🌙晚班\n';

    if (night.length === 0) {

      text += '🟢无\n';

    } else {

      text += night.join('\n') + '\n';
    }

    text += '\n';
  });

  return text;
}

// ===== 更新总览 =====

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

      } catch(e) {}
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

// ===== START =====

bot.onText(/\/start/, async (msg) => {

  // 私聊

  if (
    msg.chat.type === 'private'
  ) {

 return bot.sendMessage(
  msg.chat.id,

`👋欢迎使用档口休息系统

📌负责人功能：

/join 档口号码
加入档口

/leave 档口号码
退出档口

/myid
查看你的ID`
);
  }

  // 群组

  await refreshSummary();

  await bot.sendMessage(
    msg.chat.id,
    '📅请选择日期',
    {
      reply_markup: buildDateKeyboard()
    }
  );

});

// ===== MYID =====

bot.onText(/\/myid/, async (msg) => {

  if (
    msg.chat.type !== 'private'
  ) {

    return bot.sendMessage(
      msg.chat.id,
      '⚠️请私聊机器人获取ID'
    );
  }

  await bot.sendMessage(
    msg.chat.id,
    `你的ID: ${msg.from.id}`
  );

});

// ===== JOIN =====

bot.onText(/\/join (.+)/, async (msg, match) => {

  if (
    msg.chat.type !== 'private'
  ) return;

  const stallId = match[1];

  const stall =
    stalls.find(s => s.id === stallId);

  if (!stall) {

    return bot.sendMessage(
      msg.chat.id,
      '❌档口不存在'
    );
  }

  if (!owners[stallId]) {

    owners[stallId] = [];
  }

  if (
    owners[stallId].includes(msg.from.id)
  ) {

    return bot.sendMessage(
      msg.chat.id,
      '⚠️你已经是负责人'
    );
  }

  if (
    owners[stallId].length >= 2
  ) {

    return bot.sendMessage(
      msg.chat.id,
      '⚠️负责人已满'
    );
  }

  await bot.sendMessage(
    msg.chat.id,
    `确认加入：

${stall.id} ${stall.name}`,
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text:'✅确认',
            callback_data:
              `joinconfirm_${stallId}`
          },
          {
            text:'❌取消',
            callback_data:'cancel'
          }
        ]]
      }
    }
  );
});

// ===== LEAVE =====

bot.onText(/\/leave (.+)/, async (msg, match) => {

  if (
    msg.chat.type !== 'private'
  ) return;

  const stallId = match[1];

  const stall =
    stalls.find(s => s.id === stallId);

  if (!stall) {

    return bot.sendMessage(
      msg.chat.id,
      '❌档口不存在'
    );
  }

  await bot.sendMessage(
    msg.chat.id,
    `确认退出：

${stall.id} ${stall.name}`,
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text:'✅确认',
            callback_data:
              `leaveconfirm_${stallId}`
          },
          {
            text:'❌取消',
            callback_data:'cancel'
          }
        ]]
      }
    }
  );
});

// ===== OWNERS =====

bot.onText(/\/owners (.+)/, async (msg, match) => {

  if (
    msg.from.id !== ADMIN_ID
  ) return;

  const stallId = match[1];

  const stall =
    stalls.find(s => s.id === stallId);

  if (!stall) return;

  let text =
`${stall.id} ${stall.name}

`;

  if (
    !owners[stallId] ||
    owners[stallId].length === 0
  ) {

    text += '暂无负责人';

    return bot.sendMessage(
      msg.chat.id,
      text
    );
  }

  let keyboard = [];

  owners[stallId].forEach(userId => {

    text += `👤 ${userId}\n`;

    keyboard.push([
      {
        text:`❌移除 ${userId}`,
        callback_data:
          `remove_${stallId}_${userId}`
      }
    ]);
  });

  await bot.sendMessage(
    msg.chat.id,
    text,
    {
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  );
});

// ===== 按钮 =====

bot.on('callback_query', async (query) => {

  try {

    const data = query.data;

    // ===== 日期 =====

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

      return;
    }

    // ===== JOIN CONFIRM =====

    if (
      data.startsWith(
        'joinconfirm_'
      )
    ) {

      const stallId =
        data.replace(
          'joinconfirm_',
          ''
        );

      if (!owners[stallId]) {

        owners[stallId] = [];
      }

      if (
        owners[stallId].length >= 2
      ) {

        return bot.answerCallbackQuery(
          query.id,
          {
            text:'⚠️负责人已满',
            show_alert:true
          }
        );
      }

      owners[stallId].push(
        query.from.id
      );

      saveData();

      return bot.editMessageText(
        '✅加入成功',
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id
        }
      );
    }

    // ===== LEAVE CONFIRM =====

    if (
      data.startsWith(
        'leaveconfirm_'
      )
    ) {

      const stallId =
        data.replace(
          'leaveconfirm_',
          ''
        );

      if (!owners[stallId]) {

        owners[stallId] = [];
      }

      owners[stallId] =
        owners[stallId].filter(
          x => x !== query.from.id
        );

      saveData();

      return bot.editMessageText(
        '✅退出成功',
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id
        }
      );
    }

    // ===== REMOVE =====

    if (
      data.startsWith('remove_')
    ) {

      if (
        query.from.id !== ADMIN_ID
      ) return;

      const parts =
        data.split('_');

      const stallId = parts[1];

      const userId =
        Number(parts[2]);

      owners[stallId] =
        owners[stallId].filter(
          x => x !== userId
        );

      saveData();

      return bot.editMessageText(
        '✅已移除负责人',
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id
        }
      );
    }

    // ===== CANCEL =====

    if (data === 'cancel') {

      return bot.editMessageText(
        '❌已取消',
        {
          chat_id:
            query.message.chat.id,

          message_id:
            query.message.message_id
        }
      );
    }

    // ===== 档口 =====

    if (
      data.startsWith('stall_')
    ) {

      const parts = data.split('_');

      const date = parts[1];

      const stallId = parts[2];

      // ===== 权限检查 =====

      if (
        !hasPermission(
          query.from.id,
          stallId
        )
      ) {

        return bot.answerCallbackQuery(
          query.id,
          {
            text:'⚠️你没有权限操作这个档口',
            show_alert:true
          }
        );
      }

      const stall =
        stalls.find(s => s.id === stallId);

      if (!schedule[date]) {

        schedule[date] = [];
      }

      const alreadyClosed =
        schedule[date].includes(stallId);

      if (alreadyClosed) {

        schedule[date] =
          schedule[date].filter(
            x => x !== stallId
          );

      } else {

        const earlyCount =
          countShift(date,'早');

        const nightCount =
          countShift(date,'晚');

        if (
          stall.type === '早' &&
          earlyCount >= 3
        ) {

          return bot.answerCallbackQuery(
            query.id,
            {
              text:'⚠️早班休息已满',
              show_alert:true
            }
          );
        }

        if (
          stall.type === '晚' &&
          nightCount >= 3
        ) {

          return bot.answerCallbackQuery(
            query.id,
            {
              text:'⚠️晚班休息已满',
              show_alert:true
            }
          );
        }

        if (
          stall.type === '早晚'
        ) {

          if (
            earlyCount >= 3 ||
            nightCount >= 3
          ) {

            return bot.answerCallbackQuery(
              query.id,
              {
                text:'⚠️早晚班休息已满',
                show_alert:true
              }
            );
          }
        }

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

      return;
    }

    // ===== 返回 =====

    if (data === 'back') {

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

// ===== 自动总览 =====

setInterval(async () => {

  const now = new Date();

  if (
    (now.getHours() === 7 ||
     now.getHours() === 19)
    &&
    now.getMinutes() === 0
  ) {

    try {

      const msg = await bot.sendMessage(
        GROUP_ID,
        buildSummaryText()
      );

      summaryMessageId = msg.message_id;

      await bot.pinChatMessage(
        GROUP_ID,
        summaryMessageId,
        {
          disable_notification: true
        }
      );

    } catch(err) {

      console.log(err.message);
    }
  }

}, 60000);
