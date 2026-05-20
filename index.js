const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot running');
});

app.listen(process.env.PORT || 3000);

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

console.log('Bot started');

bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    '测试按钮',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '点击测试',
              callback_data: 'ok'
            }
          ]
        ]
      }
    }
  );
});

bot.on('callback_query', async (query) => {

  try {

    await bot.answerCallbackQuery(query.id);

    if (query.data === 'ok') {

      await bot.editMessageText(
        '按钮成功 ✅',
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
