# Expedient Generation - Next.js Application

This is the Next.js 15 (App Router) + Supabase application for the Expedient Generation platform. This directory contains the modern rewrite of the legacy CodeIgniter 4 application.

## 🚀 Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Styling**: Vanilla CSS (CSS Modules) + Custom Design System tokens
*   **Language**: TypeScript

## 📂 Project Structure

*   `/src/app/` - Next.js App Router (Pages, API routes, Layouts)
*   `/src/components/` - Reusable UI and layout components
*   `/src/lib/` - Utility functions (Supabase clients, rate limiting, logging, etc.)
*   `/public/` - Static assets (images, fonts, etc.)
*   `/supabase/` - Supabase migration files and configuration

## 🛠️ Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Ensure you have an `.env.local` inside this directory (use `.env.example` in the root as a guide) with your Supabase credentials and other required keys.

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔄 Migration Status

Please refer to `MIGRATION_PROGRESS_DASHBOARD.md` in the root repository for a detailed mapping of legacy CodeIgniter 4 features to this Next.js architecture. 

**Recent Updates:** Massive additions have been made to support Next.js API routes (Biometrics, Broadcast, Baitul Maal, Events, Wasiat) and frontend standalone pages (Oracle's Vision, Enigma Vault, Genesis Core, Scanner, Dossier).
