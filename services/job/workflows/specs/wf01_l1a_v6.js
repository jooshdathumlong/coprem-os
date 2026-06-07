// L1-A Preprocessor v6 — A1/A2/B1/B2/C1 commands added
const triggerData = $('Telegram Trigger').first().json;
const msg = triggerData.body?.message || triggerData.message || {};
const rawText = msg.text || msg.caption || '';
const userId = msg.from?.id || 0;
const chatId = msg.chat?.id || userId;

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

let text = rawText.slice(0, 2000).replace(/\x00/g, '').replace(/`/g, "'");

const INJECTION_PATTERNS = [
  /ignore previous/i, /forget instructions/i, /you are now/i,
  /disregard/i, /act as/i, /jailbreak/i, /override/i
];
const injection_detected = INJECTION_PATTERNS.some(p => p.test(text));

const content_clean = text.trim().replace(/\s+/g, ' ');
const thaiRegex = /[฀-๿]/;
const lang_detected = thaiRegex.test(content_clean) ? 'th' : 'en';
const msgId = msg.message_id || 0;
const msg_hash = simpleHash(`${userId}:${msgId}:${content_clean}`);

if (content_clean === '__ping__') return [];

// ── Command Detection ─────────────────────────────────────────
let msg_type = 'chat';
let commandArgs = '';
let commandMeta = {};

if (rawText.startsWith('/start'))   msg_type = 'start';
else if (rawText.startsWith('/save'))    { msg_type = 'save';    commandArgs = rawText.replace(/^\/save\s*/i, '').trim(); }
else if (rawText.startsWith('/rate'))    { msg_type = 'feedback'; }
else if (rawText.startsWith('/caption')) { msg_type = 'caption'; commandArgs = rawText.replace(/^\/caption\s*/i, '').trim(); }
else if (rawText.startsWith('/desc'))    { msg_type = 'description'; commandArgs = rawText.replace(/^\/desc\s*/i, '').trim(); }
else if (rawText.startsWith('/kol'))     { msg_type = 'kol'; commandArgs = rawText.replace(/^\/kol\s*/i, '').trim(); }
else if (rawText.startsWith('/campaign')){ msg_type = 'campaign'; commandArgs = rawText.replace(/^\/campaign\s*/i, '').trim(); }
else if (rawText.startsWith('/report'))  { msg_type = 'report'; }
else if (rawText.toUpperCase() === 'APPROVE' || rawText.toUpperCase() === 'REJECT') msg_type = 'approval';

// Parse brand flag: --batiste or --scrubdaddy
const brandMatch = commandArgs.match(/--?(batiste|scrubdaddy|scrub[_-]?daddy)/i);
const brand = brandMatch
  ? (brandMatch[1].toLowerCase().includes('scrub') ? 'scrub_daddy' : 'batiste')
  : 'batiste';
const cleanArgs = commandArgs.replace(/--?(batiste|scrubdaddy|scrub[_-]?daddy)/i, '').trim();

// Parse budget flag: --budget=50000 or --budget 50000
const budgetMatch = commandArgs.match(/--?budget[=\s](\d+)/i);
const budget_thb = budgetMatch ? parseInt(budgetMatch[1]) : null;

commandMeta = { brand, budget_thb, args: cleanArgs };

return [{ json: {
  content_raw: rawText,
  content_clean,
  text: content_clean,
  lang_detected,
  isThai: lang_detected === 'th',
  msg_hash,
  hash: msg_hash,
  msg_type,
  isStart:       msg_type === 'start',
  isApproval:    msg_type === 'approval',
  isSave:        msg_type === 'save',
  isCaption:     msg_type === 'caption',
  isDescription: msg_type === 'description',
  isKol:         msg_type === 'kol',
  isCampaign:    msg_type === 'campaign',
  isReport:      msg_type === 'report',
  isChat:        msg_type === 'chat',
  isCommand:     ['caption','description','kol','campaign','report','save'].includes(msg_type),
  saveContent:   msg_type === 'save' ? rawText.replace(/^\/save\s*/i, '').trim() : '',
  commandArgs:   cleanArgs,
  commandMeta,
  user_id: userId, userId,
  chat_id: chatId, chatId,
  firstName: msg.from?.first_name || '',
  username: msg.from?.username || '',
  preprocessed_at: new Date().toISOString(),
  injection_detected
} }];
