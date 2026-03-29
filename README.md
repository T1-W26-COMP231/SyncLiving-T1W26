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

## 🎨 UI Design & Drafts
- **Stitch Project:** [SyncLiving UI Design](https://stitch.withgoogle.com/projects/1957947046545577335)
- **Local Drafts:** Refer to `/design-drafts/` for HTML/JPG exports of the UI screens.

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
Create a `.env.local` file in the root directory and add your Supabase and Google Maps credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google Maps Configuration (for Address Autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Map Services Setup
To enable address validation and geolocation in the provider dashboard, you must:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and an API Key.
3. **CRITICAL:** Enable the following **Legacy/Standard APIs** (the "New" versions are not yet supported by our client libraries):
   - **Maps JavaScript API** (Loads the core SDK)
   - **Places API** (Enables address autocomplete dropdown)
   - **Geocoding API** (Converts address strings to Lat/Lng coordinates)
4. Update your `.env.local` with the new key and restart the dev server.

### 4. Start Supabase (Local)
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

#### 🛠 Promote User to Admin
To grant administrator privileges to a user, run the following command in the **Supabase SQL Editor**:

```sql
UPDATE public.profiles SET is_admin = true WHERE id = 'USER-UUID';
```
*(Replace `'USER-UUID'` with the actual user ID found in the Auth > Users section of your dashboard).*

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
- `/src`: Main source code, reusable components, and Supabase integration.
- `/design-drafts`: Original UI designs (JPG) and exported code (HTML) from Stitch.
- `/supabase`: Local configuration and SQL migration files.
- `GEMINI.md`: Project guidelines and coding rules for developers.
- `project.md`: Full technical report and roadmap.

---

## 🎨 UI Design & Collaboration (Google Stitch)

We use **Google Stitch** to design and iterate on our UI. To sync these designs directly into your AI editor (like Cursor or VS Code) using the **Model Context Protocol (MCP)**, follow these steps:

### 1. Get the Shared API Key
See the design: https://stitch.withgoogle.com/projects/1957947046545577335 
If you use **gemini CLI**, please run the command in powershell.
```bash
gemini extensions install https://github.com/gemini-cli-extensions/stitch
```
Ask the project owner for the shared **Stitch API Key**. 
Run
```bash
$MY_STITCH_KEY = "PASTE_STITCH_API_KEY_HERE"
```
```bash

(Get-Content "$HOME\.gemini\extensions\Stitch\gemini-extension-apikey.json") -replace "YOUR_API_KEY", $MY_STITCH_KEY | Set-Content "$HOME\.gemini\extensions\Stitch\gemini-extension.json"
```
try step 2 only if problem exists.
> **⚠️ Security:** Never commit this key to the repository.

### 2. Configure Your AI Editor
Go to your C:\Users\(username)\.gemini\extensions\Stitch
Change the file **gemini-extension-apikey.json** directly


### 3. Usage
Once connected, you can ask your AI agent to:
- *"List the screens in our Stitch project."*
- *"Generate a React component based on the 'Hero Section' design in Stitch."*
- *"Ensure the current Tailwind colors match the 'Design DNA' from Stitch."*


---

## 🤝 Contribution & Git Workflow

To maintain a stable codebase and minimize merge conflicts, all developers MUST follow this workflow:

### 1. Feature Development
Always create a new branch from the latest `main`:
```powershell
git checkout main
git pull origin main
git checkout -b your-name/feature
```

### 2. Local Commits
Commit your changes with descriptive messages:
```powershell
git add .
git commit -m "descriptive message"
```

### 3. Sync with Main & Conflict Check (CRITICAL)
Before pushing your branch and creating a Pull Request, you **must** sync with the latest `main` and check for conflicts:
```powershell
# 1. Update your local main
git checkout main
git pull origin main

# 2. Go back to your feature branch
git checkout feature/your-feature-name

# 3. Dry-run merge to check for conflicts without committing
git merge main --no-commit
```
- **If there are conflicts:** Resolve them manually in your editor, then `git add` the resolved files and finish the commit.
- **If no conflicts:** You can proceed to push.

### 4. Verification
Run the development server and verify your changes still work after the sync:
```powershell
npm run dev
```

### 5. Push and Pull Request
Push your branch to GitHub and open a Pull Request:
```powershell
git push origin feature/your-feature-name
```
- Tag a teammate for review.
- Ensure all CI checks (if any) pass before merging.

---

## 📝 General Rules
- **Comments:** All code comments MUST be in **English**.
- **Database:** Never modify DB structure via UI. Always use migrations (refer to [GEMINI.md](./GEMINI.md)).
- **Types:** Always use generated types from `src/types/supabase.ts`.

