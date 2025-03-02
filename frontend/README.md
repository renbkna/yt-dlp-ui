# Ren YT-DLP Frontend

This is the frontend application for Ren YT-DLP, built with React, TypeScript, and Tailwind CSS.

## Environment Configuration

### Local Development

1. Create a `.env.local` file in the frontend directory (if it doesn't exist already):

```bash
# Copy the example configuration
cp .env.local.example .env.local
```

2. Customize the values in the `.env.local` file according to your development environment:

```
# API Configuration
VITE_API_URL=http://localhost:8000   # URL of the backend API

# Feature Flags
VITE_SHOW_DEBUG_INFO=true            # Enable/disable debug information
VITE_DEFAULT_FORMAT=mp4              # Default download format

# UI Configuration
VITE_MAX_RECENT_DOWNLOADS=10         # Number of recent downloads to display
VITE_ENABLE_DARK_MODE=true           # Enable dark mode by default

# Analytics (if needed)
VITE_ANALYTICS_ID=                   # Your analytics tracking ID
```

## Deployment to Vercel

To deploy this frontend to Vercel:

1. Connect your GitHub repository (github.com/renbkna/renytdlp) to Vercel.
2. Configure the project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. Add environment variables in the Vercel dashboard:
   - Navigate to your project settings
   - In the "Environment Variables" section, add all variables from `.env.local.example`
   - Set appropriate values for production:
     - `VITE_API_URL` should point to your Render backend URL
     - `VITE_SHOW_DEBUG_INFO` should be set to `false` for production
     - Configure other variables as needed

4. Deploy the project.

## Important Notes

- Environment variables in Vite must be prefixed with `VITE_` to be accessible in client-side code
- Sensitive information (API keys, tokens) should only be used in your backend, not in the frontend
- The `.env.local` file is included in `.gitignore` to prevent accidental commits
- Always use environment-specific configuration for different deployment stages

## Building and Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
