# Gold Star Day V1 🌟

A real first-version PWA prototype built around:
- calendar-first progress
- color-coded habit stars
- daily habits + weekly routines
- non-punitive Growth Days (+1% per day you show up)
- Bare Minimum Mode
- a nameable Star Jar
- The Cupboard with accessory unlocks
- a Sticker Book
- personal challenges that unlock stickers
- saved local progress
- PWA manifest + service worker
- browser notification permission + test notification

## Run it locally

From this folder:

```bash
python3 -m http.server 8000
```

Then open:

http://localhost:8000

## iPhone / PWA note

For proper Add to Home Screen behavior and reliable web app features, host this folder over HTTPS.

## Notification note

V1 stores preferred reminder times and can request notification permission / show a test notification.
Reliable scheduled notifications while the app is fully closed require a hosted push backend. The service worker already contains a push handler for that next step.

## Data

V1 uses browser localStorage. There are no accounts, analytics, or cloud sync yet.
