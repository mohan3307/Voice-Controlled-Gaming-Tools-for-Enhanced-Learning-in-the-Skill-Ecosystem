# Voice Controlled Gaming Tools For Enhanced Learning In the Skill Ecosystem

An enterprise-grade, gamified learning platform where students can control coding sandboxes, multiple choice quizzes, and scenario-based RPG quests using browser Web Speech API voice commands instead of mouse/keyboard events.

---

## Technical Stack
- **Frontend Layer**: React.js, TypeScript, Vite, Tailwind CSS, Framer Motion (premium animations), Recharts (graphs charts), Socket.IO-Client, Canvas Confetti.
- **Backend Layer**: Node.js, Express, TypeScript, Mongoose, Socket.IO (multiplayer speed matching), JWT passport checks, Helmet (secure request headers).
- **Database Layer**: MongoDB (collections for players, paths, activity progression logs, achievements, and security audit logs).

---

## Workspace Directory Tree
```text
/
├── package.json               # Root concurrent scripts orchestrator
├── .env.example               # Environmental variables config template
├── README.md                  # Detailed Documentation Manual
├── server/
│   ├── package.json           # Server module manifests
│   ├── tsconfig.json          # TypeScript engine configuration
│   └── src/
│       ├── server.ts          # Server listener, websockets, routing mounts
│       ├── config/            # Security settings
│       ├── models/            # Mongoose schemas (User, Skill, Game, Progress, Audit)
│       ├── middleware/        # JWT auth, rateLimit restrictions
│       ├── routes/            # REST API endpoints (Auth, Skills, Games, Analytics, Admin)
│       ├── services/          # Coach Advice, Adaptive Difficulty computations
│       └── seed/
│           └── seed.ts        # Database mock indicators seeds generator
└── client/
    ├── package.json           # Client build bundles manifest
    ├── index.html             # Document wrapper mounting Google Fonts
    ├── tailwind.config.js     # Glowing shadows and futuristic layouts settings
    ├── postcss.config.js      # PostCSS configurations
    ├── vite.config.ts         # Vite bundle proxy configuration
    └── src/
        ├── main.tsx           # React bootloader script
        ├── App.tsx            # Main router and paths distributor
        ├── index.css          # Injected waveforms styling
        ├── components/        # SVG SkillTree grids, floating speech circles
        ├── context/           # Authorization states, Web Speech speech recog trackers
        └── pages/             # Dashboard, MultiplayerArena, Coding Battle, CreativeStudio
```

---

## Architectural Mechanisms

### 1. Voice Command Engine
- Utilizing browser `webkitSpeechRecognition` to decode vocal commands (confidence metrics output, error logs).
- Fallback keyboard hooks allow traditional selections if microphone permissions are denied.
- Built-in Text-To-Speech (`SpeechSynthesis`) vocalizes question prompts, clues, and successful outcomes.

### 2. Adaptive Difficulty Algorithm
- Evaluates student correction scores and speech latency averages over their last 3 levels.
- Automatically adjusts difficulties between **Easy**, **Medium**, **Hard**, and **Expert** targets to optimize retention.

### 3. AI Learning Coach
- Scans user progress logs to identify strengths (completed topics) and weaknesses (unlocked nodes with low accuracy).
- Suggests customized paths and points focus cards immediately on the student's dashboard.

### 4. Multiplayer Arena
- Incorporates WebSocket (Socket.IO) rooms.
- Competitors join the lobby via code and compete in a speed challenge, where options spoken vocally increment points on a comparative score slider in real time.

---

## Local Development Setup

### Prerequisites
- Install **Node.js** (v18+)
- Ensure local **MongoDB** port `27017` is active and running.

### Installation Steps

1. **Bootstrap Workspace Dependencies**
   Run the root bootstrap script to install server and client modules concurrently:
   ```bash
   npm run bootstrap
   ```

2. **Execute Database Seed**
   Import default dummy items (quizzes, coding blocks, RPG stages, and accounts) to seed your DB:
   ```bash
   npm run seed
   ```

3. **Spin Up Development Servers**
   Boot the Express sever (port 3000) and the Vite client (port 5173) simultaneously:
   ```bash
   npm run dev
   ```

4. **Verify System Access**
   Browse to [http://localhost:5173](http://localhost:5173) in your browser.
   - **Student login**: `student@skills.edu` (pw: `password123`)
   - **Instructor login**: `instructor@skills.edu` (pw: `password123`)
   - **Admin login**: `admin@skills.edu` (pw: `password123`)

---

## API Summary Matrix

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new profile accounts |
| `POST` | `/api/auth/login` | Public (rate limited) | Authenticate user credentials and return JWT |
| `GET` | `/api/skills` | Student / Instructor | Fetch and map skill nodes with progress status |
| `GET` | `/api/games` | Student | Retrieve all challenges |
| `POST` | `/api/games` | Instructors / Admin | Publish creator studio items |
| `POST` | `/api/games/:id/submit` | Student | Update XP, evaluate results, trigger difficulty offsets |
| `GET` | `/api/analytics/recommendations` | Student | Fetch personalized AI coach advices |
| `GET` | `/api/analytics/stats` | Student | Fetch timeline progress arrays |
| `GET` | `/api/admin/audit` | Admin | Fetch system audit entries |
