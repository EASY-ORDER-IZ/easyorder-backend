# 🚀 EasyOrder Backend with Docker

## Start Services

### Development (Backend + Dev DB)

```bash
docker compose up
```

- Backend at: `http://localhost:3000`
- Dev DB at: `localhost:5432` (credentials in `.env.dev`)

### Testing (Backend + Test DB)

```bash
docker compose --profile test up
```

- Backend at: `http://localhost:3000`
- Test DB at: `localhost:5433` (credentials in `.env.test`)

---

## Rebuild Containers

If you change code or Dockerfile:

```bash
docker compose up --build
```

---

## Stop Services

```bash
docker compose down
```

Remove DB volumes (fresh databases):

```bash
docker compose down -v
```

---

## 🛠 Troubleshooting

### ❌ Error: `failed to set up container networking: network <id> not found`

This happens when Docker tries to reuse an old network that no longer exists.
Fix it with:

```bash
# Stop and remove containers, networks, volumes, and orphans
docker compose down -v --remove-orphans

# Remove dangling/unused networks
docker network prune -f

# Rebuild and start fresh
docker compose --profile test up --build
```
