# RAGStack Generator

A full-stack RAG (Retrieval Augmented Generation) application with MERN stack architecture and GenAI integration.

## Project Structure

```
RAGStack Generator/
├── frontend/                 # React.js Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # API client and utilities
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   └── tailwind.config.js  # Tailwind CSS config
├── backend/                 # Node.js Backend
│   ├── server/             # Express server
│   │   ├── index.js        # Main server file
│   │   ├── routes.js       # API routes
│   │   ├── storage.js      # Database operations
│   │   └── services/       # Business logic services
│   ├── shared/             # Shared schemas and types
│   ├── uploads/            # File uploads directory
│   ├── package.json        # Backend dependencies
│   └── drizzle.config.js   # Database configuration
├── .env                    # Environment variables
├── package.json            # Root package.json (workspace)
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon DB)
- OpenAI/Groq API key

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and API keys
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```
   This starts both frontend (port 5173) and backend (port 5000) concurrently.

### Individual Development

**Backend only:**
```bash
cd backend
npm install
npm run dev
```

**Frontend only:**
```bash
cd frontend  
npm install
npm run dev
```

## Features

- **🤖 RAG Pipeline** - Document processing, embedding generation, semantic search
- **📁 File Upload** - PDF, text, and document processing
- **🔗 GitHub Integration** - Repository analysis and code understanding  
- **💬 AI Chat** - Intelligent responses using Groq API
- **📝 Notes Management** - Organize and search your documents
- **🎯 Placement Prep** - Interview questions and company-specific content
- **🔐 Authentication** - User registration and session management
- **🎨 Modern UI** - Tailwind CSS with shadcn/ui components

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching and caching
- **Wouter** - Lightweight routing

### Backend  
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **Multer** - File uploads
- **WebSockets** - Real-time communication

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ragstack

# API Keys
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key  
GITHUB_TOKEN=your-github-token

# Auth
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Server
PORT=5000
NODE_ENV=development
```

## Scripts

- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run install:all` - Install all dependencies

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Create a Pull Request

## License

MIT License