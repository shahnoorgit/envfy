# 📦 **PushEnv — Secure, Encrypted .env Sync for Teams**
### *Simple. Fast. Open Source.*

Pushenv is a simple, end-to-end encrypted CLI for sharing `.env` files safely across your team — without ever storing secrets in Git or exposing plaintext to the cloud.

Built for developers who want **Doppler-level power** with **zero SaaS lock-in**.  
Runs fully local. No accounts. No dashboard. No subscriptions.

---

## 🚀 Features

- 🔐 **AES-256-GCM end-to-end encryption**  
- 🚀 **Zero-file execution** - run commands with secrets injected directly into memory  
- 🔑 **PBKDF2 passphrase-derived keys**  
  *(the passphrase is never stored; only a derived key is saved locally per device)*  
- 🖥 **Each developer enters passphrase once per machine**  
- ☁️ **Cloudflare R2 encrypted syncing (fast + free)**  
- 📁 **Per-project configuration (`.pushenv/config.json`)**  
- 💻 **Per-device keyring (`~/.pushenv/keys.json`, private to your user)**  
- 🤝 **Easy team onboarding — clone repo → pull → enter passphrase → done**  
- 📤 **Push encrypted `.env` to cloud**  
- 📥 **Pull and decrypt `.env` securely**  
- 🌲 **Multi-environment support (`development`, `staging`, `production`)**  
- 📝 **Open-source, no vendor lock-in**  

Upcoming:
- 🧪 `pushenv diff` (compare local vs remote env)  
- 🧩 VSCode integration  
- 🤖 GitHub Actions integration  

---

## 🔧 Installation

```bash
npm install -g pushenv
```

Or for local development:

```bash
npm link
```

---

## 🛠 Quick Start

### 1. Initialize your project
Inside your repo:

```bash
pushenv init
```

You'll be asked:

- Which stages/environments to configure (development, staging, production)
- Where each stage's `.env` file is located
- Enter a passphrase (your team secret)

This creates:

```
.pushenv/config.json      # project config with stage mappings
~/.pushenv/keys.json      # per-device keyring (private)
```

---

### 2. Push your encrypted `.env` to R2

```bash
# Push development (default)
pushenv push

# Push a specific stage
pushenv push --stage staging
pushenv push --stage production
# Or use short form:
pushenv push -s staging
pushenv push -s production
```

This will:

- Read the stage-specific `.env` file
- Encrypt it locally
- Upload an encrypted blob to Cloudflare R2  
  *(never storing plaintext in the cloud)*

---

### 3. Share with teammates

- Commit `.pushenv/config.json` to Git  
- Share the **passphrase** privately (call / WhatsApp / in person)

---

### 4. Teammates pull & decrypt

Teammate clones the repo and runs:

```bash
# Pull development (default)
pushenv pull

# Pull a specific stage
pushenv pull --stage staging
pushenv pull --stage production
# Or use short form:
pushenv pull -s staging
pushenv pull -s production
```

They enter the shared passphrase once.

Then:

- Pushenv derives the AES key  
- Decrypts the remote blob  
- Writes the stage-specific `.env` file to disk  
- Stores the derived key locally so future pulls don't require the passphrase  

Done. 🎉

---

### 5. Zero-File Execution (Advanced)

Run commands with secrets injected directly into process memory — **no .env file ever touches disk**:

```bash
# Run with development secrets (default)
pushenv run "npm start"

# Run with production secrets
pushenv run --stage production "npm start"
# Or use short form:
pushenv run -s production "npm start"

# Preview what would be injected (dry run)
pushenv run --stage production --dry-run "npm start"

# Show variable names being injected
pushenv run --stage production --verbose "npm start"
# Or use short form:
pushenv run -s production -v "npm start"

# Combine options: stage + verbose + dry-run
pushenv run -s production -v --dry-run "npm start"
```

This is the **most secure way** to use secrets:
- Secrets exist only in process memory
- No file to accidentally commit or leak
- When the process exits, secrets are gone
- Perfect for CI/CD and production deployments

---

## 🔒 Security Model

Pushenv is a simple, end-to-end encrypted CLI for sharing `.env` files safely across your team — without ever storing secrets in Git or exposing plaintext to the cloud.

### ✔ No plaintext secrets stored in Git  
### ✔ Passphrase is never stored anywhere  
### ✔ Only the derived AES key is saved locally (per-device)  
### ✔ AES-256-GCM authenticated encryption  
### ✔ PBKDF2 key derivation with salt  
### ✔ Salt embedded in encrypted payload for reproducible key derivation  
### ✔ Encrypted secrets stored in Cloudflare R2  
### ✔ Your `.env` file is decrypted **locally only** — never sent in plaintext across the network  
### ✔ Keyring is stored under your user account (`~/.pushenv/keys.json`)  

