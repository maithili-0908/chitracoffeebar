# Chitra Coffee Bar

MERN stack ecommerce and billing app for Chitra Coffee Bar.

## Folders

- `client` - React, Vite, Tailwind CSS frontend
- `server` - Express, MongoDB, Mongoose backend

## Run Locally

Install dependencies:

```bash
npm run install:all
```

Create environment files:

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Start MongoDB locally, then run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend API: `http://localhost:5000/api`

## Main Features

- Login, sign in/register, and forgot password flow
- Admin and worker roles
- Worker category and item entry
- Item display grouped by category on the home page
- Search with suggestions and category filter
- Billing cart with quantity checks and discount
- Admin dashboard for workers, items, profit, daily, weekly, and monthly sales charts
