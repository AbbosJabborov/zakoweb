# Zakoweb Deployment Guide (VPS + Cloudflare Pages)

This guide walks through hosting **Zakoweb**:
- **Frontend**: Cloudflare Pages
- **Backend & Database**: Docker Compose (PostgreSQL, Redis, Daphne ASGI) on VPS behind **Nginx Proxy Manager**.

---

## 1. VPS Backend Deployment (Docker Compose)

### Step 1: Clone or Sync to your VPS
```bash
cd /path/to/apps/zakoweb
```

### Step 2: Configure Environment Variables
Optionally edit `docker-compose.yml` to change `DB_PASSWORD` or `SECRET_KEY`.

### Step 3: Launch Containers
```bash
docker compose up -d --build
```
This automatically:
1. Starts PostgreSQL and Redis containers.
2. Runs Django database migrations (`python manage.py migrate`).
3. Seeds initial Zakovat Question Packs (`python manage.py seed_questions`).
4. Launches Daphne ASGI Server on port `8000`.

To check logs:
```bash
docker compose logs -f backend
```

---

## 2. Nginx Proxy Manager (NPM) Configuration

In your Nginx Proxy Manager Web UI:

### Step 1: Add Proxy Host
- **Domain Names**: `zakoweb-api.claive.uz` (or your subdomain / server IP)
- **Scheme**: `http`
- **Forward Hostname / IP**: `172.17.0.1` (or your VPS IP / Docker gateway)
- **Forward Port**: `8000`
- **WebSockets Support**: ✅ **TOGGLE ON** (Crucial for live Channels connection!)

### Step 2: SSL Certificate
- Enable **Request a new SSL Certificate** via Let's Encrypt.
- Toggle **Force SSL** and **HTTP/2 Support**.

### Step 3: Advanced Nginx Tab (Custom Configuration)
Paste the following inside the **Advanced** tab to guarantee WebSocket upgrade headers:

```nginx
location /ws/ {
    proxy_pass http://172.17.0.1:8000/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
```

---

## 3. Frontend Deployment to Cloudflare Pages

1. Log into your **Cloudflare Dashboard** -> **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
2. Select repository: `AbbosJabborov/zakoweb`.
3. Configure Build Settings:
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**.

Cloudflare will deploy your frontend automatically on commit!
