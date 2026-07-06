# SkillHive Mobile

If you are reading this, you are looking at the mobile client for SkillHive.

SkillHive is a learning and community platform built for people who want to connect, collaborate, and grow together. This repository contains the mobile app experience: fast, focused, and designed for people interacting in shorter sessions throughout the day.

This repo is tightly connected to **SkillHive-Web**. The web app carries the broader platform surface, while this mobile app translates the same product into a native-first experience that feels right on phones and tablets.

## What this repository is responsible for

This mobile repo is where we deliver SkillHive for handheld devices, including:

- mobile-first onboarding and authentication flows
- learning and community interactions optimized for smaller screens
- push-aware, session-friendly engagement patterns
- native UX conventions, gestures, and navigation structures
- performance-conscious rendering for real-world devices and networks

If a feature is used frequently, time-sensitively, or in quick bursts, mobile experience quality here is critical.

## How this repo relates to SkillHive-Web

The relationship is product-level, not just technical:

- **SkillHive-Web** usually defines broad workflow depth and platform breadth.
- **SkillHive-Mobile** delivers those same core capabilities in a native interaction model.
- Users should never have to “relearn” SkillHive when switching devices.
- Naming, domain rules, and key user flows should remain aligned across both repos.

When web evolves a core flow, mobile should either ship parity or explicitly track the gap with a clear plan.

## Tech profile

This repository is implemented in **TypeScript**.

Contributions should preserve strict typing, predictable state transitions, and maintainable component architecture suitable for long-term mobile product evolution.

## Local development

Clone and install:

```bash
git clone https://github.com/TheLinuxGuy-ssh/SkillHive-Mobile.git
cd SkillHive-Mobile
# npm install | pnpm install | yarn install
```

Run the app in development:

```bash
# npm run dev
# pnpm dev
# yarn dev
```

Use the scripts defined in `package.json` for platform-specific runs, builds, tests, and linting.

Before opening a PR, validate:

```bash
# npm run test
# npm run lint
# npm run build
```

## Engineering expectations

For mobile contributions, hold the line on product clarity and runtime quality.

- Build for constrained environments (battery, memory, variable network conditions).
- Keep interactions obvious and touch-friendly.
- Minimize avoidable re-renders and startup overhead.
- Maintain clean separation between presentation, state, and service layers.
- Treat offline/error states as first-class user experience concerns.

## Cross-repo contribution workflow (Mobile + Web)

When shipping a feature in mobile, always check:

1. Is behavior consistent with SkillHive-Web?
2. Are shared API assumptions still true?
3. Is terminology/copy aligned with web?
4. If parity is incomplete, is there a linked tracking issue?

The goal is one SkillHive product expressed through two platform-appropriate clients.

## Pull requests

A strong PR in this repository includes:

- concise summary of user-facing impact
- screenshots or screen recordings for UI changes
- device/testing notes (OS/version/form factor where relevant)
- performance considerations for complex screens
- explicit references to related web changes or parity tasks

## License

This project is subjected to the PolyForm Noncommercial License 1.0.0