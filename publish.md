# Publishing guide

## Option A — npm (recommended)

Enables `npx sutils` for anyone without installing.

### First publish

```bash
# 1. Create an npm account at https://www.npmjs.com/signup
#    then log in locally
npm login

# 2. Check the package name is available
npm search sutils

# 3. If the name is taken, update "name" in package.json
#    e.g. "sutils-cli" or "@yourname/sutils"

# 4. Publish
npm publish
```

Anyone can now run:

```bash
npx sutils monitor init
npx sutils monitor start
```

### Publishing updates

```bash
# Bump the version (pick one)
npm version patch   # 1.0.0 → 1.0.1  (bug fix)
npm version minor   # 1.0.0 → 1.1.0  (new feature)
npm version major   # 1.0.0 → 2.0.0  (breaking change)

# Publish the new version
npm publish
```

---

## Option B — GitHub

No npm account needed. Good for sharing with a known audience.

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"

# Create a repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USER/sutils.git
git push -u origin main
```

Users install directly from GitHub:

```bash
npm install -g github:YOUR_USER/sutils
sutils monitor init
sutils monitor start
```

### Publishing updates

```bash
git add .
git commit -m "describe your change"
git push
```

Users reinstall to get the latest:

```bash
npm install -g github:YOUR_USER/sutils
```

---

## Option C — GitHub Packages (scoped npm)

Hosted on GitHub but installable via `npx`. Requires a GitHub account.

### Setup

```bash
# 1. Update package.json
#    "name": "@YOUR_GITHUB_USER/sutils"
#    "publishConfig": { "registry": "https://npm.pkg.github.com" }

# 2. Authenticate
npm login --registry=https://npm.pkg.github.com
# Username: your GitHub username
# Password: a GitHub personal access token with write:packages scope

# 3. Publish
npm publish
```

Users authenticate once then can run:

```bash
npx @YOUR_GITHUB_USER/sutils monitor init
```

---

## Checklist before publishing

- [ ] `name` in `package.json` is unique on the target registry
- [ ] `version` is correct
- [ ] `README.md` is up to date
- [ ] Tested with `sutils monitor start --dry-run`
- [ ] No secrets or local config files committed (check `.gitignore`)

## Recommended .gitignore

```
node_modules/
config.yaml
*.log
```
