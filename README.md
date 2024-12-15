# Flowgent

A powerful workflow automation platform that enables you to create AI-powered agents through a visual flow editor. Flowgent allows you to design, build, and deploy automated workflows that combine AI capabilities with custom actions and triggers.

## Technologies

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Storage**: IndexedDB for offline data persistence
- **API Integration**: REST API communication
- **Database**: PostgreSQL with Drizzle ORM
- **Backend**: Node.js with Express
- **Flow Editor**: @xyflow/react for visual flow editing
- **Environment Management**: Multiple environment configurations

## Features

- Visual Flow Editor for creating AI agent workflows
- Node-based programming interface
- Multiple node types:
  - Trigger nodes for workflow initiation
  - AI nodes for language processing and decision making
  - Action nodes for executing tasks
  - Flow control nodes for conditional logic
- Real-time flow validation and testing
- Offline-first architecture
- Database persistence for workflows
- Environment-specific configurations

## Project Structure

```
packages/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MatrixEditor/     # Flow editor components
│   │   │   └── ui/               # Shared UI components
│   │   ├── services/             # API and storage services
│   │   └── pages/               # Application routes
│   └── public/
└── backend/
    ├── src/
    │   ├── routes/              # API endpoints
    │   ├── db/                  # Database models and migrations
    │   └── services/            # Business logic
    └── docker-compose.dev.yml   # Development database setup
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker (for development database)
- PostgreSQL (production)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd flowgent
```

2. Install dependencies:

```bash
# Install frontend dependencies
cd packages/frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:

```bash
# Frontend
cd packages/frontend
cp .env.example .env

# Backend
cd ../backend
cp .env.example .env
```

### Development

1. Start the development database:

```bash
cd packages/backend
npm run docker:up
```

2. Start the backend server:

```bash
npm run dev
```

3. In a new terminal, start the frontend development server:

```bash
cd packages/frontend
npm run dev
```

### Building for Production

1. Build the frontend:

```bash
cd packages/frontend
npm run build
```

2. Build the backend:

```bash
cd packages/backend
npm run build
```

## Environment Variables

### Frontend

- `VITE_USE_BACKEND`: Enable/disable backend integration
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_APP_TITLE`: Application title

### Backend

- `PORT`: Server port
- `NODE_ENV`: Environment (development/production)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `FRONTEND_URL`: Frontend application URL

## Architecture

Flowgent follows a modular architecture:

- **Frontend**:

  - React components for UI rendering
  - XYflow for flow visualization and editing
  - Service layer for API communication
  - Offline-first data persistence

- **Backend**:
  - Express.js REST API
  - PostgreSQL database with Drizzle ORM
  - Service-based business logic
  - Environment-based configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
