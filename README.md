# YouTube Clone — MERN Video Platform

A full-stack video application for discovering videos, managing creator channels, and joining conversations through comments and reactions. Built with React, Redux Toolkit, Node.js, Express, and MongoDB.

**Author:** Deb Gourab Biswas  
**Repository:** [debgourab/Youtube-mern](https://github.com/debgourab/Youtube-mern)

## Features

- Search videos by title and filter by category.
- Watch public direct-media links and embedded YouTube videos, with playback errors and retry controls.
- Create and manage channels, publish video metadata, and edit or delete your own videos.
- Register and sign in with JWT authentication and bcrypt password hashing.
- Like/dislike videos and create, edit, or delete your own comments.
- Navigate through a responsive sidebar and an accessible mobile/watch-page drawer.
- Load pages and images lazily, with loading skeletons and route error recovery.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, CSS, Lucide React |
| State and requests | Redux Toolkit, React Redux, RTK Query, Axios |
| Backend | Node.js, Express, JWT, bcryptjs |
| Database | MongoDB, Mongoose |
| Quality | ESLint, Node.js test runner, Playwright, GitHub Actions |
| Deployment | Render backend, Vercel frontend |

## Architecture

The React client calls the Express REST API. Mongoose models store users, channels, video metadata, and comments in MongoDB. Protected API routes validate JWTs and check ownership before allowing changes.

Redux slices manage authentication and navigation state. RTK Query caches the video feed and invalidates it after publishing or deleting videos. Forms keep their state locally. Routing uses `createBrowserRouter`, `React.lazy`, and `Suspense`.

| Path | Purpose |
| --- | --- |
| [client/src/pages/](client/src/pages/) | Home, authentication, watch, channel, and studio pages |
| [client/src/components/](client/src/components/) | Shared navigation, video cards, player, and filters |
| [client/src/store/](client/src/store/) | Redux slices, store configuration, and RTK Query |
| [client/src/context/](client/src/context/) | Compatibility hook for Redux authentication |
| [client/src/utils/](client/src/utils/) | Media, password, formatting, and session helpers |
| [client/src/router.jsx](client/src/router.jsx) | Routes and protected-page handling |
| [client/src/styles.css](client/src/styles.css) | Responsive layouts and component styles |
| [client/tests/](client/tests/) | Client utility tests |
| [client/e2e/](client/e2e/) | Desktop and mobile browser tests |
| [server/src/models/](server/src/models/) | User, Channel, Video, and Comment schemas |
| [server/src/routes/](server/src/routes/) | Authentication, channels, videos, and comments API |
| [server/src/middleware/](server/src/middleware/) | Authentication middleware |
| [server/src/data/seed.js](server/src/data/seed.js) | Optional development demo data |
| [server/tests/](server/tests/) | Validation and API tests |
| [.github/workflows/quality.yml](.github/workflows/quality.yml) | Automated quality checks |
| [render.yaml](render.yaml) / [netlify.toml](netlify.toml) | Hosting configuration |

## Run locally

### 1. Clone and install

Use Node.js 22 and a local MongoDB instance or MongoDB Atlas database.

```bash
git clone https://github.com/debgourab/Youtube-mern.git
cd Youtube-mern
npm ci
npm ci --prefix client
npm ci --prefix server
```

### 2. Configure the environment

Copy [server/.env.example](server/.env.example) to `server/.env`, and [client/.env.example](client/.env.example) to `client/.env`.

Server configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/youtube_clone_capstone
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://127.0.0.1:5173
```

Client configuration:

```env
VITE_API_URL=http://localhost:5000/api
```

For Atlas, replace `MONGODB_URI` with your connection string and configure database-user and network access. Keep credentials in environment variables; do not commit `.env` files.

### 3. Start the application

From the repository root:

```bash
npm run dev
```

- Frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API base URL: [http://localhost:5000/api](http://localhost:5000/api)
- API status: [http://localhost:5000/](http://localhost:5000/)

To start services separately, use `npm run server` and `npm run client` in separate terminals.

### Load the included sample videos

The repository includes 9 sample video entries in `server/src/data/seed.js`. Deploying the code does not insert them into MongoDB.

1. In your private `server/.env`, set `MONGODB_URI` to the exact Atlas URI used by the Render service, including its database name.
2. Add `SEED_DEMO_PASSWORD` with a private strong password (8+ characters, uppercase, lowercase, number and symbol; no spaces). Do not commit this value.
3. From the repository root, run:

```bash
npm ci --prefix server
cd server
npm run seed
```

Run this once, from one terminal. Your computer must be allowed in Atlas Network Access. If using an available Render Shell instead, configure `SEED_DEMO_PASSWORD` in Render and run `npm run seed` from the service's `server` root.

The command skips databases that already contain videos. Reset options are rejected, and existing demo accounts/channel handles cause a safe stop before writes. It does not overwrite their passwords or delete data. If a run fails partway through, inspect the database before retrying; seeding is not transactional.

New demo accounts are `deb@example.com` and `maya@example.com`, using your private seed password. The password is never printed by the script. The 9 cards use the same sample MP4 source; they are demo metadata, not nine distinct uploaded files.

After success, check [the video API](https://youtube-mern-e0iu.onrender.com/api/videos) and refresh [the frontend](https://youtube-mern-deb.vercel.app/). No redeployment is needed for database-only changes. An empty `[]` means the selected database has no videos. To restore personally uploaded local videos instead, transfer the related local database records to Atlas.

## Application routes

| Route | Page |
| --- | --- |
| `/` | Video feed, search, and category filters |
| `/auth` | Registration and sign-in |
| `/watch/:id` | Player, reactions, comments, and related videos |
| `/channel/:id` | Public channel page |
| `/studio` | Protected channel and video management |

## Video publishing

Sign in, open Creator Studio, create or select a channel, and enter the video's title, description, thumbnail URL, category, and video URL. Use **Preview video**, then **Add video**.

The application stores video URLs and metadata; it does not upload or transcode binary video files.

Supported sources include public MP4, WebM, Ogg/OGV, and M4V URLs, plus YouTube watch, share, shorts, live, and embed links. Use HTTPS media on an HTTPS deployment. Private or expired URLs, embedding restrictions, blocked hosts, and unsupported codecs can prevent playback. Drive page links and extensionless streaming endpoints are not supported.

## Authentication and API

New passwords require at least eight characters, uppercase and lowercase letters, a number, and a special character. Whitespace is disallowed, and the maximum is 72 UTF-8 bytes.

Use `Content-Type: application/json` for JSON requests. Protected endpoints also require:

```text
Authorization: Bearer <JWT_TOKEN>
```

| Method | Endpoint (relative to /api) | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Sign in and receive a token |
| GET | `/auth/me` | Read the signed-in user |
| GET | `/videos?search=React&category=React` | List, search, and filter videos |
| GET | `/videos/:id` | Get video, comments, and related videos |
| POST | `/videos` | Publish video metadata |
| PUT / DELETE | `/videos/:id` | Edit or delete an owned video |
| PUT | `/videos/:id/like`, `/videos/:id/dislike` | Toggle reactions |
| POST | `/channels` | Create a channel |
| GET | `/channels/mine` | List your channels |
| GET | `/channels/user/:userId` | List a user's channels |
| GET / PUT | `/channels/:id` | Read a channel or update an owned channel |
| GET / POST | `/videos/:videoId/comments` | Read or create comments |
| PUT / DELETE | `/comments/:id` | Update or delete an owned comment |

### Quick Postman / Thunder Client check

Register with `POST /api/auth/register`:

```json
{
  "username": "demoCreator",
  "email": "creator@example.com",
  "password": "CreatorPass1!"
}
```

Expect `201 Created`. Then call `POST /api/auth/login`:

```json
{
  "identifier": "creator@example.com",
  "password": "CreatorPass1!"
}
```

Expect `200 OK`. Copy the returned token into the Bearer authorization header and call `GET /api/auth/me`. Invalid registration input returns `400`, invalid credentials return `401`, and duplicate accounts return `409`.

For a complete manual flow, create a channel in Studio, publish a supported video link, play it, test reactions and comments, then edit and delete your own content. Use another account to check ownership restrictions and repeat at mobile width.

## Tests and production build

Run from the repository root:

```bash
npm run lint
npm test --prefix client
npm test --prefix server
npm run build
```

For browser tests:

```bash
cd client
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs clean dependency installs, linting, validation tests, the production build, and desktop/mobile Playwright tests. Browser tests mock API responses and generate a real WebM fixture to verify playback; live database persistence and third-party media availability require separate deployment checks.

The frontend build is written to `client/dist/`.

## Deployment

| Setting | Render backend | Vercel frontend |
| --- | --- | --- |
| Branch | `main` | `main` |
| Root directory | `server` | `client` |
| Install/build | `npm ci` | Install: `npm ci`; build: `npm run build` |
| Start command | `npm start` | — |
| Output directory | — | `dist` |
| Node version | 22 | 22.x |

- **Render:** set `MONGODB_URI` to your private Atlas URI with the correct database name; set a private `JWT_SECRET`; set `CLIENT_URL=https://youtube-mern-deb.vercel.app` and `NODE_ENV=production`.
- **Vercel Production:** set `VITE_API_URL=https://youtube-mern-e0iu.onrender.com/api`. Rebuild the frontend after changing this value.
- **One-time sample data:** follow "Load the included sample videos" above. Keep `npm start` as the start command; do not seed on every deployment.
- Atlas must allow the backend's outbound IP ranges and the database user must have read/write access to the selected database.
- Keep `CLIENT_URL` as the exact frontend origin, without a trailing slash. Other preview domains require explicit CORS support.

The API status endpoint is [the backend root](https://youtube-mern-e0iu.onrender.com/). Successful status alone does not mean sample videos have been inserted. MongoDB credentials and seed passwords belong only in private backend environment variables, never Vercel's client variables or committed files.

## Author

**Deb Gourab Biswas**

- [GitHub profile](https://github.com/debgourab)
- [Project repository](https://github.com/debgourab/Youtube-mern)

This is an independent learning and portfolio project inspired by YouTube, with no affiliation to YouTube or Google.
