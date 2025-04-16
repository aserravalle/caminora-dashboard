# Caminora Dashboard
    Caminora Dashboard is a web-based application designed to manage operatives, schedules, and organizational profiles. It provides features such as user authentication, profile management, and the ability to add, edit, and manage operatives and their schedules.

## Features
- **User Authentication**: Sign up, log in, and manage user sessions using Supabase.
- **Operative Management**: Add, edit, and manage operatives, including their schedules and job assignments.
- **Organization Management**: Manage organization details and locations.
- **File Upload**: Upload CSV or Excel files to bulk add operatives.
- **Responsive Design**: Built with Tailwind CSS for a modern and responsive UI.

## Tech Stack
- **Frontend**: React, React Router, TypeScript
- **Backend**: Supabase (PostgreSQL, Row-Level Security, Functions)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Linting**: ESLint
- **Parsing**: PapaParse (CSV) and XLSX (Excel)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/caminora-dashboard.git
   cd caminora-dashboard
   ```

2. Install dependencies:
    ```bash
    npm install
    ```
3. Set up environment variables:
    Create a .env file in the root directory and add the following:
   ```
    VITE_SUPABASE_URL=<your-supabase-url>
    VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

4. Start the development server:
   ```bash
    npm run dev
   ```
    The application will be available at http://localhost:5173.


## Scripts
    npm run dev: Start the development server.
    npm run build: Build the application for production.
    npm run preview: Preview the production build.
    npm run lint: Run ESLint to check for code quality issues.

## Project Structure
   ```
    caminora-dashboard/
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── lib/              # Utility functions and Supabase client
    │   ├── pages/            # Page components for routing
    │   ├── App.tsx           # Main application component
    │   ├── main.tsx          # Application entry point
    │   └── index.css         # Global styles
    ├── supabase/             # Database migrations and SQL scripts
    ├── public/               # Static assets
    ├── .env                  # Environment variables
    ├── package.json          # Project metadata and dependencies
    ├── vite.config.ts        # Vite configuration
    └── tailwind.config.js    # TailwindCSS configuration
   ```

## Key Files
    src/lib/supabase.ts: Initializes the Supabase client and handles authentication.
    src/pages/signup.tsx: Handles user registration and organization creation.
    src/components/operatives-table.tsx: Displays a table of operatives with search and filtering.
    migrations: Contains SQL scripts for database schema and policies.
    
## Database Schema
    The database is managed using Supabase and includes the following key tables:
    organisations: Stores organization details.
    locations: Stores physical locations for organizations.
    operative_types: Defines types of operatives (e.g., Cleaner, Driver).
    operatives: Stores operative details.
    profiles: Stores user profiles and links them to organizations.

## Contributing
    Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request with a detailed description of your changes.

## License
    This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
    Supabase for backend services.
    TailwindCSS for styling.
    Vite for fast builds and development.
    Bolt
    Benny, Max, Jamie, and Alex
