# YT-DLP Web UI

A web-based interface for downloading videos and playlists using [yt-dlp](https://github.com/yt-dlp/yt-dlp). This project combines a **React** front-end with a **FastAPI** back-end, allowing users to fetch video information, choose formats and additional download options (like audio extraction, metadata embedding, subtitles, and more), and monitor download progress in real time.

## Features

- **Video & Playlist Support:**  
  Enter a video or playlist URL and choose whether to handle it as a playlist.

- **Format Selection & Options:**  
  Select video formats or extract audio only. Choose additional options like embedding metadata, thumbnails, and subtitles.

- **Download Progress:**  
  Monitor the progress of downloads with real-time status updates and progress bars.

- **Dark/Light/System Theme:**  
  Switch between dark, light, and system theme modes.

- **Built With:**
  - [React](https://reactjs.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [FastAPI](https://fastapi.tiangolo.com/)
  - [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## Prerequisites

### Front-End

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Back-End

- [Python 3.8+](https://www.python.org/downloads/)
- [pip](https://pip.pypa.io/)

## Installation

### Clone the Repository

```bash
git clone https://github.com/renbkna/yt-dlp-ui
cd yt-dlp-ui
```

### Set Up the FastAPI Back-End

1. **Create a Virtual Environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   *Note: When running in development mode (see below), the FastAPI back-end is started automatically.*

### Set Up the React Front-End and Run Both Servers Concurrently

1. **Navigate to the Front-End Directory:**

   ```bash
   cd frontend
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

   or, if you are using yarn:

   ```bash
   yarn install
   ```

3. **Start the Development Servers:**

   Simply run:

   ```bash
   npm run dev
   ```

   This command uses the `concurrently` package to start both the FastAPI back-end (from the parent directory) and the React front-end (powered by Vite) together. The FastAPI server will run on port 8000, and the React app will be available (typically) at [http://localhost:5173](http://localhost:5173).

## Audio Extraction vs. Native Audio Download

The UI offers two approaches for obtaining audio-only files:

- **Extract Audio Only (Post-Processing):**  
  When you toggle **Extract Audio Only**, the back-end uses yt-dlp with the `bestaudio` parameter and adds an FFmpeg post-processor (via `FFmpegExtractAudio`). This converts the downloaded stream to your desired audio format (e.g., MP3) and quality. This extra step can be useful if:
  - The source does not provide a native audio-only stream.
  - You require a specific audio codec or container.

- **Audio Only in Video Format Selector (Native):**  
  Alternatively, if you choose an audio-only format from the video format selector, you are directly downloading an audio stream (such as an m4a or webm file) that is natively provided by the source. No additional conversion is needed, which means:
  - There's no re-encoding step.
  - The file is downloaded as-is, preserving the original quality.

> **Note:**  
> In yt-dlp, the `bestaudio` option selects the highest quality audio-only stream available. However, when using the **Extract Audio Only** option in our UI, an additional FFmpeg post-processing step is applied to convert the audio to your preferred format. This is why the two options may produce different outputs even though both aim to provide high-quality audio.

## Understanding Quality Numbers and Format IDs

- **Quality Numbers:**  
  The numbers you see (e.g., format IDs like 137, 299, etc.) correspond to specific quality and resolution tiers. Generally, higher numbers indicate higher quality and larger file sizes. However, higher-quality streams may sometimes require cookies to bypass authentication or geo/age restrictions.

- **Format IDs and Labels:**  
  Our UI displays additional details such as resolution, frame rate (if available), codecs, and approximate file size. This helps you make an informed choice when selecting a format for download.

## Project Structure

```bash
yt-dlp-web-ui/
├── backend/
│   ├── main.py           # FastAPI application
│   └── ...               # Other Python modules/files
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # Main React component (includes theme switching, header, footer, etc.)
│   │   ├── YTDLP.tsx     # Main component for video URL input, options, and download progress
│   │   └── components/   # Other UI components (UrlTab, VideoInfoHeader, etc.)
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── ...
```

## Usage

1. **Enter a URL:**  
   On the front page, enter a video or playlist URL. The UI will auto-detect if it’s a playlist.

2. **Fetch Video Information:**  
   Click the "Fetch" button to retrieve video information and available formats from the back-end.

3. **Select Options:**  
   Choose your desired download options such as video format, audio extraction, metadata embedding, subtitle options, etc.

4. **Start Download:**  
   Click the "Start Download" button. The back-end will initiate the download process and the UI will display real-time progress.

5. **Monitor Progress:**  
   Once the download is complete, you can download another video or playlist by resetting the form.

## Credits

- **Project Built by:** [renbkna](https://github.com/renbkna)
- **Powered by:** [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **Inspired by:** The community effort to make video downloading safer and more efficient.

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.
