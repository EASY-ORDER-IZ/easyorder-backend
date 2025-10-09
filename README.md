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

# ⚙️ Continuous Integration (CI) Workflows

The **EasyOrder Backend** repository uses **GitHub Actions** to maintain code quality and reliability before merging any pull requests.

## 🧹 Code Quality Checks (`.github/workflows/code-quality.yml`)

This workflow runs automatically on every pull request and push to `main` that affects code or configuration files.

### What It Does

* ✅ Runs **ESLint** to enforce TypeScript coding standards
* ✅ Runs **Prettier** to verify code formatting
* ❌ Fails if lint or formatting errors are found

### Run Locally Before Pushing

```bash
npm run format
npm run lint

# Auto-fix fixable issues
npm run lint:fix
```

---

## 🧪 Build & Test (`.github/workflows/build-and-test.yml`)

This workflow ensures all code changes compile successfully and that all unit tests pass before merging.

### What It Does

* 🧾 Checks out repository code
* 🧰 Sets up Node.js (v20)
* 📦 Installs dependencies using `npm ci`
* 🏗️ Builds the project (`npm run build`)
* 🧪 Runs Jest tests with coverage output to CI logs
* ❌ Fails automatically if build or tests fail

### Triggered On

* Every pull request that modifies backend code
* Every push to the `main` branch

### Run Locally Before Opening a PR

```bash
npm run build
npm test
```

---

✅ **Summary**

| Workflow             | Purpose                  | Triggers               |
| -------------------- | ------------------------ | ---------------------- |
| `code-quality.yml`   | Lint & formatting checks | PRs and pushes to main |
| `build-and-test.yml` | Build + Jest tests       | PRs and pushes to main |

These workflows ensure only **clean, tested, and properly formatted code** is merged into the main branch.

```

