const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const stalls = [
'888',
'801','802','803','804','805','806','807','808','809',
'810','811','812','813','815','816','817','818','819',
'820','823','824','826','827','829','830','831','832',
'833','834','835','901','902','903','904','905','906',
'907','908'
];

let closedStalls = [];

function buildMessage() {

  let closed =
    closedStalls.length > 0
    ? closedStalls.join('\n')
    : '无';

  let open = stalls.filter(x => !closedStalls.includes(x));

  return `
📅 今日档口状态

🔴 休息：
${closed}

🟢 营业：
${open.join('\n')}
`;
}

function buildKeyboard() {

  let keyboard = [];

  stalls.forEach(stall => {

    let isClosed = closedStalls.includes(stall);

    keyboard.push([
      {
        text: isClosed
          ? `${stall} ✅开档`
          : `${stall} ❌休息`,
        callback_data: stall
      }
    ]);
  });

  return {
    inline_keyboard: keyboard
  };
}

bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    buildMessage(),
    {
      reply_markup: buildKeyboard()
    }
  );
});

bot.on('callback_query', async (query) => {

  const stall = query.data;

  if (closedStalls.includes(stall)) {

    closedStalls =
      closedStalls.filter(x => x !== stall);

  } else {

    closedStalls.push(stall);
  }

  await bot.editMessageText(
    buildMessage(),
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: buildKeyboard()
    }
  );

  await bot.answerCallbackQuery(query.id);
});
