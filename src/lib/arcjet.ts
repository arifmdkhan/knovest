// import "server-only"

import arcjet, {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
} from "@arcjet/next";


export {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
};


export default arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
      ],
    }),
  ],
});

export const globalShield = shield({
  mode: "LIVE",
});

export const botProtection = detectBot({
  mode: "LIVE",
  allow: [
    "CATEGORY:SEARCH_ENGINE",
    "CATEGORY:MONITOR",
    "CATEGORY:PREVIEW",
  ],
});

export const apiRateLimit = slidingWindow({
  mode: "LIVE",
  interval: "1m",
  max: 100,
});

export const authRateLimit = fixedWindow({
  mode: "LIVE",
  window: "1m",
  max: 10,
});