# Ren YT-DLP Backend

This is the backend server for the Ren YT-DLP application, built with FastAPI and yt-dlp.

## Environment Configuration

### Local Development

1. Create a `.env` file in the server directory (if it doesn't exist already):

```bash
# Copy the example configuration
cp .env.example .env
```

2. Customize the values in the `.env` file according to your development environment:

```
# Server Configuration
PORT=8000                # The port the API server will run on
HOST=0.0.0.0             # The host IP to bind to

# CORS Settings
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000  # Frontend origins that can access the API

# Storage Configuration
DOWNLOAD_DIR=downloads   # Directory where downloaded files are stored
MAX_STORAGE_DAYS=7       # Number of days to keep downloaded files

# Logging Configuration
LOG_LEVEL=INFO           # Logging level (DEBUG, INFO, WARNING, ERROR)
LOG_FILE=yt_dlp_api.log  # Log file name

# Feature Flags
ENABLE_COOKIES=true      # Enable/disable cookie support for downloads
ENABLE_SPONSORBLOCK=true # Enable/disable SponsorBlock integration

# Performance Settings
MAX_CONCURRENT_DOWNLOADS=5  # Maximum number of concurrent downloads
```

## Deployment to Render

To deploy this backend to Render:

1. Create a new Web Service in your Render dashboard.
2. Connect your GitHub repository (github.com/renbkna/renytdlp).
3. Configure the service:
   - **Name**: `renytdlp-backend` (or your preferred name)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   
4. Add environment variables in the Render dashboard:
   - Go to your service settings
   - In the "Environment" section, add all variables from `.env.example`
   - Set appropriate values for production

5. Important deployment considerations:
   - Set `HOST` to `0.0.0.0` to allow Render to bind to the correct network interface
   - Update `ALLOWED_ORIGINS` to include your Vercel frontend URL
   - Consider increasing `MAX_STORAGE_DAYS` if you want files to persist longer
   - Adjust `MAX_CONCURRENT_DOWNLOADS` based on your Render service tier's resources

6. Deploy the service.

## Important Notes

- Sensitive information should never be committed to the repository
- The `.env` file is included in `.gitignore` to prevent accidental commits
- Always use environment-specific configuration for different deployment stages
