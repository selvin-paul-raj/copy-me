# 📝 Copy-ME: Real-time Collaborative Text Editor

<div align="center">

![Copy-ME Logo](public/placeholder-logo.svg)

**A modern, real-time collaborative text editor with multi-notebook support**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🌐 Live Demo](https://spr-copy-me.vercel.app) • [📖 Documentation](#documentation) • [🚀 Getting Started](#getting-started) • [🤝 Contributing](#contributing)

</div>

---

## 🎯 Overview

**Copy-ME** is a sophisticated, real-time collaborative text editor that enables seamless content sharing and collaboration across multiple devices and users. Built with modern web technologies, it provides a smooth, intuitive experience for real-time text editing with advanced features like multiple notebooks, user presence tracking, and automatic room expiration.

### ✨ Key Highlights

- 🚀 **Real-time Collaboration**: Instant synchronization across all connected users
- 📚 **Multi-Notebook Support**: Organize content with multiple notebooks per room
- 👥 **User Presence Tracking**: See who's online and actively collaborating
- 🔒 **Privacy-First**: No registration required, temporary rooms with auto-expiration
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- ⚡ **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Supabase

---

## 🌟 Features

### Core Functionality
- **🔄 Real-time Text Synchronization**: Publish changes instantly to all connected users
- **📝 Local Draft Mode**: Edit privately before publishing to maintain control over shared content
- **📋 Clipboard Integration**: One-click copy functionality for the entire text content
- **🗑️ Smart Clear Options**: Clear locally or globally with confirmation dialogs

### Advanced Features
- **📚 Multiple Notebooks**: Create and manage multiple notebooks within a single room
- **👥 Live User Presence**: Real-time display of online users and their activity status
- **⏰ Automatic Room Expiration**: Rooms automatically expire after 24 hours of inactivity
- **🔄 Manual Refresh**: Pull latest updates from server on demand
- **📊 Content Statistics**: Live character, word, and line count display

### User Experience
- **🎨 Modern UI/UX**: Beautiful, gradient-based design with smooth animations
- **📱 Mobile-First Design**: Fully responsive interface that works on all devices
- **⚡ Fast Performance**: Optimized for speed and reliability
- **🔗 Easy Sharing**: Share room links instantly with built-in copy functionality

---

## 🎬 Live Demo

Experience Copy-ME in action: **[spr-copy-me.vercel.app](https://spr-copy-me.vercel.app)**

### Quick Start Demo Flow
1. Visit the demo link
2. Enter a username (2-20 characters)
3. Create a new room or join existing one with Room ID
4. Start typing and use "Publish" to share with others
5. Share the room link with collaborators

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **Package Manager**: npm, yarn, or pnpm
- **Git** - [Download](https://git-scm.com/)

### Quick Installation

1. **Clone the repository**
   ```
   git clone https://github.com/selvin-paul-raj/copy_me.git
   cd copy_me
   ```

3. **Install dependencies**
  
   # Using npm
    ```
   npm install
   ```
   # Using yarn
   ```
   yarn install
   ```
   # Using pnpm
   ```
   pnpm install
   ```

5. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
  ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Get Supabase credentials:**
   - Visit [Supabase](https://supabase.com/) and create a new project
   - Go to Settings → API to find your project URL and anon key
   - Replace the values in your `.env.local` file

6. **Database Setup**
   
   Create the following table in your Supabase database:
   ```
   CREATE TABLE rooms (
     id TEXT PRIMARY KEY,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     expires_at TIMESTAMPTZ NOT NULL,
     notebooks JSONB NOT NULL DEFAULT '[]'::jsonb,
     users JSONB NOT NULL DEFAULT '[]'::jsonb
   );

   -- Add RLS policies for public access
   ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Allow all operations on rooms" ON rooms
   FOR ALL USING (true) WITH CHECK (true);
   ```

7. **Start the development server**
   ```
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application running.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- **UI Components**: [Radix UI](https://www.radix-ui.com/) for accessible components
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful icons

### Backend
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with real-time features)
- **API**: Next.js API Routes for server-side logic
- **Real-time**: Supabase real-time subscriptions

### Development Tools
- **Build Tool**: [Next.js](https://nextjs.org/) built-in build system
- **Linting**: [ESLint](https://eslint.org/) with Next.js configuration
- **Package Manager**: Support for npm, yarn, and pnpm

---

## 📁 Project Structure

```
copy_me/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── create-room/          # Room creation endpoint
│   │   └── room/[roomId]/        # Room-specific endpoints
│   │       ├── route.ts          # Get/Update room content
│   │       ├── add-notebook/     # Add notebook endpoint
│   │       ├── delete-notebook/  # Delete notebook endpoint
│   │       └── heartbeat/        # User presence endpoint
│   ├── room/[roomId]/            # Room pages
│   │   ├── page.tsx              # Main room interface
│   │   └── loading.tsx           # Loading state
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # Reusable components
│   ├── ui/                       # UI component library
│   └── theme-provider.tsx        # Theme configuration
├── lib/                          # Utility libraries
│   ├── db.ts                     # Database operations
│   ├── supabase.ts               # Supabase client
│   └── utils.ts                  # Helper functions
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
└── styles/                       # Additional stylesheets
````

---

## 🔧 Usage Guide

### Creating a Room
1. Enter a username (2-20 characters)
2. Click "Create New Room"
3. Share the generated room link with collaborators

### Joining a Room
1. Enter a username
2. Input the 4-character Room ID
3. Click "Join Room"

### Working with Notebooks
- **Add Notebook**: Click the "+" button in the sidebar
- **Switch Notebooks**: Click on any notebook name in the sidebar
- **Delete Notebook**: Click the trash icon next to notebook name

### Collaborating
- **Draft Mode**: Type freely without affecting others
- **Publish**: Click "Publish" to sync your changes with all users
- **Real-time Updates**: See live user presence and content updates

---

## 🚀 Deployment

### Deploy on Vercel (Recommended)

1. **Fork this repository** to your GitHub account

2. **Connect to Vercel**:
   - Visit [Vercel](https://vercel.com/)
   - Import your forked repository
   - Configure environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy**: Vercel will automatically build and deploy your application

### Deploy on Other Platforms

The application can be deployed on any platform that supports Next.js:
- **Netlify**: Configure build command as `npm run build`
- **Railway**: Connect GitHub repository and deploy
- **DigitalOcean App Platform**: Deploy directly from GitHub

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Custom configuration
NEXT_PUBLIC_APP_NAME=Copy-ME
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🎨 Customization

### Styling
- Modify `tailwind.config.ts` for custom design tokens
- Update `app/globals.css` for global styles
- Customize components in `components/ui/` directory

### Features
- Extend API routes in `app/api/` for additional functionality
- Modify database schema in Supabase for new data models
- Add new UI components using the established pattern

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new features when applicable
- Update documentation for new features
- Ensure your changes don't break existing functionality

### Areas for Contribution
- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Supabase Team** for the excellent backend-as-a-service platform
- **Radix UI** for accessible and customizable UI components
- **Tailwind CSS** for the utility-first CSS framework
- **Vercel** for seamless deployment and hosting

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/selvin-paul-raj/copy_me/issues)
- **Discussions**: [GitHub Discussions](https://github.com/selvin-paul-raj/copy_me/discussions)
- **Email**: [selvinpaulgomathi@gmail.com](mailto:selvinpaulgomathi@gmail.com)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

[🔝 Back to Top](#-copy-me-real-time-collaborative-text-editor)

</div>
