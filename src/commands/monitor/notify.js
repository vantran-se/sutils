const https = require('https');
const os = require('os');

const HOSTNAME = os.hostname();

function sendTelegram(botToken, chatId, text) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      res.resume(); // drain response
      res.on('end', resolve);
    });

    req.on('error', resolve); // swallow errors, always resolve
    req.write(body);
    req.end();
  });
}

/**
 * Returns a notify(event, detail) function bound to the config.
 * If no notify config is present, returns a no-op.
 *
 * Events: 'start' | 'idle' | 'reconnect' | 'shutdown'
 */
function buildNotifier(notifyConfig, log) {
  if (!notifyConfig || !notifyConfig.telegram) return () => {};

  const { bot_token, chat_id } = notifyConfig.telegram;
  if (!bot_token || !chat_id) {
    log('notify: telegram config is incomplete (requires bot_token and chat_id) — notifications disabled');
    return () => {};
  }

  const MESSAGES = {
    start:     (d) => `🟢 <b>Monitor started</b>\n<code>${HOSTNAME}</code>\nWatching ports: ${d}`,
    idle:      (d) => `💤 <b>Idle detected</b>\n<code>${HOSTNAME}</code>\nGrace period: ${d}`,
    reconnect: (d) => `🔌 <b>Connection restored</b>\n<code>${HOSTNAME}</code>\nActive port(s): ${d}`,
    shutdown:  (d) => `🔴 <b>Shutting down</b>\n<code>${HOSTNAME}</code>\n${d}`,
  };

  return function notify(event, detail = '') {
    const template = MESSAGES[event];
    if (!template) return Promise.resolve();
    return sendTelegram(bot_token, chat_id, template(detail));
  };
}

module.exports = { buildNotifier };
