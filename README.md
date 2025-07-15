# Copy-ME: Real-time Shared Clipboard


## Overview

**Copy-ME** is a minimalistic, real-time web application designed to facilitate instant text sharing across multiple devices. It functions as a live, shared clipboard where users can draft content privately and then explicitly "Publish" it to synchronize with all connected participants. This project emphasizes simplicity, privacy (no registration, no permanent storage), and a smooth user experience.

It's ideal for:
*   Quickly sharing text snippets between your own devices.
*   Collaborating on short texts or code in real-time (after publishing).
*   Live note-taking during meetings or brainstorming sessions.
*   Drafting content before making it public.

## Features

*   **Real-time Text Synchronization:** Manually publish your local changes to instantly update the content for all connected users.
*   **Local Drafts:** Type and edit text privately before deciding to publish, ensuring your work isn't prematurely shared.
*   **User Presence & Typing Indicators:** See how many users are currently online and if someone else is actively typing.
*   **Clipboard Integration:** Easily copy the entire shared text to your local clipboard with a single click.
*   **Clear Functionality:** Clear your local text, or globally clear the text for all users with a confirmation dialog.
*   **Responsive Design:** Optimized for seamless use across various devices, from desktops to mobile phones.
*   **No Registration Required:** Get started immediately without creating an account.
*   **No Permanent Storage:** All shared text is ephemeral and not stored persistently on a database (see Scalability Note below).
*   **Manual Refresh:** A dedicated "Refresh" button allows users to pull the latest content from the server on demand.

## Live Demo

Experience Copy-ME live: [spr-copy-me.vercel.app](spr-copy-me.vercel.app)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed:
*   Node.js (v18.x or higher recommended)
*   npm or Yarn or pnpm
*   Git

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/selvin-paul-raj/copy_me
    cd copy_me
    \`\`\`
2.  **Install dependencies:**
    \`\`\`bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    \`\`\`

### Running Locally

1.  **Start the development server:**
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    \`\`\`
2.  Open your browser and navigate to `http://localhost:3000`.

## Project Structure

The project is built with Next.js (App Router) and uses Shadcn UI for components.

\`\`\`
.
├── app/
│   ├── api/
│   │   ├── heartbeat/route.ts  # API for user presence and typing indicators
│   │   ├── socket/route.ts     # (Optional) WebSocket route for future real-time features
│   │   ├── stream/route.ts     # (Optional) Server-Sent Events route for real-time updates
│   │   └── sync/route.ts       # Main API for fetching and publishing text content
│   ├── globals.css             # Global Tailwind CSS styles
│   ├── layout.tsx              # Root layout for the Next.js application
│   └── page.tsx                # Main client component for the shared text editor
├── components/
│   ├── ui/                     # Shadcn UI components (e.g., Button, Textarea, AlertDialog)
│   └── theme-provider.tsx      # Theme provider component
├── hooks/
│   ├── use-mobile.tsx          # Custom hook for mobile detection
│   └── use-toast.ts            # Custom hook for toast notifications
├── lib/
│   └── utils.ts                # Utility functions (e.g., `cn` for Tailwind class merging)
├── public/                     # Static assets (images, favicons)
├── .gitignore                  # Files and directories to ignore in Git
├── components.json             # Shadcn UI configuration
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies and scripts
├── postcss.config.mjs          # PostCSS configuration for Tailwind CSS
├── README.md                   # This file
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
\`\`\`

## Scalability & Production Readiness Note

**Important:** The current server-side implementation (`app/api/sync/route.ts`) uses an **in-memory global state**. This means that if your application is deployed to a serverless environment (like Vercel) where multiple instances of your function can run, each instance will have its own independent copy of the `globalState`. This will lead to **inconsistent data** across users and is **not suitable for a production environment** requiring shared, real-time data.

For a truly scalable and production-grade real-time application, you **must** integrate a persistent, external data store. Recommended solutions include:

*   **Redis (e.g., Upstash Redis):** Excellent for real-time data, caching, and managing ephemeral states like user presence.
*   **PostgreSQL (e.g., Neon, Supabase Database):** For more structured and persistent data storage.
*   **Dedicated Real-time Databases/Services:** Such as Supabase Realtime, Firebase Realtime Database, or a custom WebSocket server that manages state.

The current setup is primarily for demonstration and local development purposes.

## Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add YourFeature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
