# 📦 PushEnv
### *The modern dotenv with validation, type safety, and team sync.*

[![npm version](https://img.shields.io/npm/v/pushenv.svg)](https://www.npmjs.com/package/pushenv)
[![npm downloads](https://img.shields.io/npm/dw/pushenv.svg)](https://www.npmjs.com/package/pushenv)
[![license](https://img.shields.io/npm/l/pushenv.svg)](./LICENSE)

> **PushEnv turns your `.env` into a typed, validated, auto-documented configuration system.**

Drop-in `dotenv` replacement with Zod validation, automatic TypeScript types, and encrypted team sync. Use as a library for local dev, CLI for team collaboration.

## 🎯 Before vs After

### Before (dotenv)
```javascript
require('dotenv').config();
const port = process.env.PORT;      // string | undefined ⚠️
const dbUrl = process.env.DB_URL;   // Could be missing! 💥
```

### After (PushEnv)
```typescript
// config/env.ts - Define once
import { validateEnv, z } from 'pushenv';

export const env = validateEnv({
  schema: z.object({
    PORT: z.coerce.number(),
    DB_URL: z.string().url(),
  })
});

// server.ts - Use everywhere with full types!
import { env } from './config/env';

env.PORT;    // number ✓ Fully typed!
env.DB_URL;  // string ✓ Validated URL!
```

**One config file → full type safety everywhere.** Catch errors at startup, not in production.

---

## 🎯 Two Ways to Use PushEnv

### 1️⃣ As a Library (dotenv alternative)
- 📚 Drop-in replacement for `dotenv` with better features
- ✅ Built-in **Zod validation** — catch config errors at startup
- 🎨 TypeScript-first with full type safety
- 🔧 **Auto TypeScript type generation** — no manual `.d.ts` files
- 🚀 Zero dependencies on external services

### 2️⃣ As a CLI (team sync tool)
- 🔐 **Zero-knowledge encryption** — We can't see your secrets, only you can decrypt them
- ☁️ **PushEnv's managed cloud included** — No setup, no AWS/S3 config needed
- 📜 **Version control** for your environment variables
- 🔓 **End-to-end encrypted** — Encrypted on your machine before upload
- 🎯 **No accounts required** — just install and go

**Why PushEnv?** Get the power of Doppler/Vault without SaaS lock-in. Your secrets are encrypted client-side with your passphrase - we never see them in plaintext!

### PushEnv vs dotenv

| Feature | dotenv | PushEnv |
|---------|--------|---------|
| `.env` loading | ✅ | ✅ |
| Zod validation | ❌ | ✅ |
| TypeScript type generation | ❌ | ✅ |
| Catch missing vars at startup | ❌ | ✅ |
| Type-safe `process.env` | ❌ | ✅ |
| CLI for team sync | ❌ | ✅ |
| PushEnv's managed cloud (zero-knowledge) | ❌ | ✅ |
| Encrypted cloud backup | ❌ | ✅ |
| Version control | ❌ | ✅ |
| Auto `.gitignore` | ❌ | ✅ |
| Zero config | ✅ | ✅ |

### When to Use What?

| Use Case | Library | CLI |
|----------|---------|-----|
| Load `.env` files locally | ✅ | ❌ |
| Validate env vars with schema | ✅ | ❌ |
| Type-safe environment config | ✅ | ❌ |
| Generate TypeScript types | ✅ | ✅ |
| Sync secrets across team | ❌ | ✅ |
| Encrypted cloud backup | ❌ | ✅ |
| Version control for secrets | ❌ | ✅ |
| CI/CD secret injection | ✅ Both | ✅ |

**Pro tip:** Use library for local dev, CLI for team sync! They work great together.

---

## 🚀 Features

### Library Features (dotenv alternative)
- 📚 **Drop-in dotenv replacement** — use `pushenv.config()` instead of `dotenv.config()`
- ✅ **Zod validation** — validate env vars with schemas, catch errors at startup
- 🎨 **Full TypeScript support** — get type-safe environment variables
- 🔧 **Auto TypeScript type generation** — generate `.d.ts` files from Zod schemas
- 🔄 **Compatible API** — supports `path`, `override`, `debug` options like dotenv
- 🚫 **Better error messages** — clear validation errors with helpful suggestions

### CLI Features (team sync)

#### Core Security
- 🔐 **AES-256-GCM end-to-end encryption** — secrets encrypted before leaving your machine  
- 🔑 **PBKDF2 passphrase-derived keys** — passphrase never stored, only derived key  
- 🔓 **Secrets never sent in plaintext** — encrypted end-to-end  
- 🖥 **One-time passphrase per machine** — enter once, key stored securely  
- 💻 **Per-device keyring** — `~/.pushenv/keys.json` (private, never commit)  

#### Environment Management
- 🌲 **Multi-environment support** — manage `development`, `staging`, `production` separately  
- ➕ **Add stages on-the-fly** — add new environments without reinitializing (`add-stage` command)  
- 🛡️ **Smart file naming** — automatic `.env.{stage}` suggestions prevent accidental secret mixing  
- 📋 **Stage overview** — list all configured stages and their status  

#### Version Control & History
- 📜 **Built-in version history** — every push creates a new, timestamped version with an optional message (like Git for your `.env`)  
- 🔍 **Diff any version** — compare your local `.env` with the latest remote or with a specific historical version before you pull or roll back  
- ⏪ **Safe rollbacks** — restore any previous version of a stage with a single command (with extra guardrails for production)  
- 📝 **Version messages** — annotate each push with custom messages for better tracking  

#### Advanced CLI Features
- 🚀 **Zero-file execution** — run commands with secrets injected directly into memory, no `.env` files ever written to disk  
- 📄 **Example file generation** — create safe `.env.example` files with placeholders for version control  
- ☁️ **PushEnv's managed cloud** — built-in storage, no AWS/S3 setup needed  
- 🔒 **Zero-knowledge encryption** — your passphrase never leaves your machine, we can't decrypt your secrets
- 📁 **Per-project configuration** — `.pushenv/config.json` (safe to commit)  
- 📝 **Fully open-source, no vendor lock-in**


## 🔧 Installation

```bash
npm install pushenv          # Local (library)
npm install -g pushenv       # Global (CLI)
```

**Note:** Zod is included - just `import { z } from 'pushenv'`

### Migration from dotenv

```bash
npm uninstall dotenv
npm install pushenv
```

**Then change your code:**

```diff
- import dotenv from 'dotenv';
- dotenv.config();
+ import pushenv from 'pushenv';
+ pushenv.config();
```

Or use named imports:

```diff
- require('dotenv').config();
+ import { config } from 'pushenv';
+ config();
```

**That's it!** Your existing code works as-is. Now you can optionally add validation:

```typescript
import { validateEnv, z } from 'pushenv';

export const env = validateEnv({
  schema: z.object({
    PORT: z.coerce.number(),
    DATABASE_URL: z.string().url(),
  })
});
```

---

## 📚 Library Usage

### Type-Safe Validation 🔥

**Want type-safe, validated envs?** Use `validateEnv()` - it does everything in one call.

**Create a central config file:**

```typescript
// src/config/env.ts
import { validateEnv, z } from 'pushenv';

export const env = validateEnv({
  schema: z.object({
    // Server
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    
    // Database
    DATABASE_URL: z.string().url(),
    DB_POOL_SIZE: z.coerce.number().default(10),
    
    // Cache & Features
    REDIS_URL: z.string().url().optional(),
    ENABLE_CACHE: z.coerce.boolean().default(false),
    
    // Secrets
    JWT_SECRET: z.string().min(32),
    API_KEY: z.string().optional(),
    
    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
  generateTypes: process.env.NODE_ENV !== 'production',
});

// Optional: Export type for use in other files
export type Env = typeof env;
```

**Then use throughout your application:**

```typescript
// src/server.ts
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

// src/database.ts
import { env } from './config/env';

const db = connectDB({
  url: env.DATABASE_URL,
  poolSize: env.DB_POOL_SIZE,
});

// src/cache.ts
import { env } from './config/env';

if (env.ENABLE_CACHE && env.REDIS_URL) {
  initRedis(env.REDIS_URL);
}
```

**Benefits:**
- ✅ `env.PORT` is a real `number`, not string
- ✅ Validated once at startup - crashes early if config is wrong
- ✅ Full TypeScript autocomplete everywhere
- ✅ Import from one place across your entire app

### Or: Just Load .env (No Validation)

```typescript
import { config } from 'pushenv';

config();  // Like dotenv - loads .env, no validation
config({ path: '.env.production', override: true });
```

### Advanced Options

<details>
<summary>Non-throwing validation (warnings instead of crashes)</summary>

```typescript
import { config, validate, z } from 'pushenv';

config();
const result = validate({
  schema: z.object({ DATABASE_URL: z.string().url() }),
  throwOnError: false,
});

if (!result.success) {
  console.warn('⚠️ Using defaults');
}
```
</details>

<details>
<summary>Separate validation steps (more control)</summary>

```typescript
import { config, validateOrThrow, z } from 'pushenv';

config();
const env = validateOrThrow(z.object({
  PORT: z.coerce.number(),
}));
```
</details>

<details>
<summary>Generate types via CLI</summary>

```bash
pushenv generate-types
pushenv generate-types --env-path .env.production --output env.d.ts
```
</details>

### API Reference

#### `config(options)`

Load and parse a `.env` file into `process.env`.

```typescript
interface ConfigOptions {
  path?: string;           // .env file path (default: ".env")
  override?: boolean;      // override existing process.env (default: false)
  debug?: boolean;         // log debug info (default: false)
  encoding?: string;       // file encoding (default: "utf8")
  schema?: z.ZodObject<any>;      // Zod schema for validation
  generateTypes?: boolean | Partial<GenerateTypesOptions>; // Auto-generate types
}

interface ConfigResult {
  parsed?: { [key: string]: string };
  error?: Error;
}
```

#### `validate(options)`

Validate environment variables against a Zod schema.

```typescript
interface ValidateOptions {
  schema: z.ZodObject<any>;
  throwOnError?: boolean;  // throw or log warnings (default: true)
  debug?: boolean;         // show debug info (default: false)
}

interface ValidateResult {
  success: boolean;
  data?: any;
  errors?: ValidationError[];
}
```

#### `validateOrThrow(schema)`

Convenience function that validates and returns typed data or throws.

```typescript
function validateOrThrow<T extends z.ZodObject<any>>(
  schema: T
): z.infer<T>;
```

#### `validateEnv(options)` 🔥

**Recommended!** All-in-one function that loads `.env`, validates, and generates types.

```typescript
interface ValidateEnvOptions<T extends z.ZodObject<any>> {
  schema: T;
  path?: string;              // .env file path (default: ".env")
  override?: boolean;         // override existing process.env (default: false)
  debug?: boolean;            // log debug info (default: false)
  generateTypes?: boolean | Partial<GenerateTypesOptions>; // Auto-generate types (default: true)
}

function validateEnv<T extends z.ZodObject<any>>(
  options: ValidateEnvOptions<T>
): z.infer<T>;
```

**Perfect for:**
- TypeScript projects wanting full type safety
- One-liner setup with validation + types
- Production apps that need startup validation

#### `generateTypes(options)`

Generate TypeScript type definitions from a Zod schema.

```typescript
interface GenerateTypesOptions {
  schema: z.ZodObject<any>;
  output?: string;           // Output file path (default: "pushenv-env.d.ts")
  addToGitignore?: boolean;  // Add to .gitignore (default: true)
  silent?: boolean;          // Suppress console output (default: false)
}

interface GenerateTypesResult {
  success: boolean;
  outputPath?: string;
  error?: Error;
}
```

**Features:**
- Infers proper TypeScript types from Zod schemas
- Distinguishes required vs optional fields
- Supports enums, unions, literals, and more
- Automatically adds output file to `.gitignore`


## 🛠 CLI Usage (Team Sync)

Use the CLI to securely sync `.env` files across your team with end-to-end encryption.

### ☁️ PushEnv's Managed Cloud (Zero-Knowledge)

**No setup required!** PushEnv provides its own managed cloud storage. Just install and start using `push`/`pull` commands immediately.

- ✅ **Zero config** — no AWS/S3 setup, works out of the box
- ✅ **No accounts** — no signup, no API keys, no dashboards
- ✅ **Zero-knowledge encryption** — your secrets are encrypted on your machine before upload
- 🔒 **We can't decrypt your secrets** — only your passphrase can decrypt them
- ✅ **End-to-end encrypted** — AES-256-GCM with PBKDF2 key derivation

### 🤝 Who is this for?

- **Solo developers** who want better secret hygiene without running another SaaS dashboard  
- **Small teams** who just want a **simple "push / pull" workflow** that works across laptops and CI  
- **Teams** who want encrypted secret storage without vendor lock-in

You can get from "zero" to "secure `.env` synced for the whole team" in **under 5 minutes**:

### CLI Quick Start

### 1️⃣ Initialize

```bash
pushenv init
```

You'll choose:
- environments (dev, staging, prod)
- file paths for each env (defaults to `.env.{stage}` for safety)
- passphrase (team secret)

**Safety feature:** If you try to use plain `.env` for a specific stage, pushenv will:
- Warn you about the risks
- Offer to automatically rename it to `.env.{stage}`
- Help you avoid accidentally pushing wrong secrets to wrong environments

Creates:

```
.pushenv/config.json      # safe to commit
~/.pushenv/keys.json      # device keyring (private)
```

**💡 Adding stages later:**

Already initialized but need to add production or staging? No problem!

```bash
pushenv add-stage
```

This adds new stages without losing your existing configuration or project ID.

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

### 4️⃣ Compare local vs remote

See what's different between your local `.env` and the remote version **before pulling** or rolling back:

```bash
# Compare development (default)
pushenv diff

# Compare specific stage
pushenv diff --stage production
pushenv diff -s staging
```

Shows:
- **Added** variables (in remote, not local)
- **Removed** variables (in local, not remote)
- **Changed** values (same key, different value)
- **Unchanged** count

**Safety features:**
- Verifies local file stage matches command parameter
- Warns if stage mismatch detected
- Handles files without PushEnv headers

---

### 5️⃣ Browse history & roll back (versioning)

Every `pushenv push` creates a new version with a timestamp and message:

```bash
# Show version history for a stage
pushenv history
pushenv history --stage production

# Push with a custom message (great for rollouts)
pushenv push -m "Add STRIPE_WEBHOOK_SECRET for billing rollout"
pushenv push --stage staging -m "Rotate JWT_SECRET"

# Diff against a specific historical version before rolling back
pushenv diff --stage production --version 3

# Roll back production to a previous version (creates a new version with rollback message)
pushenv rollback --stage production --version 3
```

This makes it easy to:

- Track how your secrets changed across rollouts  
- Safely undo a bad deploy by restoring a known-good `.env`  
- Audit who changed what (when paired with Git history around `pushenv` usage)  

---

### 6️⃣ Generate example .env file

Create a safe example `.env` file with placeholder values that can be committed to Git:

```bash
# Generate example for development (default)
pushenv example

# Generate example for specific stage
pushenv example --stage production
pushenv example -s staging

# Specify custom output path
pushenv example --stage production -o .env.production.example
```

**What it does:**
- Downloads and decrypts remote stage
- Replaces all secret values with placeholders
- Creates `.env.{stage}.example` file
- Safe to commit to version control

**Use cases:**
- Document required environment variables
- Onboard new team members
- CI/CD setup documentation
- Share variable structure without secrets

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

✔ **Zero-knowledge encryption** — PushEnv (and our cloud) never sees your secrets in plaintext  
✔ **Client-side encryption** — Secrets encrypted on your machine before upload  
✔ **Passphrase-based** — Your passphrase never leaves your machine, never stored anywhere  
✔ **AES-256-GCM** — Industry-standard authenticated encryption  
✔ **PBKDF2 key derivation** — Secure key generation from passphrase  
✔ **Encrypted blobs in cloud** — PushEnv's cloud stores only encrypted data (we can't decrypt it!)  
✔ **Local decryption only** — Secrets decrypted on your machine when you pull  
✔ **Per-device keyring** — Derived keys stored in `~/.pushenv/keys.json` (never commit!)  

**Zero-trust model:** Even if PushEnv's cloud is compromised, your secrets remain encrypted. Only your passphrase can decrypt them.

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
| `pushenv add-stage` | Add a new stage/environment to existing project (no reinit needed) |
| `pushenv push` | Encrypt & upload `.env` (default: `development` stage, creates a new version) |
| `pushenv push -s <stage>`<br/>`pushenv push --stage <stage>` | Encrypt & upload specific stage (creates a new version) |
| `pushenv push -m "<message>"` | Push with a custom version message |
| `pushenv pull` | Download & decrypt `.env` (default: `development` stage) |
| `pushenv pull -s <stage>`<br/>`pushenv pull --stage <stage>` | Download & decrypt specific stage |
| `pushenv run <command>` | Run command with secrets in memory (default: `development` stage) |
| `pushenv run -s <stage> <command>`<br/>`pushenv run --stage <stage> <command>` | Run with specific stage secrets |
| `pushenv run --dry-run <command>` | Preview what would be injected without running |
| `pushenv run -v <command>`<br/>`pushenv run --verbose <command>` | Show variable names being injected |
| `pushenv list-stages`<br/>`pushenv ls` | List all configured stages and their status |
| `pushenv diff` | Compare local `.env` with latest remote (default: `development` stage) |
| `pushenv diff -s <stage>`<br/>`pushenv diff --stage <stage>` | Compare specific stage (latest) |
| `pushenv diff --stage <stage> --version <N>` | Compare local `.env` with a specific historical version |
| `pushenv history` | Show version history for the default stage |
| `pushenv history -s <stage>`<br/>`pushenv history --stage <stage>` | Show version history for a specific stage |
| `pushenv rollback --stage <stage> --version <N>` | Create a new version that restores a previous one (safe rollback) |
| `pushenv example` | Generate example `.env` file with placeholders (default: `development` stage) |
| `pushenv example -s <stage>`<br/>`pushenv example --stage <stage>` | Generate example for specific stage |
| `pushenv example -o <path>`<br/>`pushenv example --output <path>` | Specify output file path |
| `pushenv generate-types`<br/>`pushenv types` | Generate TypeScript type definitions from `.env` file |
| `pushenv generate-types --env-path <path>` | Generate types from specific `.env` file |
| `pushenv generate-types --output <path>` | Specify output `.d.ts` file path |


---

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