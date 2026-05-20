const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot running');
});

app.listen(process.env.PORT || 3000);

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: true
});

console.log('Bot started');

const keyboard = {
  inline_keyboard: [
    [
      {
        text: '测试按钮',
        callback_data: 'test'
      }
    ]
  ]
};

bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    '按钮测试',
    {
      reply_markup: keyboard
    }
  );
});

bot.on('callback_query', async (query) => {

  try {

    await bot.answerCallbackQuery(query.id);

    if (query.data === 'test') {

      await bot.editMessageText(
        '按钮成功了 ✅',
        {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id
        }
      );
    }

  } catch(err) {

    console.log(err.message);
  }
});
