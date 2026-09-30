# YouTube MERN — Video Sharing Platform

A full-stack, YouTube-inspired application for discovering videos, managing creator channels, and building a personal video library. Built with React, Redux Toolkit, Node.js, Express, and MongoDB, with the frontend deployed on Vercel and the API on Render.

**Developed by [Deb Gourab Biswas](https://github.com/debgourab)**

[Live Demo](https://youtube-mern-deb.vercel.app/) · [Backend API](https://youtube-mern-e0iu.onrender.com/) · [GitHub Repository](https://github.com/debgourab/Youtube-mern)

## Project Overview

This project brings together responsive frontend development, REST API design, authentication, and MongoDB data modeling in a complete client–server application.

Visitors can browse and search the video feed. Registered users can create channels, publish video links, manage their content, leave comments, react to videos, and save content for later.

| Resource | Link |
| --- | --- |
| Frontend | https://youtube-mern-deb.vercel.app/ |
| Backend status | https://youtube-mern-e0iu.onrender.com/ |
| Video API | https://youtube-mern-e0iu.onrender.com/api/videos |
| Source code | https://github.com/debgourab/Youtube-mern |
| Author | [Deb Gourab Biswas](https://github.com/debgourab) |

## Key Features

### Video Discovery & Playback

- Search videos by title and filter the feed by category.
- Watch supported direct video URLs and embedded YouTube videos.
- Explore related videos based on category or channel.
- Navigate a responsive interface with a collapsible sidebar.
- See loading skeletons, empty states, and request error feedback.

### Authentication & Creator Tools

- Register and sign in with JWT authentication and bcrypt password hashing.
- Validate password strength and protect authenticated routes.
- Create and edit creator channels.
- Publish video metadata, including title, description, thumbnail, category, and video URL.
- Edit or delete owned videos with server-side ownership checks.

### Engagement & Personal Library

- Like or dislike videos.
- Add, edit, and delete your own comments.
- Subscribe to channels and browse their videos.
- Access watch history, liked videos, watch later, and a saved-video playlist.

## Engineering Highlights

- **State management:** Redux Toolkit manages authentication and interface state; RTK Query caches video feed requests and supports cache invalidation.
- **API integration:** A shared Axios client attaches authentication tokens, applies request timeouts, and handles expired sessions.
- **Database relationships:** Mongoose models connect users, channels, videos, and comments through document references.
- **Authorization:** Backend middleware validates JWTs, while resource-level checks restrict content changes to the owner.
- **Input handling:** Server-side validation checks passwords, video metadata, media URLs, and categories; search terms are escaped before regex queries.
- **Frontend structure:** Reusable components, lazy-loaded route pages, image fallbacks, and React Router hash routing support maintainable navigation.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, JavaScript, Vite, CSS, Lucide React |
| Routing & state | React Router, Redux Toolkit, React Redux, RTK Query |
| HTTP client | Axios |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| Validation & quality | ESLint, Node.js test runner |
| Deployment | Vercel, Render, MongoDB Atlas |
| Version control | Git, GitHub |

## Architecture

The React client sends HTTP requests to the Express API. Public routes serve video and channel content; protected routes validate the user's JWT before processing account-specific actions. Mongoose handles persistence and relationships in MongoDB.

The application stores **video URLs and metadata**. Playback uses external media sources or YouTube embeds; the backend does not upload, store, or transcode video files.

## Repository Structure

| Path | Responsibility |
| --- | --- |
| `client/src/components/` | Header, sidebar, video cards, player, filters, and error UI |
| `client/src/pages/` | Feed, authentication, watch, channel/studio, and library pages |
| `client/src/store/` | Redux slices and RTK Query video API |
| `client/src/utils/` | Media, password, session, and image helpers |
| `client/src/api.js` | Shared Axios configuration |
| `client/src/router.jsx` | Lazy-loaded routes and protected navigation |
| `server/src/models/` | User, Channel, Video, and Comment schemas |
| `server/src/routes/` | Authentication, channel, video, comment, and library endpoints |
| `server/src/middleware/` | Authentication and authorization helpers |
| `server/src/data/seed.js` | One-time sample data setup |
| `server/tests/` | Authentication validation and utility tests |

## Run Locally

### Prerequisites

- Node.js 22 and npm
- MongoDB running locally, or a MongoDB Atlas database
- Git

### 1. Clone and Install

```bash
git clone https://github.com/debgourab/Youtube-mern.git
cd Youtube-mern
npm ci
npm ci --prefix client
npm ci --prefix server
```

### 2. Configure Environment Variables

Copy `server/.env.example` to `server/.env`, then configure:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/youtube_clone_capstone
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://127.0.0.1:5173
```

For Atlas, use your own connection string, database name, database user, and network access settings.

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Keep real credentials in private environment variables. Do not commit `.env` files or expose backend secrets through client variables.

### 3. Start the Application

From the repository root:

```bash
npm run dev
```

| Service | Local URL |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| Backend | http://localhost:5000 |
| Video API | http://localhost:5000/api/videos |

## Load the Included Sample Videos

The repository includes **9 sample video entries**. Deploying the source code does not automatically insert them into MongoDB.

1. Set `MONGODB_URI` in your private `server/.env` to the database you want to populate. To populate the deployed site, use the same Atlas database as Render.
2. Add `SEED_DEMO_PASSWORD` with a private password containing at least eight characters, uppercase, lowercase, a number, and a symbol, with no spaces. Quote the value in your `.env`.
3. Run from the repository root:

```bash
npm run seed
```

The command skips databases that already contain videos, rejects reset options, and stops before replacing existing demo accounts or channel handles. Run it once from one terminal. If a run fails partway through, inspect the database before retrying; the operation is not transactional.

New sample accounts are `deb@example.com` and `maya@example.com`, using the password you configured. No public default password is provided.

All nine entries reference the same sample MP4, with different demo metadata and thumbnails. They do not represent nine distinct uploaded videos. Personally added local records require a separate database transfer.

After successful seeding, refresh the site. No redeployment is required for database-only changes.

## API Overview

Base URL: `https://youtube-mern-e0iu.onrender.com/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register an account |
| POST | `/auth/login` | Sign in and receive a JWT |
| GET | `/auth/me` | Retrieve the authenticated user |
| GET | `/videos` | List videos; supports `search` and `category` |
| GET | `/videos/:id` | Retrieve a video, comments, and related content |
| POST | `/videos` | Publish video metadata |
| PUT / DELETE | `/videos/:id` | Update or delete an owned video |
| PUT | `/videos/:id/like`, `/videos/:id/dislike` | Toggle reactions |
| POST | `/channels` | Create a channel |
| GET / PUT | `/channels/:id` | Read or update a channel |
| GET / POST | `/videos/:videoId/comments` | Read or add comments |
| PUT / DELETE | `/comments/:id` | Edit or delete an owned comment |
| GET | `/library/:section` | Retrieve a personal library section |

Protected endpoints require:

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```

## Quality Checks

Run from the repository root:

```bash
npm run lint
npm test --prefix server
npm run build
```

The backend tests cover authentication input rejection and validation utilities. They do not replace a live database or browser integration check. The production frontend build is generated in `client/dist/`.

For manual verification, register an account, create a channel, publish a supported video link, and check playback, reactions, comments, saved videos, and ownership restrictions.

## Deployment

| Setting | Render Backend | Vercel Frontend |
| --- | --- | --- |
| Branch | `main` | `main` |
| Root directory | `server` | `client` |
| Runtime/framework | Node.js 22 | Vite / Node.js 22.x |
| Install/build | `npm ci` | Install: `npm ci`; build: `npm run build` |
| Start command | `npm start` | — |
| Output directory | — | `dist` |

**Render environment**

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Private Atlas connection string with the correct database name |
| `JWT_SECRET` | Private, randomly generated secret |
| `CLIENT_URL` | `https://youtube-mern-deb.vercel.app` |
| `NODE_ENV` | `production` |

**Vercel production environment**

```env
VITE_API_URL=https://youtube-mern-e0iu.onrender.com/api
```

Rebuild the frontend after changing its environment variables. Keep `CLIENT_URL` equal to the exact frontend origin, without a trailing slash. Additional preview domains need explicit CORS support.

Seed data separately from deployment; keep `npm start` as the backend start command. A successful API status response confirms the server is running, while an empty `/api/videos` response (`[]`) means the selected database has no video records.

## Scope & Limitations

- External media must remain publicly accessible and permit playback or embedding.
- Related videos are selected by category or channel, without a machine-learning recommendation system.
- The Shorts view displays a subset of the feed, without a dedicated short-form upload pipeline.
- The Downloads collection stores saved video references; it does not provide offline video storage.

## Author

**Deb Gourab Biswas**  
Full Stack Developer · MERN Stack · React.js

- **GitHub:** [github.com/debgourab](https://github.com/debgourab)
- **Repository:** [Youtube-mern](https://github.com/debgourab/Youtube-mern)
- **Live application:** [youtube-mern-deb.vercel.app](https://youtube-mern-deb.vercel.app/)

Built as a learning and portfolio project. This application is independently developed and is not affiliated with YouTube or Google.
