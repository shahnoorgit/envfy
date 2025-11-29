# 📦 PushEnv — Secure, Encrypted .env Sync for Teams
### *Simple. Fast. Open Source.*

[![npm version](https://img.shields.io/npm/v/pushenv.svg)](https://www.npmjs.com/package/pushenv)
[![npm downloads](https://img.shields.io/npm/dw/pushenv.svg)](https://www.npmjs.com/package/pushenv)
[![license](https://img.shields.io/npm/l/pushenv.svg)](./LICENSE)

> **TL;DR:** Sync encrypted `.env` files across your team safely — no plaintext secrets in Git, no SaaS lock-in. Just encryption.

PushEnv solves the **core problem** developers face: **sharing `.env` files across teams without exposing secrets**. It's an open-source, end-to-end encrypted CLI that keeps your secrets safe — no plaintext in Git, Docker images, CI logs, or cloud storage.

Built for developers who want **Doppler-level power** with **zero SaaS lock‑in**.  
Runs fully local. No accounts. No dashboards. No subscriptions.

---

## 🚀 Features

- 🚀 **Zero-file execution** — run commands with secrets injected directly into memory, no `.env` files ever written to disk  
- 🔐 **AES-256-GCM end-to-end encryption** — secrets encrypted before leaving your machine  
- 🔑 **PBKDF2 passphrase-derived keys** — passphrase never stored, only derived key  
- 🌲 **Multi-environment support** — manage `development`, `staging`, `production` separately  
- 💾 **Works with any S3-compatible storage** — Cloudflare R2, AWS S3, MinIO, etc.  
- 🖥 **One-time passphrase per machine** — enter once, key stored securely  
- 📁 **Per-project configuration** — `.pushenv/config.json` (safe to commit)  
- 💻 **Per-device keyring** — `~/.pushenv/keys.json` (private, never commit)  
- 🔓 **Secrets never sent in plaintext** — encrypted end-to-end  
- 📝 **Fully open-source, no vendor lock-in**

---

## 🔧 Installation

```bash
npm install -g pushenv
```

OR for development:

```bash
npm link
```

---

## 🛠 Quick Start

### 1️⃣ Initialize

```bash
pushenv init
```

You'll choose:
- environments (dev, staging, prod)
- file paths for each env
- passphrase (team secret)

Creates:

```
.pushenv/config.json      # safe to commit
~/.pushenv/keys.json      # device keyring (private)
```

---

### 2️⃣ Push encrypted `.env` files

```bash
pushenv push
pushenv push --stage staging
pushenv push --stage production
```

PushEnv will:
- Read your `.env`
- Encrypt locally
- Upload the encrypted blob to cloud

Secrets **never** leave your machine unencrypted.

---

### 3️⃣ Teammates pull & decrypt

```bash
pushenv pull
pushenv pull -s production
```

After entering passphrase once:
- AES key is derived
- Encrypted blob downloaded
- Decrypted locally only
- `.env` file written to your configured path

**Note:** PushEnv will prompt for confirmation when pushing/pulling production environments for safety.

---

## 🚀 Zero-File Execution (Advanced)

**Optional feature:** Run commands with secrets injected directly into process memory — no `.env` file written to disk.

```bash
# Run with development secrets (default)
pushenv run "npm start"

# Run with production secrets
pushenv run -s production "npm start"
pushenv run --stage production "npm start"

# Preview what would be injected (dry run)
pushenv run --dry-run -s production "npm start"

# Show variable names being injected
pushenv run -v "npm start"
pushenv run --verbose "npm start"

# Combine options
pushenv run -s production -v --dry-run "npm start"
```

**When to use:**
- CI/CD pipelines where you don't want `.env` files
- Docker containers for cleaner images
- Extra-paranoid security workflows
- When you want secrets to vanish when process exits

**Benefits:**
- No `.env` file to accidentally commit
- No residual secret files on disk
- Secrets only exist in process memory
- Perfect for production deployments

---

## 🔒 Security Model

✔ No plaintext secrets stored in Git  
✔ Passphrase never stored  
✔ Only derived AES key stored locally  
✔ AES-256-GCM authenticated encryption  
✔ PBKDF2 key derivation  
✔ Encrypted blobs stored in cloud
✔ Secrets decrypted locally only  
✔ Keyring stored per-user (`~/.pushenv/keys.json`)  

PushEnv follows modern cryptography and zero-trust local workflows.

---

## 📁 Project Structure

```
project/
  .env.development
  .env.staging
  .env.production
  .pushenv/
    config.json
~/.pushenv/
  keys.json
```

## 📖 Commands

| Command | Description |
|--------|-------------|
| `pushenv init` | Initialize project (configure stages and passphrase) |
| `pushenv push` | Encrypt & upload `.env` (default: `development` stage) |
| `pushenv push -s <stage>`<br/>`pushenv push --stage <stage>` | Encrypt & upload specific stage |
| `pushenv pull` | Download & decrypt `.env` (default: `development` stage) |
| `pushenv pull -s <stage>`<br/>`pushenv pull --stage <stage>` | Download & decrypt specific stage |
| `pushenv run <command>` | Run command with secrets in memory (default: `development` stage) |
| `pushenv run -s <stage> <command>`<br/>`pushenv run --stage <stage> <command>` | Run with specific stage secrets |
| `pushenv run --dry-run <command>` | Preview what would be injected without running |
| `pushenv run -v <command>`<br/>`pushenv run --verbose <command>` | Show variable names being injected |
| `pushenv list-stages`<br/>`pushenv ls` | List all configured stages and their status |
| *(coming soon)* `pushenv diff` | Compare local vs remote |

---

## 🔥 Why PushEnv?

**Solves the real problem:** Sharing `.env` files across teams without exposing secrets.

- ✅ **No `.env` files in Git** — encrypted blobs only  
- ✅ **No plaintext exposure** — end-to-end encryption  
- ✅ **No SaaS lock-in** — use your own S3-compatible storage  
- ✅ **Simple workflow** — push, pull, done  
- ✅ **Team-friendly** — one passphrase, works everywhere  
- ✅ **Open-source** — no vendor lock-in, fully auditable  

Perfect for:
- **Teams** sharing secrets across developers  
- **CI/CD** pipelines needing secure env injection  
- **Local development** with secure secret management  
- **Docker** workflows without committing secrets  
- **Solo developers** wanting better security practices

---

## 🛣 Roadmap

### v0.1.6 (done)
- Multi-env  
- `list-stages`  
- Zero-file execution  

### v0.1.7 (coming soon)
- Env diff  

---

## ❤️ Contributing

PRs welcome!

---

## 📜 License
MIT — open-source, commercially friendly.

---

## 🙋 Author
**Shahnoor Mujawar**  
Founder of Dtrue  
Backend + Infra + AI engineer  

---

⭐ **If you like PushEnv, star the repo!**  
Your star helps other developers discover it.