This keeps Pushenv secure, predictable, and aligned with modern cryptographic best practices.

---

## 📁 Project Structure

```
project/
  .env.development        # development environment
  .env.staging            # staging environment  
  .env.production         # production environment
  .pushenv/
    config.json           # safe to commit (contains stage mappings)
~/.pushenv/
  keys.json               # per-device keyring (private, never commit)
```

---

## 🌩 Cloudflare R2 Setup (Required)

Set the following environment variables:

```bash
export R2_BUCKET="your-bucket"
export R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
export R2_ACCESS_KEY="..."
export R2_SECRET_ACCESS_KEY="..."
```

These match what the CLI reads in `src/config/r2-credentials.ts`.

Pushenv uses R2’s S3-compatible API for encrypted storage.

---

## 🧪 Example Workflow

```bash
# Initialize with stages (development, staging, production)
pushenv init

# Push all your stages
pushenv push --stage development
pushenv push -s staging
pushenv push -s production

# Commit config to git
git add .pushenv/config.json
git commit -m "add pushenv config"
git push
```

Teammate:

```bash
git clone <repo>
cd repo

# Check available stages first
pushenv list-stages
# Or use alias:
pushenv ls

# Pull the stage they need
pushenv pull --stage development
# Or use short form:
pushenv pull -s development
```

---

## 📖 Commands

| Command | Description |
|--------|-------------|
| `pushenv init` | Initialize project for Pushenv (with stage selection) |
| `pushenv push` | Encrypt & upload `.env` (default: `development` stage) |
| `pushenv push -s <stage>`<br/>`pushenv push --stage <stage>` | Encrypt & upload specific stage |
| `pushenv pull` | Download & decrypt `.env` (default: `development` stage) |
| `pushenv pull -s <stage>`<br/>`pushenv pull --stage <stage>` | Download & decrypt specific stage |
| `pushenv run <command>` | Run command with secrets injected (no file created, default: `development` stage) |
| `pushenv run -s <stage> <command>`<br/>`pushenv run --stage <stage> <command>` | Run with specific stage secrets |
| `pushenv run --dry-run <command>` | Preview what would be injected without running |
| `pushenv run -v <command>`<br/>`pushenv run --verbose <command>` | Show variable names being injected |
| `pushenv run -s <stage> -v --dry-run <command>` | Options can be combined (stage + verbose + dry-run) |
| `pushenv list-stages`<br/>`pushenv ls` | Show all configured stages and their status (local & cloud) |
| *(coming soon)* `pushenv diff` | Compare local vs remote |

---

## 🔥 Why Pushenv?

Pushenv is a simple, end-to-end encrypted CLI for sharing `.env` files safely across your team — without ever storing secrets in Git or exposing plaintext to the cloud.

- A dead-simple `.env` sync solution  
- No SaaS lock-in  
- No dashboards  
- No user accounts  
- No server  
- Just **encryption + R2 + CLI**  

If SOPS is too heavy…  
If Doppler is too “enterprise”…  
If git-crypt is too annoying…  

**Pushenv is the perfect middle-ground.**

---

## 🛣 Roadmap

### v0.2.0 ✅
- ✅ Multi-env (`development`, `staging`, `production`)  
- ✅ `list-stages` command
- ✅ `run` command - zero-file execution

### v0.3.0  
- Env diff  
- CI/CD examples  
- More tests

### v0.4.0  
- VSCode extension  
- GitHub Action to sync secrets automatically  

### v1.0  
- Optional team key-sharing  
- UI dashboard (optional)  
- Desktop app (optional)

---

## ❤️ Contributing

PRs welcome!  
Pushenv is a simple, end-to-end encrypted CLI for sharing `.env` files safely across your team — without ever storing secrets in Git or exposing plaintext to the cloud.

If you want to help with:

- diff logic  
- docs  
- testing  
- examples  
- VSCode extension

Feel free to open an issue or PR.

---

## 📜 License

MIT — fully open source, commercial-friendly.

---

## 🙋 Author

**Shahnoor Mujawar**  
Builder of developer tools  
Backend + Infra + AI engineer  
Founder of Dtrue  
On a mission to make dev tooling simpler & faster  

---

# ⭐ If you like Pushenv, star the repo!

Your star helps more developers discover it.  
Let’s build the go-to open-source `.env` sync tool!
