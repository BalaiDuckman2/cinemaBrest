# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CinéBrest is a Flask web application that aggregates cinema showtimes from AlloCiné API for theaters in Brest and Landerneau (France). It features a 3-level caching system, user authentication, personal calendar/watchlist, and PWA capabilities.

**Key Technologies**: Flask 3.0, Python 3.13, SQLite, Tailwind CSS, Vanilla JS, Docker

## Development Commands

### Running the Application
```bash
# Local development
python app.py

# With Docker
docker compose up -d
docker compose logs -f
docker compose down

# Skip preload for faster startup during development
# Add to .env: SKIP_PRELOAD=true
```

### Database Management
```bash
# View database statistics
python db_stats.py

# Clear database cache
python clear_db.py

# Initialize auth database (if needed)
python init_auth_db.py
```

### Testing & Building
```bash
# Build Docker image
docker build -t cinebrest:latest .

# Run Docker container locally
docker run -p 5000:5000 --env-file .env cinebrest:latest
```

## Architecture Overview

### 3-Level Caching System

The application uses a sophisticated multi-tier cache to minimize API calls:

1. **HTML Cache** (`_html_cache` in [app.py](app.py)): Stores fully rendered HTML per user/week/filters → ~5ms response
2. **Week Cache** (`_week_cache` in [app.py](app.py)): Stores aggregated weekly showtime data → ~10ms
3. **Memory Cache** (`_memory_cache` in [modules/api.py](modules/api.py)): Stores Showtime objects per cinema/date → ~1ms
4. **SQLite Database** ([modules/database.py](modules/database.py)): 6-hour TTL for API responses → ~100ms
5. **AlloCiné API**: Live network requests (rate-limited to 200ms between calls) → 5-10s

**Important**: When adding/modifying showtime-related features, consider which cache levels need invalidation.

### Core Components

#### [app.py](app.py) - Main Application
- Flask routes and request handling
- `getShowtimesWeek(week_offset)`: Main data aggregation function that combines all theater showtimes for a week
- `generate_letterboxd_url(title, year)`: Generates Letterboxd search URLs for films
- Authentication routes: `/register`, `/login`, `/logout`
- Calendar/watchlist routes: `/my-calendar`, `/add-to-calendar`, `/remove-from-calendar`
- Auto-refresh background thread (runs daily at midnight)
- Cache management for HTML and week-level data

#### [modules/api.py](modules/api.py) - AlloCiné Integration
- `Theater` class: Represents a cinema, fetches showtimes via `getShowtimes(date)`
- `Movie` class: Parses AlloCiné movie data (title, poster, cast, director, release date)
  - **Film age calculation**: Uses minimum of `productionYear` and all `releases` dates to find original release
- `Showtime` class: Individual screening with time, version (VF/VO), and services
- Rate limiting: 200ms delay between API calls to avoid IP bans
- Memory cache management

#### [modules/database.py](modules/database.py) - SQLite Operations
- `CinemaDatabase` class with tables: `cinemas`, `films`, `seances`, `users`, `watchlist`, `metadata`
- User authentication: `create_user()`, `get_user_by_email()`, `get_user_by_id()`
- Watchlist CRUD: `add_to_watchlist()`, `remove_from_watchlist()`, `get_user_watchlist()`
- Cache validation: `is_cache_valid(cinema, date, ttl_hours=6)`
- Cleanup: `delete_old_seances(days_to_keep=60)` removes stale data
- Statistics: `get_stats()` for monitoring

#### [modules/auth.py](modules/auth.py) - Authentication
- `User` class (Flask-Login integration)
- Bcrypt password hashing: `hash_password()`, `check_password()`
- Session management with "remember me" (30-day sessions)

#### [modules/forms.py](modules/forms.py) - WTForms
- `LoginForm`: Email, password, remember checkbox
- `RegisterForm`: Email, name (optional), password with validation
- CSRF protection enabled

#### [modules/auto_refresh.py](modules/auto_refresh.py) - Background Tasks
- Scheduled refresh at midnight (00:00) daily
- Runs in background thread
- Clears all memory caches (_memory_cache, _week_cache, _html_cache)
- Preloads 60 days of showtime data from AlloCiné API

