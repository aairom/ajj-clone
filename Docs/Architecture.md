# 🏗️ Architecture — Asnières Jujitsu Website

## System Architecture

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        PUB[Public Pages<br/>index.html / Pages/*.html]
        ADM[Admin Panel<br/>admin/login.html<br/>admin/dashboard.html]
    end

    subgraph Server["Node.js / Express Server (server.js)"]
        STATIC[Static File Server<br/>served BEFORE rate limiter]
        RL[Rate Limiter<br/>500 req / 15 min — API only]
        AUTH_MW[Auth Middleware<br/>middleware/auth.js]

        subgraph Routes["API Routes"]
            R_AUTH["/api/auth<br/>20 req/15min"]
            R_NEWS["/api/news"]
            R_CAL["/api/calendar"]
            R_CONTACT["/api/contact"]
            R_IMG["/api/images"]
            R_PRC["/api/prices"]
        end
    end

    subgraph Storage["Persistence"]
        DB[(SQLite<br/>data/admin.db)]
        FS[File System<br/>uploads/]
    end

    subgraph External["External Services"]
        SMTP[SMTP / Gmail<br/>nodemailer]
    end

    PUB -->|static assets| STATIC
    PUB -->|GET /api/news public| R_NEWS
    PUB -->|GET /api/calendar public| R_CAL
    PUB -->|GET /api/prices public| R_PRC
    ADM -->|HTTP REST| RL
    RL --> AUTH_MW
    AUTH_MW --> R_AUTH
    AUTH_MW --> R_NEWS
    AUTH_MW --> R_CAL
    AUTH_MW --> R_CONTACT
    AUTH_MW --> R_IMG
    AUTH_MW -.->|PUT protected| R_PRC

    R_AUTH -->|bcrypt + JWT| DB
    R_NEWS --> DB
    R_CAL --> DB
    R_IMG --> DB
    R_PRC --> DB
    R_IMG --> FS
    R_CONTACT --> SMTP
```

---

## Application Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Express
    participant Auth
    participant DB

    Browser->>Express: POST /api/auth/login {username, password}
    Express->>Auth: Rate-limit check (20 req / 15 min)
    Auth->>DB: SELECT user WHERE username=?
    DB-->>Auth: user row
    Auth->>Auth: bcrypt.compare(password, hash)
    Auth-->>Express: JWT token + session INSERT
    Express-->>Browser: 200 {token, user}

    Browser->>Express: GET /api/news (public — no token needed)
    Express->>DB: SELECT * FROM news ORDER BY date DESC
    DB-->>Express: rows
    Express-->>Browser: 200 {success, data:[...]}

    Browser->>Express: POST /api/images/upload (Bearer token)
    Express->>Auth: verifyToken → check sessions table
    Auth-->>Express: req.user
    Express->>FS: multer → write file, sharp → thumbnail
    Express->>DB: INSERT INTO images
    Express-->>Browser: 200 {image.path}

    Browser->>Express: POST /api/news (Bearer token)
    Express->>Auth: verifyToken + requireAdmin
    Express->>DB: INSERT INTO news (title,content,date,image,…)
    Express-->>Browser: 201 {success, data}
```

---

## Database Schema

```mermaid
erDiagram
    USERS {
        int id PK
        text username
        text password_hash
        text email
        text full_name
        text role
        int is_active
        datetime created_at
        datetime last_login
    }
    SESSIONS {
        int id PK
        int user_id FK
        text token_hash
        datetime expires_at
        datetime created_at
    }
    NEWS {
        int id PK
        text title
        text content
        date date
        text image
        int created_by FK
        datetime created_at
        datetime updated_at
    }
    CALENDAR_EVENTS {
        int id PK
        text title
        text description
        date date
        text image
        int created_by FK
        datetime created_at
        datetime updated_at
    }
    IMAGES {
        int id PK
        text filename
        text original_name
        text mime_type
        int size
        text path
        text thumbnail_path
        text alt_text
        text category
        int uploaded_by FK
        datetime created_at
    }
    PRICES {
        int id PK
        text type
        text price
        datetime updated_at
    }

    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ NEWS : "creates"
    USERS ||--o{ CALENDAR_EVENTS : "creates"
    USERS ||--o{ IMAGES : "uploads"
```

> **Note :** Le champ `image` de `calendar_events` a été ajouté en v3.0 via `ALTER TABLE`.  
> Si votre base a été initialisée avant v3.0 et que vous ne voyez pas ce champ, exécutez :  
> ```bash
> node -e "const db=require('better-sqlite3')('./data/admin.db'); db.prepare('ALTER TABLE calendar_events ADD COLUMN image TEXT DEFAULT NULL').run(); db.close();"
> ```

---

## Deployment Topology

```mermaid
graph LR
    subgraph Build["Multi-stage Build"]
        B1[Stage 1: node:20-alpine<br/>+ python3 make g++<br/>compiles native modules]
        B2[Stage 2: node:20-alpine<br/>+ libstdc++ vips only<br/>244 MB final image]
        B1 -->|COPY node_modules| B2
    end

    subgraph Container["Docker / Podman"]
        APP[ajj-app:latest<br/>USER node — non-root<br/>port 3000]
        VOL_DB[(bind: ./data)]
        VOL_UP[(bind: ./uploads)]
        APP --- VOL_DB
        APP --- VOL_UP
    end

    subgraph K8s["Kubernetes (k8s/)"]
        ING[Ingress]
        SVC[Service]
        DEP[Deployment]
        PV[PersistentVolume]
        ING --> SVC --> DEP --> PV
    end

    B2 --> APP
    Browser -->|HTTPS| ING
    Browser -->|HTTP :3000| APP
```

---

*Made with ❤️ by Bob — last updated Juillet 2026 (v3.0)*
