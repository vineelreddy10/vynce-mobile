# Vynce Mobile

React + Capacitor dating application frontend.

## Setup

```bash
git clone <repo-url> vynce-mobile
cd vynce-mobile
npm install
cp .env.example .env  # edit VITE_API_URL if needed
```

## Run (browser)

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## Run (Android)

```bash
npm run build
npx cap sync android
npx cap open android
```

Then build and run from Android Studio.

## Run (iOS)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Then build and run from Xcode.

## Folder Structure

```
src/
├── api/          # API client (Axios)
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── layouts/      # Route layouts
├── lib/          # Utility libraries (cn helper)
├── pages/        # Route pages
├── routes/       # React Router config
├── services/     # Service layer
├── store/        # State management
├── types/        # TypeScript types
└── utils/        # Utility functions
```

## Tech Stack

| Tool         | Purpose            |
| ------------ | ------------------ |
| Vite         | Build tool         |
| React 19     | UI framework       |
| TypeScript 6 | Type safety        |
| Capacitor    | Native mobile      |
| React Router | Client-side routing |
| TanStack Query | Server state     |
| Axios        | HTTP client        |
| Tailwind CSS | Utility-first CSS  |
| shadcn/ui    | Component primitives |
