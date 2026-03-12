<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c4771459-3b07-4d4c-aefb-e697cb3ed121

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## NOVA Safeguarding additions

- Signup page: `/signup` — groups can request a workspace which will be posted to your Discord approval webhook.
- API route: `POST /api/discord/submit` — sends a message to the webhook specified by `DISCORD_APPROVAL_WEBHOOK` env var. Set in `.env.local`.
- Workspace placeholders: `/login/[groupId]/[groupName]` and `/[groupId]/[groupName]` (created on approval).

Set environment variable in `.env.local`:

```
DISCORD_APPROVAL_WEBHOOK=https://discord.com/api/webhooks/1480411198330507406/D1nIyrjlJiURolPFRfdIJgeJGrQ1IxLzFgjwWXUOOx3CXslKQy3CEhlw6CA23FIVByjR
```

Notes:
- Internal Mail uses the `internal_mail` Firestore collection.
- Safeguard (CPOMS-like) app is available via the portal and includes basic RBAC checks.

