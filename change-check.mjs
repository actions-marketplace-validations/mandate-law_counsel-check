// check_change: a quick keyword screen of a planned product change against the counsel triggers in
// site/api/counsel-triggers.json. It flags *possible* matches so an agent can stop and ask a human before
// building that part. It is deliberately cautious (it would rather flag too much than miss something) and is
// not legal advice: a change with no keyword hit can still need review, which is why every answer also
// returns the catch-all questions.
//
// Keywords are matched at word boundaries, case-insensitively. A keyword ending in "*" matches any word that
// starts with it ("purchas*" matches purchase, purchases, purchasing). Keep the ids here in step with
// counsel-triggers.json; a test checks that every trigger has keywords and no keyword points at a missing id.

export const TRIGGER_KEYWORDS = {
  "ai.feature": ["ai", "llm*", "gpt*", "chatbot*", "chat assistant", "assistant", "copilot", "companion", "summar*", "generative", "genai", "ai-generated", "insights", "suggestions"],
  "ai.provider": ["openai", "anthropic", "claude", "gemini", "mistral", "bedrock", "azure openai", "vertex ai", "groq", "together ai", "model provider", "switch model*", "new model", "zero data retention", "zdr", "data retention setting*"],
  "ai.prompt_data": ["prompt*", "rag", "embedding*", "vector store", "context window", "to the model", "to the llm", "to an llm", "into the llm", "into the model", "to openai", "to anthropic", "to claude", "to gemini", "user data", "user content", "user's data", "user messages", "chat history", "journal*", "conversation history"],
  "ai.decisions": ["hiring", "recruit*", "employment", "candidate*", "credit", "loan*", "lending", "underwrit*", "insurance", "housing", "tenant*", "rental application*", "diagnos*", "treatment", "triage", "admission*", "grading", "eligibility", "risk score*", "scoring"],
  "ai.training": ["fine-tun*", "finetun*", "fine tun*", "train on", "training on", "training data", "train the model", "eval set*", "evaluation set*", "evaluate on user*"],
  "agent.new_action": ["on behalf of", "on the user's behalf", "send email*", "send message*", "post to", "posts to", "book*", "reserv*", "purchas*", "buy*", "place order*", "file a", "submit form*", "run code", "execute code", "code execution", "take action*", "autonomous*"],
  "agent.remove_confirmation": ["confirmation", "confirm step", "skip approval", "auto-approve", "auto approve", "without asking", "without confirmation", "scheduled action*", "scheduled task*", "scheduled purchase*", "recurring action*", "recurring order*", "standing instruction*", "autopilot", "background task*"],
  "agent.spending": ["pay", "pays", "payment*", "checkout", "spend*", "stored card*", "card on file", "saved card*", "wallet*", "stripe", "funds", "transfer money", "money transfer*"],
  "agent.third_party": ["scrap*", "crawl*", "browser automation", "headless", "playwright", "puppeteer", "selenium", "log in as", "login as", "sign in as", "user's credentials", "user credentials", "store password*", "stored password*", "password*", "credential*", "computer use"],
  "agent.talks_to_people": ["phone call*", "voice call*", "call people", "calls people", "outbound", "cold email*", "outreach", "text people", "message people", "email people", "contact people", "non-users", "non users"],
  "data.secondary_use": ["research", "aggregate*", "benchmark*", "compare users", "across users", "dataset*", "sell data", "data sale*", "monetiz*", "marketing use", "anonymized data", "de-identified"],
  "source.sensitive": ["health data", "health app*", "health record*", "health information", "health metric*", "health tracking", "healthkit", "google fit", "health connect", "wearable*", "fitbit", "oura", "apple watch", "garmin", "medical", "symptom*", "mental health", "bank account*", "banking", "plaid", "financial account*", "brokerage", "credit card*", "bank transactions", "financial transactions", "spending data"],
  "source.device": ["contacts", "address book", "photo*", "camera", "microphone", "mic", "location", "gps", "geolocation", "bluetooth", "screen recording"],
  "source.integration": ["calendar", "gmail", "outlook", "inbox", "email integration", "google drive", "dropbox", "onedrive", "box.com", "slack", "notion", "imessage", "whatsapp", "messaging integration", "oauth integration", "connect account*", "sync with google", "sync with apple"],
  "sharing": ["share", "shares", "sharing", "shared space*", "public profile*", "profiles", "follow*", "friends", "connections", "community", "collaborat*", "user comment*", "comments section", "commenting", "invite*", "social"],
  "analytics.replay": ["session replay", "replay", "heatmap*", "autocapture", "auto-capture", "fullstory", "hotjar", "logrocket", "smartlook", "microsoft clarity", "mouseflow", "posthog recording*"],
  "analytics.content_event": ["analytics", "tracking", "track event*", "analytics event*", "event propert*", "mixpanel", "amplitude", "segment analytics", "segment.io", "posthog", "heap analytics", "log the prompt", "log prompts", "log user input", "log what the user typed"],
  "analytics.ads": ["ad", "ads", "advertis*", "admob", "pixel", "meta pixel", "facebook sdk", "tiktok pixel", "google ads", "appsflyer", "adjust sdk", "branch.io", "attribution", "retarget*"],
  "marketing.channels": ["push notification*", "marketing email*", "newsletter*", "sms", "text message*", "drip", "promotional", "re-engagement", "win-back"],
  "payments.new": ["subscription*", "paywall", "in-app purchase*", "iap", "pricing", "referral*", "promo*", "coupon*", "discount*", "usage-based", "metered", "billing", "free trial*", "web checkout"],
  "audience.minors": ["kid*", "child*", "teen*", "minor*", "student*", "school*", "under 18", "under 13", "under-13", "coppa", "parent*", "classroom*"],
  "audience.new_market": ["eu", "europe*", "uk", "united kingdom", "canada", "international*", "gdpr", "worldwide", "global launch", "new country", "android", "ios", "app store", "google play", "employer*", "enterprise customer*", "hospital*", "clinic*", "health provider*", "health system*"],
  "accounts.deletion": ["delet*", "retention", "retain*", "keep data", "data export", "disconnect*", "sync to the server", "sync to server", "cloud backup", "move to the cloud", "upload local", "on-device data"],
  "vendor.new_function": ["vendor*", "third-party service*", "third party service*", "new provider", "new sdk", "sdk", "outside the us", "outside the united states", "data center*", "hosting region", "eu region"],
  "company.change": ["fundrais*", "raising money", "seed round", "series a", "series b", "investor*", "acquisition", "acquire*", "merger", "merge with", "new entity", "incorporat*", "spin out", "spin-off"],
  "incident": ["breach*", "incident*", "leak*", "exposed", "compromis*", "hack*", "unauthorized", "vulnerab*", "ransomware", "phishing", "data loss", "never authorized", "didn't authorize", "did not authorize"],
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toRegex = (kw) => {
  const prefix = kw.endsWith("*");
  const body = escape(prefix ? kw.slice(0, -1) : kw).replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${body}${prefix ? "" : "(?![a-z0-9])"}`, "i");
};
const COMPILED = Object.fromEntries(
  Object.entries(TRIGGER_KEYWORDS).map(([id, kws]) => [id, kws.map((k) => [k.replace(/\*$/, ""), toRegex(k)])]),
);

// Returns [{ id, matched_terms }] in the order the triggers are listed, using the trigger ids given.
export function matchTriggers(text, triggerIds) {
  const t = String(text || "");
  const out = [];
  for (const id of triggerIds) {
    const hits = (COMPILED[id] || []).filter(([, re]) => re.test(t)).map(([k]) => k);
    if (hits.length) out.push({ id, matched_terms: [...new Set(hits)].slice(0, 5) });
  }
  return out;
}
