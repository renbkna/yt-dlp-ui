import time
import hashlib
from typing import Dict, Optional, Set
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
from pathlib import Path
import re

logger = logging.getLogger(__name__)

# Rate limiting storage (in production, use Redis)
_rate_limit_storage: Dict[str, Dict[str, float]] = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent abuse."""

    def __init__(
        self, app, calls_per_minute: int = 30, excluded_paths: Optional[Set[str]] = None
    ):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.excluded_paths = excluded_paths or {
            "/",
            "/docs",
            "/openapi.json",
            "/api/health",
        }
        self.window_size = 60  # 1 minute window

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        client_ip = self.get_client_ip(request)
        current_time = time.time()

        # Clean old entries
        self._cleanup_old_entries(current_time)

        # Check rate limit
        if self._is_rate_limited(client_ip, current_time):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {self.calls_per_minute} requests per minute."
                },
            )

        # Record this request
        self._record_request(client_ip, current_time)

        return await call_next(request)

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers (for reverse proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _cleanup_old_entries(self, current_time: float):
        """Remove old rate limit entries."""
        cutoff_time = current_time - self.window_size
        for ip in list(_rate_limit_storage.keys()):
            _rate_limit_storage[ip] = {
                timestamp: count
                for timestamp, count in _rate_limit_storage[ip].items()
                if float(timestamp) > cutoff_time
            }
            if not _rate_limit_storage[ip]:
                del _rate_limit_storage[ip]

    def _is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Check if client IP is rate limited."""
        if client_ip not in _rate_limit_storage:
            return False

        cutoff_time = current_time - self.window_size
        request_count = sum(
            count
            for timestamp, count in _rate_limit_storage[client_ip].items()
            if float(timestamp) > cutoff_time
        )

        return request_count >= self.calls_per_minute

    def _record_request(self, client_ip: str, current_time: float):
        """Record a request for rate limiting."""
        if client_ip not in _rate_limit_storage:
            _rate_limit_storage[client_ip] = {}

        timestamp_key = str(int(current_time))
        _rate_limit_storage[client_ip][timestamp_key] = (
            _rate_limit_storage[client_ip].get(timestamp_key, 0) + 1
        )


class SecurityValidator:
    """Input validation and security checks."""

    # Dangerous patterns to block
    DANGEROUS_PATTERNS = [
        r"\.\./",  # Directory traversal
        r"\\\.\\\.\\",  # Windows directory traversal
        r"<script",  # XSS
        r"javascript:",  # XSS
        r"on\w+\s*=",  # Event handlers
        r"eval\s*\(",  # Code injection
        r"exec\s*\(",  # Code injection
        r"system\s*\(",  # Command injection
        r"rm\s+-rf",  # Dangerous commands
        r"del\s+/[sq]",  # Windows dangerous commands
    ]

    # Allowed URL schemes
    ALLOWED_SCHEMES = {"http", "https"}

    # Maximum lengths
    MAX_URL_LENGTH = 2048
    MAX_FILENAME_LENGTH = 255
    MAX_TASK_ID_LENGTH = 128

    @classmethod
    def validate_url(cls, url: str) -> str:
        """Validate and sanitize URL input."""
        if not url:
            raise HTTPException(status_code=400, detail="URL cannot be empty")

        if len(url) > cls.MAX_URL_LENGTH:
            raise HTTPException(status_code=400, detail="URL too long")

        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                raise HTTPException(
                    status_code=400, detail="Invalid URL: contains dangerous pattern"
                )

        # Basic URL scheme validation
        if not any(
            url.lower().startswith(f"{scheme}://") for scheme in cls.ALLOWED_SCHEMES
        ):
            raise HTTPException(status_code=400, detail="Invalid URL scheme")

        return url

    @classmethod
    def validate_task_id(cls, task_id: str) -> str:
        """Validate task ID to prevent directory traversal."""
        if not task_id:
            raise HTTPException(status_code=400, detail="Task ID cannot be empty")

        if len(task_id) > cls.MAX_TASK_ID_LENGTH:
            raise HTTPException(status_code=400, detail="Task ID too long")

        # Allow only alphanumeric, dash, and underscore
        if not re.match(r"^[a-zA-Z0-9_-]+$", task_id):
            raise HTTPException(status_code=400, detail="Invalid task ID format")

        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, task_id, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid task ID: contains dangerous pattern",
                )

        return task_id

    @classmethod
    def validate_filename(cls, filename: str) -> str:
        """Validate filename to prevent path traversal."""
        if not filename:
            return filename

        if len(filename) > cls.MAX_FILENAME_LENGTH:
            raise HTTPException(status_code=400, detail="Filename too long")

        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, filename, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid filename: contains dangerous pattern",
                )

        # Remove or replace dangerous characters
        # Keep only safe characters for filenames
        safe_filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

        return safe_filename

    @classmethod
    def sanitize_path(cls, base_path: Path, relative_path: str) -> Path:
        """Safely construct a path preventing directory traversal."""
        # Normalize the relative path
        normalized = Path(relative_path).as_posix()

        # Check for dangerous patterns
        if ".." in normalized or normalized.startswith("/"):
            raise HTTPException(
                status_code=400, detail="Invalid path: directory traversal detected"
            )

        # Construct the full path
        full_path = base_path / normalized

        # Ensure the result is within the base path
        try:
            full_path.resolve().relative_to(base_path.resolve())
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid path: outside allowed directory"
            )

        return full_path

    @classmethod
    def validate_cookie_data(cls, cookies: list) -> list:
        """Validate cookie data for security."""
        if not cookies:
            return cookies

        validated_cookies = []
        for cookie in cookies:
            # Validate domain
            domain = cookie.get("domain", "")
            if not domain or len(domain) > 255:
                logger.warning(f"Invalid cookie domain: {domain}")
                continue

            # Validate name and value
            name = cookie.get("name", "")
            value = cookie.get("value", "")

            if not name or len(name) > 255 or len(value) > 4096:
                logger.warning(f"Invalid cookie size: {name}")
                continue

            # Check for dangerous patterns in cookie values
            dangerous_found = False
            for pattern in cls.DANGEROUS_PATTERNS:
                if re.search(pattern, value, re.IGNORECASE):
                    logger.warning(f"Dangerous pattern found in cookie: {name}")
                    dangerous_found = True
                    break

            if not dangerous_found:
                validated_cookies.append(cookie)

        return validated_cookies


class APIKeyAuth(HTTPBearer):
    """Optional API key authentication."""

    def __init__(self, api_key: Optional[str] = None, auto_error: bool = False):
        super().__init__(auto_error=auto_error)
        self.api_key = api_key
        self.enabled = api_key is not None

    async def __call__(
        self, request: Request
    ) -> Optional[HTTPAuthorizationCredentials]:
        if not self.enabled:
            return None

        credentials = await super().__call__(request)
        if credentials is None:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="API key required"
                )
            return None

        if credentials.credentials != self.api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key"
            )

        return credentials


def create_security_hash(data: str) -> str:
    """Create a security hash for data integrity."""
    return hashlib.sha256(data.encode()).hexdigest()


def verify_security_hash(data: str, expected_hash: str) -> bool:
    """Verify data integrity using security hash."""
    return create_security_hash(data) == expected_hash
