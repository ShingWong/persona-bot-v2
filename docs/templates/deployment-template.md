# Deployment Guide Template

This template covers deploying persona-bot with Docker/Podman and HAProxy.

## Prerequisites

- Docker or Podman installed
- Domain name (e.g., persona-bot.com)
- SSL certificate (Let's Encrypt or purchased)

## Architecture

```
                    ┌──────────────┐
                    │     DNS      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   HAProxy    │ (SSL Termination)
                    │   :443       │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │  Frontend   │           │   Backend   │
       │  Next.js    │           │   Express   │
       │  :3000      │           │   :3001     │
       └─────────────┘           └──────┬──────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
             ┌──────────┐        ┌──────────┐        ┌──────────┐
             │ Postgres │        │  Redis   │        │  Ollama  │
             │:5432     │        │ :6379    │        │ :11434   │
             └──────────┘        └──────────┘        └──────────┘
```

## Step 1: Clone and Configure

```bash
# Clone the project
git clone https://github.com/your-org/persona-bot.git
cd persona-bot

# Copy environment template
cp configs/.env.example .env

# Edit configuration
nano .env
```

## Step 2: SSL Certificates

### Option A: Let's Encrypt (Automatic)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d api.persona-bot.com
```

### Option B: Self-Signed (Testing Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout persona-bot.key -out persona-bot.pem \
  -subj "/C=US/ST=State/L=City/O=PersonaBot/CN=persona-bot.com"

# Combine for HAProxy
cat persona-bot.pem persona-bot.key > persona-bot.combined.pem
```

## Step 3: Configure HAProxy

```bash
# Copy HAProxy config
sudo cp configs/haproxy.cfg /etc/haproxy/haproxy.cfg

# Update certificate paths in config
sudo nano /etc/haproxy/haproxy.cfg

# Test configuration
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# Restart HAProxy
sudo systemctl restart haproxy
```

## Step 4: Build and Start Services

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Build images
docker-compose -f docker-compose.yml build

# Run in detached mode
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps
```

## Step 5: Database Setup

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed default data (optional)
docker-compose exec backend npx prisma db seed

# Verify database
docker-compose exec backend npx prisma studio
```

## Step 6: Verify Deployment

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000

# Check HAProxy stats
curl http://localhost:8404/stats
```

## Maintenance

### Backup Database

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres personabot > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U postgres personabot < backup_20240101.sql
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Prune unused images
docker image prune -f
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Database not ready: wait for postgres health check
# - Missing env vars: verify .env file
# - Port conflict: check if port 3001 is in use
```

### Database Connection Failed

```bash
# Verify database is running
docker-compose ps

# Test connection
docker-compose exec backend nc -zv postgres 5432

# Check logs
docker-compose logs postgres
```

### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/persona-bot.com/fullchain.pem -noout -dates

# Renew certificate
sudo certbot renew
```

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Use strong JWT secrets (`openssl rand -base64 32`)
- [ ] Enable firewall (allow only ports 80, 443)
- [ ] Enable fail2ban for brute force protection
- [ ] Set up log rotation
- [ ] Regular database backups
- [ ] Keep Docker images updated

## Monitoring

### Health Checks

```bash
# Backend
curl -f http://localhost:3001/health || echo "Backend unhealthy"

# Frontend
curl -f http://localhost:3000 || echo "Frontend unhealthy"

# Database
docker-compose exec postgres pg_isready
```

### Resource Usage

```bash
# View resource usage
docker stats

# View detailed info
docker inspect persona-bot-backend
```
