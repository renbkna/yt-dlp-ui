# Cookie Handling in Ren YT-DLP

This document explains the implementation of the cookie handling system in Ren YT-DLP, which ensures full compatibility between the frontend and backend, particularly when hosted on Render and Vercel.

## Problem Statement

The original implementation relied exclusively on server-side browser cookies for YouTube authentication. This approach worked well in local development environments where browsers are installed but failed when deployed to cloud platforms like Render and Vercel, which run in containerized environments without browser installations.

## Solution

The new implementation adopts a hybrid approach that combines both client-side and server-side cookie handling:

1. **Client-Side Cookie Extraction**:
   - Extracts relevant YouTube authentication cookies directly from the user's browser
   - Works across all hosting environments without requiring server-side browser installations
   - Handles age-restricted content and YouTube's anti-bot verification

2. **Server-Side Fallback**:
   - Falls back to server-side browser cookies if available
   - Maintains backward compatibility with existing setups

3. **Cookie File Management**:
   - Safely stores extracted cookies in temporary files using the Netscape cookie format
   - Implements proper cleanup to ensure cookies aren't persisted longer than necessary
   - Uses secure file handling practices

## Key Components

### Backend (`server/main.py`)

1. **CookieManager Class**:
   - Manages cookie operations including storage, retrieval, and cleanup
   - Creates cookie files in Netscape format compatible with yt-dlp
   - Implements automatic expiry for security

2. **Cookie Priority System**:
   - Prioritizes client-provided cookies over server browser cookies
   - Falls back gracefully when preferred cookie sources aren't available

3. **API Endpoints**:
   - `/api/cookies`: Uploads cookies from client browser
   - `/api/cookie_status`: Checks cookie availability status
   - Extended existing endpoints to support client cookies

### Frontend

1. **ClientCookieExtractor Component**:
   - Extracts relevant YouTube cookies from the user's browser
   - Passes them to the backend for authentication
   - Provides user feedback about cookie extraction status

2. **Updated AdditionalFeatures Component**:
   - Integrates cookie extraction into the existing UI
   - Maintains the same user experience while adding functionality

3. **Enhanced Error Handling**:
   - Improved YoutubeAuthError component to suggest cookie-based solutions
   - Clear feedback when authentication issues occur

## Security Considerations

1. **Cookie Validation**:
   - Validates cookies before processing to prevent injection attacks
   - Sanitizes domain names and cookie values

2. **Temporary Storage**:
   - Cookies are stored in secure temporary files
   - Automatic cleanup after download completion
   - Configurable expiry time

3. **Minimal Cookie Collection**:
   - Only extracts cookies necessary for YouTube authentication
   - Focuses on specific domains and cookie names

## Configuration Options

The following environment variables control cookie behavior:

- `COOKIE_DIR`: Directory for temporary cookie storage (default: system temp)
- `COOKIE_EXPIRY_HOURS`: Hours before cookie files are automatically deleted (default: 1)
- `YT_DLP_BROWSER`: Browser to use for server-side cookies (default: chrome)

## Deployment Considerations

1. **Render Deployment**:
   - Client-side cookie extraction works seamlessly
   - No special browser installation required
   - Vercel URL must be included in `ALLOWED_ORIGINS` for CORS

2. **Vercel Deployment**:
   - No changes needed for the frontend deployment
   - Ensures API calls use the correct endpoints

## Benefits

1. **Improved Compatibility**:
   - Works across all hosting environments, including containerized platforms
   - No need for browser installations on the server

2. **Enhanced User Experience**:
   - Seamless authentication for age-restricted content
   - Clear feedback when authentication issues occur

3. **Maintainability**:
   - Clean separation of concerns
   - Well-documented code
   - Proper error handling and logging

This implementation successfully addresses the cookie handling issue when the application is hosted on Render and Vercel, providing a robust solution that works across different deployment environments.
