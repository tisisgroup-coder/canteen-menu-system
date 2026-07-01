const express = require('express');
const router = express.Router();
const db = require('./db');
const { getIO } = require('./socket');
const axios = require('axios');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const vendorMap = {
  "27338570539163170": 1,
  "27312215815099999": 2,
  "27257263220595257": 3,
  "MESSENGER_ID_004": 4,
  "MESSENGER_ID_005": 5,
  "MESSENGER_ID_006": 6,
  "MESSENGER_ID_007": 7,
  "36487749134204588": 8,
  "MESSENGER_ID_009": 9,
  "MESSENGER_ID_010": 10,
  "MESSENGER_ID_011": 11,
  "MESSENGER_ID_012": 12,
  "MESSENGER_ID_013": 13,
  "MESSENGER_ID_014": 14,
};

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified ✅');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    // Respond to Facebook immediately, then process events async
    res.sendStatus(200);

    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (!(event.message && event.message.text)) continue;

        const senderId = event.sender.id;
        const messageText = event.message.text.trim();
        const storeId = vendorMap[senderId];
        console.log('Message from:', senderId, '| Text:', messageText);

        try {
          if (!storeId) {
            await sendReply(senderId, "Sorry, your store is not registered in the system.");
            continue;
          }

          if (messageText.toLowerCase().startsWith('sold out')) {
            const itemName = messageText.substring(9).trim();
            await db.setItemSoldOut(storeId, itemName);
            await sendReply(senderId, `"${itemName}" marked as sold out ✅`);
            getIO().emit('menu-updated');
            continue;
          }

          if (messageText.toLowerCase() === 'closed') {
            await db.setStoreOpen(storeId, false);
            await sendReply(senderId, `Store ${storeId} marked as closed ✅`);
            getIO().emit('menu-updated');
            continue;
          }

          if (messageText.toLowerCase() === 'open') {
            await db.setStoreOpen(storeId, true);
            await sendReply(senderId, `Store ${storeId} marked as open ✅`);
            getIO().emit('menu-updated');
            continue;
          }

          const items = messageText.split(',').map(i => i.trim());
          const parsed = [];

          items.forEach(item => {
            const parts = item.trim().split(' ');
            const price = parseFloat(parts[parts.length - 1]);
            const name = parts.slice(0, parts.length - 1).join(' ');
            if (!isNaN(price) && name) {
              parsed.push({ name, price });
            }
          });

          if (parsed.length === 0) {
            await sendReply(senderId, "Format not recognized. Try: Adobo 45, Sinigang 60");
            continue;
          }

          await db.replaceStoreMenu(storeId, parsed);
          await sendReply(senderId, `Store ${storeId} menu updated with ${parsed.length} item(s) ✅`);
          getIO().emit('menu-updated');
        } catch (err) {
          console.error('Error processing webhook event:', err.message);
        }
      }
    }
  } else {
    res.sendStatus(404);
  }
});

function sendReply(recipientId, message) {
  return axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    recipient: { id: recipientId },
    message: { text: message }
  }).catch(err => console.error('Error sending reply:', err.message));
}

module.exports = router;