# Observer Portfolio Site

A portfolio website with blog functionality, built with Node.js/Express and vanilla JavaScript.

## Features

- **Portfolio Showcase**: Display work items, capabilities, and blog posts
- **Admin Panel**: Content management interface for posts, work items, and capabilities
- **Authentication**: WebAuthn (passkey) and password-based authentication
- **Markdown Support**: Blog posts support Markdown formatting
- **File-based Storage**: JSON file storage with optional PostgreSQL support
- **Interactive Backgrounds**: Three.js-powered animations

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Three.js
- **Authentication**: WebAuthn (SimpleWebAuthn), bcrypt
- **Storage**: JSON files (default) or PostgreSQL
- **Markdown**: marked
- **Security**: Helmet, express-rate-limit, CSRF protection

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (see `.env.example` for required variables)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

See `.env.example` for all required and optional environment variables.

### Required (Production)
- `SESSION_SECRET`: Secret key for session encryption

### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (`production` or `development`)
- `DATA_DIR`: Directory for JSON data files (default: `./data`)
- `DATABASE_URL`: PostgreSQL connection string (if using database)
- `ADMIN_USERNAME`: Default admin username (default: `admin`)
- `ADMIN_PASSWORD`: Default admin password (default: `changeme123`)
- `WEBAUTHN_RP_ID`: WebAuthn relying party ID
- `WEBAUTHN_RP_NAME`: WebAuthn relying party name
- `WEBAUTHN_ORIGIN`: WebAuthn origin URL

## Project Structure

### Directory Architecture

```
.
├── config/                    # Application configuration
│   ├── index.js              # Main configuration (port, paths, secrets, database)
│   └── env.js                # Environment variable validation
│
├── controllers/               # Request handlers (business logic)
│   ├── authController.js     # Authentication (login, logout, WebAuthn)
│   ├── capabilitiesController.js  # Product/capability CRUD operations
│   ├── postsController.js    # Blog post CRUD operations
│   ├── uploadController.js   # File upload handling
│   └── workController.js     # Work item CRUD operations
│
├── middleware/               # Express middleware
│   ├── auth.js               # Authentication middleware
│   ├── csrf.js               # CSRF token generation/validation
│   ├── errorHandler.js       # Global error handling
│   └── validation.js         # Input validation rules
│
├── routes/                   # API route definitions
│   ├── auth.js               # Authentication routes
│   ├── capabilities.js       # Capability API routes
│   ├── index.js              # Main route mounting
│   ├── posts.js              # Post API routes
│   ├── upload.js             # File upload routes
│   └── work.js               # Work API routes
│
├── services/                 # Business logic and data access
│   ├── database.js           # PostgreSQL connection and schema
│   ├── dataService.js        # JSON file-based data access
│   ├── dbService.js          # PostgreSQL data access
│   ├── initService.js       # Initial data setup (default admin, sample data)
│   ├── markdownService.js    # Markdown parsing and sanitization
│   └── webauthnService.js   # WebAuthn/passkey management
│
├── utils/                    # Utility functions
│   ├── constants.js         # Application constants (categories, etc.)
│   └── helpers.js            # Helper functions (slugify, readTime, etc.)
│
├── public/                   # Static files served to clients
│   ├── admin/                # Admin panel pages
│   │   ├── dashboard.html    # Main admin dashboard
│   │   └── login.html        # Admin login page
│   │
│   ├── assets/               # Static assets
│   │   ├── observer-logo-*.svg/jpeg/png  # Logo files
│   │
│   ├── scripts/              # Frontend JavaScript
│   │   ├── admin-dashboard.js   # Admin dashboard functionality
│   │   ├── admin-login.js       # Admin login (WebAuthn, password)
│   │   ├── blog.js              # Blog listing page
│   │   ├── home.js              # Homepage functionality
│   │   ├── icons.js             # Icon library for products
│   │   ├── logo.js              # Interactive logo animations
│   │   ├── main.js              # Navigation, scroll effects
│   │   ├── mesh-background.js   # Three.js background animation
│   │   ├── post.js              # Individual post page
│   │   ├── products.js          # Products/capabilities page
│   │   └── work.js              # Work listing page
│   │
│   ├── styles/               # CSS stylesheets
│   │   ├── admin.css         # Admin dashboard styles
│   │   ├── admin-login.css   # Admin login styles
│   │   ├── blog.css          # Blog page styles
│   │   ├── post.css          # Post page styles
│   │   └── styles.css        # Main site styles
│   │
│   ├── blog.html             # Blog listing page
│   ├── coming-soon.html      # Placeholder page
│   ├── favicon.ico           # Site favicon
│   ├── favicon.svg           # SVG favicon
│   ├── index.html            # Homepage
│   ├── post.html             # Individual post template
│   ├── products.html         # Products/capabilities page
│   └── work.html             # Work listing page
│
├── data/                     # JSON data files (file-based storage)
│   ├── capabilities.json     # Product/capability data
│   ├── posts.json            # Blog post data
│   ├── users.json            # User accounts and WebAuthn credentials
│   └── work.json             # Work item data
│
├── database/                  # Database schema
│   └── schema.sql            # PostgreSQL schema definition
│
├── scripts/                  # Utility scripts
│   └── migrate-to-postgres.js  # JSON to PostgreSQL migration script
│
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── POSTGRES_MIGRATION.md     # PostgreSQL migration guide
├── RAILWAY_DATABASE_SETUP.md # Railway deployment guide
└── README.md                 # This file
```

