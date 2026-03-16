# SyncLiving - Compatibility-First Roommate Matching

SyncLiving is a specialized roommate-finding application designed to reduce the stress and uncertainty of shared housing by prioritizing **lifestyle alignment** and **community trust**.

## 🚀 Key Features
- **Lifestyle Matching:** Calculate compatibility scores based on habits and preferences.
- **Trust System:** Peer-reviewed feedback from previous co-living experiences.
- **Secure Interaction:** Mutual-consent messaging to protect user privacy.

## 🛠 Tech Stack
- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Backend:** [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

---

## 🏃 Getting Started (Local Development)

### 1. Prerequisites
Before running the project on **Windows**, ensure you have installed:
- **Node.js (Latest LTS):**
  1. **Check if installed:** Run `node -v` in PowerShell.
  2. **If not installed:**
     - **Go to Website:** Visit [nodejs.org](https://nodejs.org/).
     - **Select LTS Version:** Download the **LTS (Long Term Support)** version for maximum stability.
     - **Run Installer:** Execute the `.msi` file and follow the "Next" prompts to complete setup.
- **Docker Desktop:** Essential for running local Supabase containers.
  1. **Check if installed:** Run `docker --version` in PowerShell.
  2. **If not installed:**
     - **Go to Website:** Visit [docker.com](https://www.docker.com/products/docker-desktop/).
     - **Download & Install:** Download the Windows installer and follow the setup instructions.
     - **Important for Windows:** Ensure **WSL 2** is enabled in Docker Desktop settings for optimal performance.
     - **Note:** Make sure Docker is running before executing any Supabase CLI commands.

### 2. Environment Setup
Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Start Supabase (Local)
Run the following command to start the Docker containers and apply database migrations:

```bash
npx supabase start
```

### 4. Database Migrations
Ensure your local database schema is up to date:

```bash
npx supabase db reset
```
*This will execute all scripts in `supabase/migrations/`.*

### 5. Run Next.js
Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📂 Project Structure
- `/app`: Next.js routes and UI components.
- `/src/utils/supabase`: Supabase clients for both Client and Server environments.
- `/supabase`: Local configuration and migration files.
- `GEMINI.md`: Project guidelines and coding rules for developers.
- `project.md`: Full technical report and roadmap.

## 🤝 Contribution Rules
Please refer to [GEMINI.md](./GEMINI.md) for naming conventions and database migration rules before making changes.
