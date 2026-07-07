---
title: Haqdaar
emoji: 🇮🇳
colorFrom: blue
colorTo: yellow
sdk: static
pinned: false
---

# Haqdaar — "Which government schemes am I entitled to?"

A fast, mobile-first, client-side-only web app for India. A 5-screen flow
(Welcome → Profile → Life situation → Your schemes → How to claim) takes
under a minute and tells users which central government schemes they
likely qualify for — with a plain-language reason, the documents needed,
and the exact steps to apply.

No backend, no login, no data collection: everything runs in the browser.
That makes it trivially cheap to host and instantly fast, at the cost of
not having a lead-capture funnel (see "Monetization" below for how to add
one later without changing this architecture).

## Stack

Plain HTML/CSS/vanilla JS — no build step, no framework, no dependencies.
Chosen so the whole app is inspectable, fast on low-end Android phones on
patchy connections, and trivial to deploy as a static site.

```
index.html          The 5-screen markup
css/style.css        All styling
data/schemes.js       22 schemes: benefit, documents, apply steps, criteria
js/i18n.js            English / Hindi / Marathi UI strings
js/matcher.js          Pure eligibility-matching + reason-generation logic
js/app.js              State machine: navigation, chip toggles, rendering
```

## Running locally

No build step needed — just serve the folder statically:

```bash
cd /Users/Viyom/projects/haqdaar
python3 -m http.server 8090
```

Visit http://127.0.0.1:8090

## How eligibility matching works

The form only ever asks for: age, state, an income bracket, a single
occupation, and up to 9 optional life-situation flags (owns farmland, new
mother, girl child under 10, senior 60+, disability, widow, street vendor,
artisan/craft, unorganised worker). `js/matcher.js` checks each scheme's
`criteria` in `data/schemes.js` against that profile and returns matches
sorted by a hand-tuned `priority` field (guaranteed cash-transfer schemes
like PM-KISAN rank above conditional loan schemes), along with an
auto-generated "why you qualify" reason string.

This is a simplified screening tool, not an official eligibility ruling —
several real schemes' official criteria depend on things this flow doesn't
ask (BPL card, land title, gender, social category). Where that's true,
`data/schemes.js` approximates using the closest signal it does collect
(usually the income bracket) and calls this out in each scheme's
`description`. The footer disclaimer on every screen says the same to users.

## Adding or editing schemes

Edit the `SCHEMES` array in `data/schemes.js`. Each entry's `criteria` can
use: `minAge`, `maxAge`, `maxIncome`, `occupations` (array), any of the
9 `requires*` flags, or `anyFlags` (array of flag keys, at least one must
be true). No other file needs to change — the results and detail screens
render whatever matches.

## i18n

`js/i18n.js` exports one `I18N` object keyed by `en`/`hi`/`mr`. Language
switching only happens on the welcome screen (matching the design), but
`applyTranslations()` re-renders every screen's text immediately so a user
who already progressed further and comes back to change language sees it
update everywhere.

## Monetization

Shipped as a pure client-side MVP with no lead capture, by design — the
goal for v1 is proving the eligibility engine and UX are good enough that
people actually use and share it. Natural next steps once it has traffic,
without a rewrite:

- **Lead generation**: add a lightweight serverless function (or bring back
  a small Flask/Node backend) behind the existing "Apply now" / a new "Get
  help applying" button, to capture name + phone for referral to CSC
  operators or scheme-filing consultants. This is the same model used in
  the earlier `govt-schemes-finder` Flask prototype in this workspace.
- **Ads**: since it's static, a simple AdSense unit can slot into
  `index.html` once there's organic traffic.
- **Affiliate**: partner links (insurance, CA services) contextual to the
  matched scheme category.

## Before going live

- Double-check every scheme's criteria, benefit amount, and `applyUrl`
  against the current official source — thresholds and portals change.
- Consider adding more Indian languages — UI strings are centralized in
  one file, so adding a language is additive, not a rewrite.
- Deploy as a static site (Netlify, Vercel, GitHub Pages, Render static
  site) — no server needed for the current architecture.