### Key Files Explained

**Backend:**
- `server.js` - Main entry point, sets up Express server, middleware, routes, and database initialization
- `config/index.js` - Centralized configuration (paths, secrets, database settings)
- `config/env.js` - Validates required environment variables
- `services/dataService.js` - Generic CRUD for JSON file storage
- `services/dbService.js` - Generic CRUD for PostgreSQL storage
- `services/database.js` - PostgreSQL connection pool and schema initialization

**Frontend:**
- `public/index.html` - Homepage with work showcase and capabilities
- `public/blog.html` - Blog listing with category filtering
- `public/post.html` - Individual blog post template
- `public/scripts/home.js` - Homepage data loading and interactions
- `public/scripts/mesh-background.js` - Three.js animated background
- `public/scripts/icons.js` - Icon library for product cards

**Admin:**
- `public/admin/dashboard.html` - Content management interface
- `public/admin/login.html` - Authentication page (WebAuthn + password)
- `public/scripts/admin-dashboard.js` - Admin CRUD operations
- `public/scripts/admin-login.js` - Authentication logic

**Data Storage:**
- Uses JSON files by default (`data/*.json`)
- Automatically switches to PostgreSQL if `DATABASE_URL` is set
- Migration script available: `scripts/migrate-to-postgres.js`

## API Endpoints

### Public Endpoints
- `GET /api/posts` - Get all published posts
- `GET /api/posts/:slug` - Get a single post
- `GET /api/work` - Get all work items
- `GET /api/capabilities` - Get all capabilities
- `GET /api/categories` - Get all categories

### Admin Endpoints (Requires Authentication)
- `POST /api/auth/login` - Login with password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/webauthn/register/start` - Start WebAuthn registration
- `POST /api/auth/webauthn/register/finish` - Finish WebAuthn registration
- `POST /api/auth/webauthn/login/start` - Start WebAuthn authentication
- `POST /api/auth/webauthn/login/finish` - Finish WebAuthn authentication
- `GET /api/admin/posts` - Get all posts (admin)
- `POST /api/admin/posts` - Create a post
- `PUT /api/admin/posts/:slug` - Update a post
- `DELETE /api/admin/posts/:slug` - Delete a post
- Similar endpoints for `/api/admin/work` and `/api/admin/capabilities`

## Admin Panel

Access the admin panel at `/observe`. Default credentials:
- Username: `admin`
- Password: `changeme123` (change in production!)

You can also register a WebAuthn passkey for passwordless authentication.

## Development

The project uses a modular architecture:

- **Routes**: Define API endpoints
- **Controllers**: Handle request/response logic
- **Services**: Business logic and data access
- **Middleware**: Authentication, validation, error handling

## Security Features

- CSRF protection
- Rate limiting on auth endpoints
- Helmet.js security headers
- Input validation and sanitization
- XSS prevention
- Secure session management

## License

Copyright © Techademy LLC

