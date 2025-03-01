# Ren YT-DLP

A sleek web-based interface for downloading videos and audio from YouTube and other platforms using [yt-dlp](https://github.com/yt-dlp/yt-dlp). This project combines a **React** front-end with a **FastAPI** back-end, allowing users to fetch video information, choose formats and additional download options, and monitor download progress in real time.

![Ren YT-DLP](https://github.com/renbkna/renytdlp/raw/main/frontend/public/screenshot.png)

## ✨ Features

- **Video & Playlist Support**  
  Download individual videos or entire playlists from YouTube and many other platforms

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

- **Download Progress Tracking**  
  Monitor the progress of downloads with real-time status updates and progress bars

- **Beautiful Themes**  
  Switch between "Kawaii Pastel" light theme and "Sewerslvt" dark theme

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Python 3.8+](https://www.python.org/downloads/)

### Clone the Repository

```bash
git clone https://github.com/renbkna/renytdlp
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

### Set Up the Frontend

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

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

The application will be available at http://localhost:5173

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

3. The application will be available at http://localhost:8000

## 📝 Usage Guide

1. **Enter a URL**  
   Enter a video or playlist URL from YouTube, TikTok, Twitter, or any other supported platform.

2. **Fetch Video Information**  
   Click "Get Video Information" to retrieve available formats and details.

3. **Choose Download Options**  
   - **Extract Audio Only**: Toggle this to download only the audio track
   - **Video Format**: Select your preferred resolution and format
   - **Metadata Options**: Choose what metadata to embed or save
   - **Subtitle Options**: Select languages for subtitle download
   - **Additional Features**: Enable SponsorBlock, cookies, and other advanced features

4. **Start Download**  
   Click "Start Download" and monitor progress in real-time

5. **View Downloaded Files**  
   Once complete, access your files in the downloads folder

## 🎨 Themes

Ren YT-DLP features two beautiful themes:

- **Kawaii Pastel** (Light Mode): A soft, pastel-colored theme with pink and purple accents
- **Sewerslvt** (Dark Mode): A dark theme with vibrant neon pink and cyan accents

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, yt-dlp, Python
- **Design**: Custom UI components, responsive design

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Credits

- **Project Built by**: [renbkna](https://github.com/renbkna/renytdlp)
- **Powered by**: [yt-dlp](https://github.com/yt-dlp/yt-dlp)
