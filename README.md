# Real Estate Platform

A complete real estate platform with web frontend, backend API, and mobile app.

## Project Structure

- **frontend/** - Next.js web application
- **backend/** - Node.js/Express API server
- **Profeild/** - React Native mobile application

## Features

- Property listing and management
- User authentication with Supabase
- Admin panel for property verification
- Search and filter functionality
- Mobile app for iOS and Android
- Document upload and management
- Real-time notifications

## Tech Stack

### Frontend (Web)
- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase Auth

### Backend
- Node.js
- Express.js
- PostgreSQL with Drizzle ORM
- Cloudflare R2 for file storage
- JWT Authentication

### Mobile App
- React Native
- TypeScript
- React Navigation
- Supabase Integration

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Supabase account
- Cloudflare R2 account

### Installation

1. Clone the repository
```bash
git clone https://github.com/trilokiindoriya84-maker/Realestate.git
cd Realestate
```

2. Install dependencies for all projects
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Mobile App
cd ../Profeild
npm install
```

3. Set up environment variables (see individual README files in each folder)

4. Start development servers
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev

# Mobile App (Terminal 3)
cd Profeild
npm start
```

## Environment Setup

Each project requires its own environment variables. Check the `.env.example` files in each directory.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is private and proprietary.