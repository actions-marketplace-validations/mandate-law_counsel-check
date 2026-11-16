// Code rules for the counsel check: what in a diff suggests a counsel trigger.
//
// Each rule belongs to a trigger id from counsel-triggers.json and has one or both of:
//   deps:     package names. Matched only on added lines in dependency manifests (package.json,
//             requirements.txt, Podfile, build.gradle, and so on), as a whole name.
//   patterns: regular expressions. Matched on added lines in any non-manifest, non-lock file.
//
// Rules are deliberately specific (SDK names and telltale APIs), so ordinary code doesn't trip them.
// Triggers with no rules here can't be seen in code (fundraising, incidents, new purposes for data);
// the check lists them for a person to consider, and screens the pull request's own description for them.

export const CODE_RULES = {
  "ai.provider": {
    deps: ["openai", "@anthropic-ai/sdk", "anthropic", "@google/generative-ai", "@google/genai", "google-generativeai", "google-genai",
      "mistralai", "@mistralai/mistralai", "cohere", "cohere-ai", "groq", "groq-sdk", "together-ai", "together", "@aws-sdk/client-bedrock-runtime",
      "@azure/openai", "replicate", "ollama", "litellm", "@ai-sdk/openai", "@ai-sdk/anthropic", "@ai-sdk/google", "langchain-openai", "langchain-anthropic",
      "@langchain/openai", "@langchain/anthropic", "@langchain/google-genai"],
  },
  "ai.feature": {
    deps: ["ai", "langchain", "@langchain/core", "llamaindex", "llama-index", "@vercel/ai", "instructor", "guidance", "dspy"],
    patterns: [/\bchat\.completions\.create\s*\(/, /\bresponses\.create\s*\(/, /\bmessages\.create\s*\(\s*\{[^}]*\bmodel\b/, /\bgenerateContent\s*\(/,
      /\b(generateText|streamText|generateObject|streamObject)\s*\(/, /\bnew\s+Chat(OpenAI|Anthropic|GoogleGenerativeAI)\s*\(/,
      /["'](gpt-[0-9o][\w.-]*|o[134](-mini)?|claude-[\w.-]+|gemini-[\w.-]+)["']/],
  },
  "ai.training": {
    patterns: [/\bfine_tuning\.jobs\b/, /\bfineTuning\.jobs\b/, /\bFineTuningJob\b/, /\bcreate_fine_tuning_job\b/, /\btraining_file\s*[=:]/],
  },
  "agent.remove_confirmation": {
    patterns: [/\b(requireConfirmation|require_confirmation|needsApproval|needs_approval|confirmBeforeAction)\s*[:=]\s*(false|False)\b/,
      /\b(skipConfirmation|skip_confirmation|autoApprove|auto_approve|dangerouslySkipPermissions)\s*[:=]\s*(true|True)\b/],
  },
  "agent.spending": {
    patterns: [/\boff_session\s*[:=]\s*(true|True)\b/, /\boffSession\s*:\s*true\b/, /\bsetup_future_usage\b/, /\bsetupFutureUsage\b/],
  },
  "agent.third_party": {
    deps: ["playwright", "@playwright/test", "playwright-core", "puppeteer", "puppeteer-core", "selenium", "selenium-webdriver",
      "@browserbasehq/stagehand", "@browserbasehq/sdk", "browser-use", "browserbase", "scrapy", "undetected-chromedriver", "crawlee"],
    patterns: [/\bchromium\.launch\s*\(/, /\bpuppeteer\.launch\s*\(/, /\bwebdriver\.(Chrome|Firefox)\s*\(/],
  },
  "agent.talks_to_people": {
    deps: ["twilio", "@vonage/server-sdk", "vonage", "plivo", "retell-sdk", "@vapi-ai/server-sdk", "@vapi-ai/web", "bland"],
    patterns: [/\bcalls\.create\s*\(/],
  },
  "source.sensitive": {
    deps: ["react-native-health", "@kingstinct/react-native-healthkit", "react-native-health-connect", "expo-health-connect",
      "plaid", "plaid-python", "react-plaid-link", "react-native-plaid-link-sdk", "@plaid/link", "mx-platform-node", "teller-connect-react"],
    patterns: [/\bHKHealthStore\b/, /^\s*import\s+HealthKit\b/, /androidx\.health\.connect/, /com\.google\.android\.gms\.fitness/, /\bplaid\.link\b/i],
  },
  "source.device": {
    deps: ["expo-contacts", "react-native-contacts", "expo-location", "react-native-geolocation-service", "@react-native-community/geolocation",
      "expo-camera", "react-native-vision-camera", "expo-image-picker", "react-native-image-picker", "expo-media-library",
      "@react-native-camera-roll/camera-roll", "expo-av", "react-native-audio-recorder-player"],
    patterns: [/\bCNContactStore\b/, /\bCLLocationManager\b/, /navigator\.geolocation\b/, /\bgetUserMedia\s*\(/, /\bPHPhotoLibrary\b/,
      /\bNS(Contacts|Location\w*|Camera|Microphone|PhotoLibrary\w*)UsageDescription\b/,
      /android\.permission\.(READ_CONTACTS|ACCESS_FINE_LOCATION|ACCESS_COARSE_LOCATION|ACCESS_BACKGROUND_LOCATION|CAMERA|RECORD_AUDIO|READ_MEDIA_IMAGES|READ_EXTERNAL_STORAGE)\b/],
  },
  "source.integration": {
    deps: ["@microsoft/microsoft-graph-client", "@slack/web-api", "@slack/bolt", "dropbox", "@notionhq/client", "nylas", "@googleapis/gmail",
      "@googleapis/calendar", "@googleapis/drive", "google-api-python-client"],
    patterns: [/googleapis\.com\/auth\/(gmail|calendar|drive|contacts)/, /["'](Mail\.Read|Mail\.Send|Calendars\.Read|Calendars\.ReadWrite|Files\.Read\.All|Contacts\.Read)["']/],
  },
  "analytics.replay": {
    deps: ["@fullstory/browser", "@fullstory/react-native", "logrocket", "logrocket-react", "@hotjar/browser", "@sentry/replay", "smartlook-client",
      "smartlook-react-native-wrapper", "@microsoft/clarity", "react-native-clarity", "mouseflow", "@datadog/session-replay"],
    patterns: [/\breplaysSessionSampleRate\b/, /\breplaysOnErrorSampleRate\b/, /\bsessionReplaySampleRate\b/, /\bsession_recording\b/,
      /\bdisable_session_recording\s*:\s*false\b/, /\bhotjar\b.*\bhjid\b/i, /\bautocapture\s*:\s*true\b/],
  },
  "analytics.content_event": {
    deps: ["mixpanel", "mixpanel-browser", "mixpanel-react-native", "@amplitude/analytics-browser", "@amplitude/analytics-react-native", "amplitude-js",
      "@segment/analytics-next", "@segment/analytics-node", "@segment/analytics-react-native", "analytics-node", "posthog-js", "posthog-node", "posthog",
      "posthog-react-native", "@heap/heap-react-native", "rudder-sdk-js", "@rudderstack/analytics-js", "@react-native-firebase/analytics"],
    patterns: [/\bmixpanel\.track\s*\(/, /\bposthog\.capture\s*\(/, /\banalytics\.track\s*\(/, /\bamplitude\.track\s*\(/, /\blogEvent\s*\(\s*analytics\b/],
  },
  "analytics.ads": {
    deps: ["react-native-fbsdk-next", "facebook-sdk", "facebook-business", "react-native-appsflyer", "appsflyer-react-native", "react-native-adjust",
      "react-native-branch", "branch-sdk", "react-native-google-mobile-ads", "@react-native-google-mobile-ads/admob", "google-mobile-ads",
      "expo-tracking-transparency", "react-native-tracking-transparency"],
    patterns: [/\bfbq\s*\(/, /\bttq\.(load|track|page)\s*\(/, /\bsnaptr\s*\(/, /\bgtag\s*\(\s*['"]config['"]\s*,\s*['"]AW-/, /\brequestTrackingAuthorization\b/,
      /\bSKAdNetworkItems\b/, /\bAdServices\b/],
  },
  "marketing.channels": {
    deps: ["@sendgrid/mail", "sendgrid", "@mailchimp/mailchimp_marketing", "mailchimp-marketing", "customerio-node", "@customerio/cdp-analytics-node",
      "@braze/web-sdk", "@braze/react-native-sdk", "onesignal-node", "react-native-onesignal", "@onesignal/node-onesignal", "klaviyo-api", "@iterable/web-sdk"],
  },
  "payments.new": {
    deps: ["stripe", "@stripe/stripe-js", "@stripe/react-stripe-js", "@stripe/stripe-react-native", "braintree", "@paypal/react-paypal-js",
      "@paypal/checkout-server-sdk", "square", "@adyen/api-library", "react-native-purchases", "@revenuecat/purchases-js", "react-native-iap",
      "expo-in-app-purchases", "paddle", "@paddle/paddle-js", "lemonsqueezy.js", "@lemonsqueezy/lemonsqueezy.js"],
    patterns: [/\bsubscriptions\.create\s*\(/, /\bcheckout\.sessions\.create\s*\(/, /\bpaymentIntents\.create\s*\(/, /\bpayment_intents\.create\b/,
      /\bSKPaymentQueue\b/, /\bStoreKit\b.*\bProduct\.products\b/, /com\.android\.billingclient/],
  },
  "audience.minors": {
    patterns: [/\b(parental_?consent|parentalConsent|age_?gate|ageGate|is_?minor|isMinor|under_?13|under13|minimum_?age|minimumAge)\b/i, /\bCOPPA\b/],
  },
  "accounts.deletion": {
    patterns: [/\b(delete_?account|deleteAccount|account_?deletion|accountDeletion|data_?retention|dataRetention|retention_?days|retentionDays)\b/i],
  },
};

// Dependency manifests: added lines here are read for package names, not code patterns.
export const MANIFEST_FILES = [
  /(^|\/)package\.json$/, /(^|\/)requirements[^/]*\.txt$/, /(^|\/)pyproject\.toml$/, /(^|\/)Pipfile$/, /(^|\/)setup\.(py|cfg)$/,
  /(^|\/)Podfile$/, /(^|\/)Package\.swift$/, /(^|\/)build\.gradle(\.kts)?$/, /(^|\/)libs\.versions\.toml$/, /(^|\/)pubspec\.yaml$/,
  /(^|\/)Gemfile$/, /(^|\/)go\.mod$/, /(^|\/)Cargo\.toml$/, /(^|\/)composer\.json$/, /(^|\/)app\.json$/,
];
// Lock files and generated files are skipped: they repeat the manifest and would only add noise.
export const SKIP_FILES = [
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Podfile\.lock|Gemfile\.lock|poetry\.lock|Pipfile\.lock|uv\.lock|Cargo\.lock|composer\.lock|go\.sum|pubspec\.lock)$/,
  /(^|\/)(node_modules|vendor|dist|build|\.next|Pods)\//, /\.min\.(js|css)$/, /\.(map|snap)$/,
  /(^|\/)\.counsel\//,
];
