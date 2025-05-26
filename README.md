# Ren YT-DLP

A sleek web-based interface for downloading videos and audio from YouTube and other platforms using [yt-dlp](https://github.com/yt-dlp/yt-dlp). This project combines a **React** front-end with a **FastAPI** back-end, providing direct streaming downloads to your device with no server storage required.

![Ren YT-DLP](/frontend/public/yt-dlp-ui.png)

## ✨ Features

- **Direct Downloads**
  Stream downloads directly to your device - no server storage required

- **Video & Playlist Support**
  Download individual videos or entire playlists from YouTube and many other platforms

- **Multi-Platform Support**
  Support for various video sources including YouTube, TikTok, Instagram, Twitter, and many more

- **Premium Format Support**
  Access to premium quality options including 8K, HDR, and Dolby content (when available)

- **Audio Extraction**
  Extract audio in various formats (MP3, M4A, OPUS, FLAC, WAV, OGG) with customizable quality

- **Format Selection**
  Choose from available video formats with detailed information about resolution, codecs, and file size

- **Metadata Options**
  Embed metadata, thumbnails, and save additional information like descriptions and comments

- **Subtitle Support**
  Download subtitles in multiple languages with easy language selection

- **SponsorBlock Integration**
  Skip ads, intros, outros, and other segments automatically using SponsorBlock data

- **Real-Time Progress**
  Monitor download progress with live status updates during streaming

- **YouTube Authentication Support**
  Handle age-restricted content and "bot verification" errors with included browser extension or manual cookie import

- **Beautiful Themes**
  Switch between light theme and dark theme

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Python 3.8+](https://www.python.org/downloads/)
- [FFmpeg](https://ffmpeg.org/download.html) (Required for audio conversion and post-processing)

### Clone the Repository

```bash
git clone https://github.com/renbkna/yt-dlp-ui
cd renytdlp
```

### Set Up the Backend

1. Create a Python virtual environment:

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure settings (optional):

```bash
# Environment variables can be set for customization
# See config.py for available settings
```

### Set Up the Frontend

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy the example configuration
cp .env.local.example .env.local
# Edit the .env.local file as needed
```

### Set Up Browser Extension (Optional - For Authentication)

1. Navigate to Chrome/Edge Extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable "Developer mode"

3. Click "Load unpacked" and select the `browser-extension/` directory

4. The extension will automatically communicate with the web app for cookie extraction

## 🏃‍♀️ Running the Application

### Development Mode

1. Start the backend server:

```bash
cd server
python main.py
```

2. In a separate terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The application will be available at <http://localhost:5173>

### Production Mode

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Start the backend server:

```bash
cd server
python main.py
```

3. The application will be available at <http://localhost:8000>

## 🌐 Deployment

This project is configured for deployment on Vercel (frontend) and Render (backend).

### Frontend Deployment (Vercel)

1. Connect your GitHub repository (github.com/renbkna/renytdlp) to Vercel.
2. Configure the project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. Add environment variables in the Vercel dashboard:
   - Navigate to project settings > "Environment Variables"
   - Add all variables from `.env.local.example` with production values
   - Make sure `VITE_API_URL` points to your Render backend URL

### Backend Deployment (Render)

1. Create a new Web Service in your Render dashboard.
2. Connect your GitHub repository (github.com/renbkna/renytdlp).
3. Configure the service:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`

4. Configure environment variables in the Render dashboard:
   - Go to service settings > "Environment" section
   - Set `YTDLP_ALLOWED_ORIGINS` to include your Vercel frontend URL
   - Configure other settings as needed (see `config.py` for options)

For more detailed deployment instructions, see the README.md files in the frontend and server directories.

## 📝 Usage Guide

1. **Enter a URL**
   Enter a video or playlist URL from YouTube, TikTok, Instagram, Twitter, or any other supported platform.

2. **Fetch Video Information**
   Click "Get Video Information" to retrieve available formats and details.

3. **Choose Download Options**
   - **Extract Audio Only**: Toggle this to download only the audio track
   - **Video Format**: Select your preferred resolution and format (including premium formats)
   - **Metadata Options**: Choose what metadata to embed or save
   - **Subtitle Options**: Select languages for subtitle download
   - **Additional Features**: Enable SponsorBlock, cookies, and other advanced features

4. **Authentication for Age-Restricted Content**
   - **Option 1 - Browser Extension (Recommended)**: Install the included browser extension from the `browser-extension/` directory for automatic cookie extraction
   - **Option 2 - Manual Import**: Use external tools like "Get cookies.txt LOCALLY" to manually import cookies
   - Enable "Use browser cookies" in the Additional Features section
   - This allows downloading age-restricted content and bypasses "bot verification" errors

5. **Start Download**
   Click "Download Video" or "Download Audio" and the file will stream directly to your device

6. **Automatic Downloads**
   - For individual videos: Downloads start immediately
   - For playlists: All videos download automatically in sequence
   - Files are saved directly to your browser's default download location

## 🎨 Themes

Ren YT-DLP features two beautiful themes:

- **Light Theme** : A soft, pastel-colored theme with pink and purple accents
- **Dark Theme** : A dark theme with vibrant neon pink and cyan accents

## 🏗️ Architecture

This application uses a **streamlined architecture** focused on simplicity and performance:

- **Direct Downloads**: Files stream directly from the server to your device - no server storage
- **Stateless Backend**: No database or persistent storage required
- **Real-time Processing**: Videos are processed and streamed on-demand
- **Minimal Resource Usage**: Temporary files are automatically cleaned up

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, yt-dlp, Python
- **Design**: Custom UI components, responsive design
- **Storage**: No database required - direct streaming architecture

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Credits

- **Project Built by**: [renbkna](https://github.com/renbkna/yt-dlp-ui)
- **Powered by**: [yt-dlp](https://github.com/yt-dlp)
