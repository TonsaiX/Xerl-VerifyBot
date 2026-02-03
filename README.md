# xerl-verify (Bot + API + Web)

## Dev (localhost)
1) Install
- npm i

2) DB
- import schema.sql ไป Postgres
- set DATABASE_URL ใน apps/api/.env

3) Run
- npm run dev:api
- npm run dev:web
- npm run dev:bot

4) Register commands
- npm run register

## Flow
- /setup-verify ส่ง embed + ปุ่ม
- กด Verify -> bot ขอ sid จาก API -> ส่งลิ้งไปหน้าเว็บ /verify/start
- เว็บเรียก API /auth/discord/login?sid=...
- callback -> API redirect กลับเว็บ /verify?token=...
- Turnstile ผ่าน -> POST /api/verify/complete -> API ใส่ role ให้ user
