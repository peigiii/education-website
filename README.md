# education-website

Web technology project.

## Backend (Node.js + Express + MongoDB Atlas)

- Location: `backend/`
- Install: `npm install`
- Run: `npm start` (or `npm run dev`)
- Health check: `GET http://localhost:5001/api/health` (port comes from `backend/.env`)

### Environment

- Copy `backend/.env.example` to `backend/.env`
- Fill in `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_ORIGIN`
- `backend/.env` is ignored by git (do not upload secrets)

## API Contract

See `backend/openapi.yaml`.
