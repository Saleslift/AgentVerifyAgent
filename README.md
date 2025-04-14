# AgentVerify

Real estate platform for agents, agencies, and developers built with React, Vite, and Supabase.

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Then update the `.env` file with your own Supabase project credentials.

### Important Note for WebContainer Environments

If you're running this project in a WebContainer environment (like StackBlitz, CodeSandbox, etc.), you **must** use a remote Supabase instance. The WebContainer cannot connect to localhost services.

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Update your `.env` file with the remote URL and anon key
3. Run the database migrations through the Supabase dashboard

### Running the Application

Start the development server:
```
npm run dev
```

## Database Migrations

This project uses Supabase migrations to manage the database schema. However, running migrations using the Supabase CLI (`supabase migration up`) is not supported in WebContainer environments.

Instead, you can:

1. Run migrations manually through the Supabase dashboard
2. Or execute the SQL in the migration files directly via the SQL Editor in Supabase dashboard
3. Or run migrations locally if you're developing outside of WebContainer

## Troubleshooting

### "Failed to fetch" errors

If you see "Failed to fetch" errors in the browser console, check that:

1. Your Supabase URL and anon key in `.env` are correct
2. You're not trying to connect to a localhost Supabase instance from a WebContainer environment
3. Your Supabase project is running and accessible

### Network connectivity issues

The application has built-in retry mechanisms for network issues, but persistent connection problems may indicate:

- Incorrect Supabase credentials
- CORS configuration issues
- Network restrictions in your environment

## License

[MIT](LICENSE)