### Frontend Structure

#### [templates/index.html](templates/index.html) - Main Interface
JavaScript functionality:
- `changeWeek(offset)`: AJAX call to `/api/films?week=X` for weekly navigation
- `filterByVersion()`: Client-side VF/VO/VOST filtering
- `filterByCinema()`: Show/hide cinemas based on checkbox selection
- `filterByAge()`: Filter films by minimum age (+1, +5, +10, +20, +30, +50 years)
- `sortFilms()`: Sort by popularity, release date, or showtime count
- `searchFilms()`: Real-time search by title
- Watchlist integration: Colored buttons for saved showtimes, AJAX add/remove

localStorage persistence:
- `sortBy`, `minAge`, `selectedCinemas`, `versionFilter`, `compactView`

#### [templates/calendar.html](templates/calendar.html) - User Calendar
- Displays user's saved showtimes
- Remove functionality with POST to `/remove-from-calendar/<id>`
- Grouped by date for easy viewing

#### [static/sw.js](static/sw.js) - Service Worker
- Strategy: Network First, Cache Fallback
- Caches: `/`, static images (favicon, nocontent.png)
- Enables offline viewing of previously loaded pages

## Configuration

### Environment Variables ([.env.example](.env.example))

Required:
- `SECRET_KEY`: Flask session secret (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
- `JAWG_API_KEY`: Free API key from https://www.jawg.io/ for interactive map

Optional:
- `HOST`: Server bind address (default: `0.0.0.0`)
- `PORT`: Server port (default: `5000`)
- `TIMEZONE`: Timezone (default: `Europe/Paris`)
- `SKIP_PRELOAD`: Skip 2-month preload at startup (default: `false`, set `true` for dev)
- `FORCE_HTTPS`: Enable Flask-Talisman security headers (default: `false`, set `true` in production)

### Security Features

- **CSRF Protection**: Flask-WTF on all forms
- **Password Hashing**: Bcrypt with salt
- **Rate Limiting**: Flask-Limiter (200/day, 50/hour general; specific limits on auth routes)
- **Session Security**: 30-day persistent sessions with secure cookie settings
- **HTTPS**: Flask-Talisman with CSP headers (enable via `FORCE_HTTPS=true`)
- **No-Cache Headers**: Applied to auth/calendar routes to prevent stale data after login/logout

## Common Development Patterns

### Adding a New Filter
1. Add filter logic to `getShowtimesWeek()` in [app.py](app.py) (server-side) or JavaScript (client-side)
2. Update localStorage persistence in [templates/index.html](templates/index.html)
3. Add UI control in the filters section
4. Consider cache invalidation strategy

### Modifying Movie/Showtime Data Structure
1. Update `Movie` or `Showtime` class in [modules/api.py](modules/api.py)
2. Update database schema in [modules/database.py](modules/database.py) if persisting new fields
3. Update template rendering in [templates/index.html](templates/index.html)
4. Clear caches: `python clear_db.py` and restart app

### Adding Authentication-Protected Routes
```python
@app.route('/my-route')
@login_required
@no_cache  # Prevent browser caching of user-specific content
def my_route():
    # Access current_user.id, current_user.email, current_user.name
    pass
```

### Working with Watchlist
- Check if item exists: `db.is_in_watchlist(user_id, film_title, cinema, date, time)`
- Add item: `db.add_to_watchlist(user_id, film_title, cinema, date, time, url, poster, version)`
- Remove item: `db.remove_from_watchlist(watchlist_id, user_id)`
- Get user's list: `db.get_user_watchlist(user_id)`

## Important Notes

### Midnight Refresh Behavior

Every day at midnight (00:00), the application automatically:

1. **Server-side** ([modules/auto_refresh.py](modules/auto_refresh.py)):
   - Clears all memory caches (API cache, week cache, HTML cache)
   - Preloads 60 days of fresh showtime data from AlloCiné API
   - Takes ~5-10 minutes depending on API response times

2. **Client-side** ([templates/index.html](templates/index.html)):
   - Detects midnight transition via `setupMidnightRefresh()`
   - Automatically reloads page for users viewing current week (week_offset=0)
   - Users on future/past weeks are NOT reloaded automatically

3. **Cache keys updated**:
   - Week cache: `week_{offset}_date_{YYYY-MM-DD}` (invalidated at midnight)
   - HTML cache: includes current date (invalidated at midnight)

This ensures users always see fresh data starting from the current day at midnight.

### AlloCiné API Quirks
- **No official API key required** - The app scrapes public GraphQL endpoints
- **Rate limiting crucial** - Too many requests = IP ban (200ms delay between calls)
- **Film dates can be misleading** - Re-releases (e.g., "Final Cut", "Redux") may show re-release date instead of original
- **API structure can change** - No official contract, monitor for breaking changes

### Letterboxd Integration
- **Film URLs** - Each film links to Letterboxd search instead of AlloCiné
- **URL generation** - Titles are cleaned (accents removed, special chars stripped) and URL-encoded
- **Search-based** - Links go to Letterboxd search results, not direct film pages (no Letterboxd API access)
- **Opens in new tab** - All Letterboxd links use `target="_blank"` with external link icon

### Cache Invalidation Strategy
When data changes:
1. Clear `_html_cache` (always)
2. Clear `_week_cache` if weekly data affected
3. Clear `_memory_cache` in [modules/api.py](modules/api.py) if showtime data affected
4. Run `python clear_db.py` if database schema changed
5. Restart app to reset in-memory caches

### Performance Targets
- First visit (cold cache): < 3s
- Subsequent visits (SQLite cache): < 500ms
- Hot cache (memory): < 50ms
- Target: < 100 MB RAM usage

### Docker Deployment
- Image based on Alpine Linux for minimal size (~150 MB)
- Health check endpoint: `/healthcheck` (returns "ok")
- Persistent volumes: `./data` (SQLite database)
- See [docker-compose.yml](docker-compose.yml) and [Dockerfile](Dockerfile) for configuration

## Code Style Conventions

### Python ([ARCHITECTURE.md](ARCHITECTURE.md), [COPILOT_GUIDE.md](COPILOT_GUIDE.md))
- PEP 8 (4 spaces, 79 characters max)
- Type hints encouraged
- Docstrings for public functions (Google format)
- Imports: stdlib → third-party → local
- Logging with emojis: 🎬 (startup), ✓ (success), ⚠️ (warning), ❌ (error)

### JavaScript
- Vanilla JS only (no frameworks)
- camelCase for variables/functions
- `querySelector` preferred over `getElementById`
- Check localStorage availability before use

### CSS
- **Tailwind CSS only** via CDN - no custom CSS files
- Responsive classes: `sm:`, `md:`, `lg:` prefixes
- Theme color: Indigo (`bg-indigo-600`, etc.)

## Monitoring

Prometheus metrics exposed at `/metrics`:
- `flask_http_requests_total` - Total HTTP requests
- `flask_http_request_duration_seconds` - Request latency
- `allocine_api_calls_total` - External API call count
- `database_cache_hits_total` / `database_cache_misses_total` - Cache performance

## Known Limitations

- **Film age accuracy**: Re-released films may show incorrect age (AlloCiné API limitation)
- **Theater list hardcoded**: 5 theaters from Brest + Landerneau loaded at startup in [app.py](app.py:30-34)
- **No test suite**: Testing done manually (consider adding pytest)
- **Language**: French only (UI, templates, comments)

## Contributing Workflow

1. Branch from `main`: `git checkout -b feature/my-feature`
2. Test locally with `SKIP_PRELOAD=true` for faster iteration
3. Clear caches if modifying data structures: `python clear_db.py`
4. Verify Docker build: `docker build -t cinebrest:test .`
5. Commit with descriptive message
6. Push and create PR

## Notifications

À la fin des tâches longues, notifiez avec :
```bash
powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()"
```

Pour input requis :
```bash
powershell.exe -c "[System.Media.SystemSounds]::Question.Play()"
```

## Additional Documentation

- [README.md](README.md) - User-facing documentation and installation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed technical architecture
- [PRODUCTION.md](PRODUCTION.md) - Production deployment guide
- [scripts.md](scripts.md) - Useful development scripts
- [COPILOT_GUIDE.md](COPILOT_GUIDE.md) - GitHub Copilot custom commands
