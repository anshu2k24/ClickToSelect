# Docker RAG Knowledge Base — Complete Technical Reference
## AI Interviewer Context Document | Three-Level Seniority Model

---

# SECTION 1: FUNDAMENTALS — CORE CONCEPTS

## 1.1 What Docker Is

```
Docker is a platform for building, shipping, and running applications in containers.

KEY COMPONENTS:
- Docker Engine        — runtime daemon (dockerd) + CLI (docker)
- Docker Image         — read-only template of filesystem layers + metadata
- Docker Container     — running instance of an image (image + writable layer + runtime state)
- Docker Registry      — storage and distribution for images (Docker Hub, ECR, GCR, etc.)
- Dockerfile           — build instructions to produce an image
- Docker Compose       — tool to define and run multi-container applications
- Docker Buildx        — extended builder (multi-platform, BuildKit features)

DOCKER VS VM:
- VMs: full OS kernel per instance, hypervisor, minutes to start, GBs
- Containers: share host kernel, isolated via namespaces/cgroups, seconds to start, MBs
- Containers are NOT VMs — they share the host Linux kernel
- On macOS/Windows, Docker runs a Linux VM (HyperKit / WSL2) and containers run inside it

KERNEL FEATURES DOCKER USES:
- Namespaces    — isolation: pid, net, mnt, uts, ipc, user
- cgroups       — resource limits: CPU, memory, I/O, PIDs
- Union filesystem (OverlayFS on modern Linux) — layered image filesystem
- seccomp       — syscall filtering for security
- capabilities  — fine-grained Linux privilege control
```

---

## 1.2 Image Layers

```dockerfile
# Every instruction in a Dockerfile creates a new layer
FROM ubuntu:22.04          # Layer 1: base OS layer (pulled from registry)
RUN apt-get update         # Layer 2: new filesystem diff
RUN apt-get install -y python3  # Layer 3: new filesystem diff
COPY app.py /app/          # Layer 4: copied files
CMD ["python3", "/app/app.py"]  # Metadata only — no new layer

# Layers are content-addressable (SHA256 hash)
# Layers are CACHED — if instruction and context unchanged, cache is reused
# Layers are SHARED — same layer used by multiple images (deduplication)
# Container adds a WRITABLE layer on top — deleted on container removal

# View image layers:
docker image history nginx:latest
docker inspect nginx:latest | jq '.[0].RootFS.Layers'

# OverlayFS: lowerdir (image layers, read-only) + upperdir (container write layer)
# Changes in container: copy-on-write — modified files copied to upperdir
```

---

## 1.3 Container Lifecycle

```bash
# Full container lifecycle:
docker pull nginx:latest          # pull image from registry
docker create nginx:latest        # create container (not started)
docker start <container_id>       # start stopped container
docker run nginx:latest           # pull + create + start in one command

docker pause <container_id>       # SIGSTOP — freeze all processes
docker unpause <container_id>     # resume
docker stop <container_id>        # SIGTERM → wait 10s → SIGKILL
docker kill <container_id>        # SIGKILL immediately
docker rm <container_id>          # remove stopped container
docker rm -f <container_id>       # force remove (kills if running)

# Container states:
# created → running → paused → running → stopped(exited) → removed

# docker stop vs docker kill:
# stop: graceful — app can handle SIGTERM, clean up, flush buffers
# kill: immediate — SIGKILL cannot be caught, no cleanup
# Grace period: docker stop --time=30 (default 10 seconds)

# Run options
docker run -d nginx                     # detached (background)
docker run -it ubuntu bash              # interactive + pseudo-TTY
docker run --rm alpine echo "hello"     # auto-remove on exit
docker run --name web nginx             # named container
docker run -p 8080:80 nginx             # host_port:container_port
docker run -v /host/path:/container/path nginx  # bind mount
docker run -e ENV_VAR=value nginx       # environment variable
docker run --network mynet nginx        # attach to network
docker run --memory 512m nginx          # memory limit
docker run --cpus 1.5 nginx             # CPU limit (1.5 cores)
```

---

# SECTION 2: DOCKERFILE — WRITING AND OPTIMIZING

## 2.1 Dockerfile Instructions

```dockerfile
# ─── FROM ──────────────────────────────────────────────────────────────────
FROM node:20-alpine              # base image — always specify tag, never :latest in prod
FROM scratch                     # empty base — for fully static binaries (Go, Rust)
FROM ubuntu:22.04 AS builder     # named build stage (multi-stage build)

# ─── RUN ───────────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*   # clean apt cache IN SAME LAYER — critical!

# Wrong (creates extra layer with cache still in image):
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# ─── COPY vs ADD ───────────────────────────────────────────────────────────
COPY src/ /app/src/              # preferred — explicit, predictable
ADD archive.tar.gz /app/         # auto-extracts tar — use ONLY for this feature
ADD https://example.com/file /   # downloads URL — avoid, use curl in RUN instead

# COPY --chown: set ownership without extra RUN chown layer
COPY --chown=node:node . /app/

# ─── WORKDIR ───────────────────────────────────────────────────────────────
WORKDIR /app                     # sets CWD, creates dir if not exists
# Prefer WORKDIR over RUN cd — cleaner and persistent across instructions

# ─── ENV ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000 HOST=0.0.0.0      # multiple in one instruction
# ENV vars persist into running container and child images

# ─── ARG ───────────────────────────────────────────────────────────────────
ARG NODE_VERSION=20              # build-time only — NOT in final image
ARG TARGETPLATFORM               # auto-set by buildx for multi-platform
FROM node:${NODE_VERSION}-alpine

# ARG vs ENV:
# ARG: available only during build, not in running container
# ENV: available during build AND in running container
# Secret ARGs still appear in docker history — never use ARG for secrets

# ─── EXPOSE ────────────────────────────────────────────────────────────────
EXPOSE 3000                      # documentation only — does NOT publish port
EXPOSE 3000/udp
# Actual port publishing happens at runtime: docker run -p 3000:3000

# ─── CMD vs ENTRYPOINT ─────────────────────────────────────────────────────
CMD ["node", "server.js"]               # default command, easily overridden
ENTRYPOINT ["node"]                     # fixed executable
CMD ["server.js"]                       # default arg to ENTRYPOINT, overridable

# Exec form (JSON array) vs Shell form:
CMD ["node", "server.js"]   # exec form — direct exec, PID 1, receives signals ✓
CMD node server.js          # shell form — runs via /bin/sh -c, shell is PID 1 ✗

# Shell form problem: node process doesn't receive SIGTERM — docker stop doesn't work gracefully
# Always use exec form for CMD/ENTRYPOINT

ENTRYPOINT ["docker-entrypoint.sh"]     # wrapper script pattern
CMD ["postgres"]                        # default arg to entrypoint

# ─── USER ──────────────────────────────────────────────────────────────────
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser                     # run as non-root — security best practice
# Never run containers as root in production

# ─── VOLUME ────────────────────────────────────────────────────────────────
VOLUME ["/data"]                 # declares mount point — creates anonymous volume
# Better: don't declare VOLUME in Dockerfile, manage at runtime

# ─── HEALTHCHECK ───────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
# Container states: starting → healthy / unhealthy

# ─── LABEL ─────────────────────────────────────────────────────────────────
LABEL maintainer="team@example.com"
LABEL org.opencontainers.image.version="1.2.3"
LABEL org.opencontainers.image.source="https://github.com/org/repo"

# ─── ONBUILD ───────────────────────────────────────────────────────────────
ONBUILD COPY . /app/             # triggers when used as base image in child build
# Used for base images that want to automate child behavior
```

---

## 2.2 Multi-Stage Builds

```dockerfile
# ─── Go example — produces minimal final image ──────────────────────────
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download                    # cache dependency download separately
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM scratch                           # empty base
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
ENTRYPOINT ["/server"]
# Result: ~10MB image vs ~300MB if built in one stage

# ─── Node.js example ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ─── Target a specific stage ─────────────────────────────────────────────
docker build --target builder -t myapp:dev .   # build only up to 'builder' stage
docker build --target runner -t myapp:prod .   # build full prod image
```

---

## 2.3 Build Cache and Optimization

```dockerfile
# ─── Cache invalidation rules ───────────────────────────────────────────
# Cache MISS triggers if:
# - Instruction text changed
# - For COPY/ADD: any file in the source changed (checksum comparison)
# - Any previous instruction had a cache miss (cache bust cascades downward)

# ─── Optimization: copy dependencies first ──────────────────────────────
# WRONG — any file change invalidates npm install:
COPY . /app/
RUN npm install

# CORRECT — only package.json change triggers npm install:
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app/               # code changes don't affect npm install layer

# ─── .dockerignore ──────────────────────────────────────────────────────
# .dockerignore prevents files from being sent to build context
# Reduces context size and prevents cache invalidation from irrelevant changes

# .dockerignore example:
# node_modules
# .git
# .env
# *.log
# dist
# coverage
# .DS_Store
# README.md

# ─── BuildKit cache mounts ──────────────────────────────────────────────
# syntax=docker/dockerfile:1
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline       # npm cache persists across builds

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y curl

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install                   # secret file — NOT in image layers

# ─── Build args for cache busting ───────────────────────────────────────
ARG CACHEBUST=1
RUN git clone https://github.com/org/repo.git  # force re-run with --build-arg CACHEBUST=$(date)
```

---

# SECTION 3: NETWORKING

## 3.1 Network Drivers

```bash
# Docker network types:
# bridge  — default, isolated network per host, containers communicate by name (in same network)
# host    — container shares host network stack, no isolation, best performance
# none    — no networking, isolated
# overlay — multi-host networking (Swarm / Kubernetes)
# macvlan — container gets its own MAC/IP on the LAN — for legacy apps

# ─── Bridge network ─────────────────────────────────────────────────────
docker network create mynet                      # create custom bridge
docker run --network mynet --name db postgres    # container on custom network
docker run --network mynet --name app myapp      # can reach 'db' by hostname

# Default bridge (docker0) vs custom bridge:
# Default bridge: containers reach each other by IP only (no DNS)
# Custom bridge: containers reach each other by CONTAINER NAME (DNS built-in) ✓
# Always use custom bridges in production

# ─── Network commands ───────────────────────────────────────────────────
docker network ls                                # list networks
docker network inspect mynet                     # full details (subnet, containers, etc.)
docker network connect mynet container1          # attach running container to network
docker network disconnect mynet container1
docker network rm mynet

# ─── Port publishing ────────────────────────────────────────────────────
docker run -p 8080:80 nginx              # host 8080 → container 80 (all interfaces)
docker run -p 127.0.0.1:8080:80 nginx   # bind to localhost only (secure)
docker run -p 80 nginx                   # random host port → container 80
docker run -P nginx                      # publish ALL EXPOSE'd ports to random host ports

# ─── Host network ───────────────────────────────────────────────────────
docker run --network host nginx          # no NAT, uses host port 80 directly
# Linux only — fastest network performance
# Breaks container-to-container isolation

# ─── Container-to-container communication ───────────────────────────────
# Same custom network: use container name as hostname
# Different networks: use docker network connect
# Host-to-container: use host.docker.internal (Docker Desktop, 20.10+)

# ─── DNS in Docker ──────────────────────────────────────────────────────
# Docker has embedded DNS server at 127.0.0.11
# Containers in same custom network resolve each other by:
#   - container name
#   - network alias (--network-alias)
#   - service name (in Compose)
```

---

## 3.2 Compose Networking

```yaml
# docker-compose.yml — networks example
version: "3.9"
services:
  web:
    image: nginx
    networks:
      - frontend
      - backend
    ports:
      - "80:80"

  api:
    image: myapi
    networks:
      - backend
    # web can reach api as "api" — DNS resolution within backend network

  db:
    image: postgres
    networks:
      - backend
    # web CANNOT reach db — not on frontend network (isolation)

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true    # no external internet access from backend network
```

---

# SECTION 4: VOLUMES AND STORAGE

## 4.1 Storage Types

```bash
# Three types of storage in Docker:

# 1. Bind mounts — map host directory into container
docker run -v /host/data:/container/data myimage
docker run --mount type=bind,source=/host/data,target=/container/data myimage
# Pros: easy to use, works with host tools
# Cons: host path must exist, path-dependent, permissions issues

# 2. Named volumes — managed by Docker, stored in Docker's data directory
docker volume create mydata
docker run -v mydata:/app/data myimage
docker run --mount type=volume,source=mydata,target=/app/data myimage
# Pros: portable, managed, better performance on Docker Desktop (vs bind mounts)
# Cons: less direct access from host

# 3. tmpfs mounts — in-memory, not persisted
docker run --mount type=tmpfs,target=/tmp myimage
docker run --tmpfs /tmp myimage
# Use for: sensitive data, cache, fast temporary storage

# ─── Volume commands ────────────────────────────────────────────────────
docker volume ls
docker volume inspect mydata
docker volume rm mydata
docker volume prune              # remove all unused volumes (DANGEROUS)
docker volume prune --filter "label=removable"

# ─── Backup a volume ────────────────────────────────────────────────────
docker run --rm \
  -v mydata:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mydata-backup.tar.gz -C /source .

# ─── Restore a volume ───────────────────────────────────────────────────
docker run --rm \
  -v mydata:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mydata-backup.tar.gz -C /target

# ─── Volume drivers ─────────────────────────────────────────────────────
# local    — default, host filesystem
# NFS      — docker volume create --driver local --opt type=nfs ...
# vieux/sshfs — SSH remote filesystem
# Cloud: aws EFS, GCS, Azure File — via plugins
```

---

## 4.2 Data Persistence Patterns

```yaml
# docker-compose.yml — volume patterns
version: "3.9"
services:
  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data    # named volume — persists across restarts
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # bind mount read-only

  app:
    image: myapp
    volumes:
      - ./src:/app/src                     # bind mount for dev hot reload
      - /app/node_modules                  # anonymous volume — PREVENTS host override

volumes:
  pgdata:                                  # declares named volume (created if not exists)

# Anonymous volume trick:
# If you mount ./app:/app but don't want host node_modules to override container:
# Add: - /app/node_modules
# Docker creates anonymous volume for that path, host bind mount doesn't override it
```

---

# SECTION 5: DOCKER COMPOSE

## 5.1 Compose File Reference

```yaml
# docker-compose.yml — full reference
version: "3.9"   # Compose file version (3.9 is current for v3)
                 # As of Compose V2, 'version' key is optional/deprecated

services:

  web:
    # Image options
    image: nginx:1.25-alpine          # use pre-built image
    # OR build from Dockerfile:
    build:
      context: ./web                  # build context directory
      dockerfile: Dockerfile.prod     # default: Dockerfile
      args:
        NODE_ENV: production
      cache_from:
        - myimage:latest              # use as cache source
      target: runner                  # multi-stage target

    # Container config
    container_name: web               # explicit name (prevents auto-naming)
    restart: unless-stopped           # always / on-failure / unless-stopped / no
    command: ["nginx", "-g", "daemon off;"]  # override CMD
    entrypoint: ["/entrypoint.sh"]   # override ENTRYPOINT
    working_dir: /app
    user: "1000:1000"

    # Networking
    ports:
      - "80:80"
      - "443:443"
    networks:
      - frontend
    extra_hosts:
      - "host.docker.internal:host-gateway"

    # Environment
    environment:
      NODE_ENV: production
      DB_HOST: db
    env_file:
      - .env
      - .env.production

    # Storage
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - staticfiles:/var/www/static

    # Dependencies
    depends_on:
      db:
        condition: service_healthy    # wait for health check
      redis:
        condition: service_started    # just wait for start (default)

    # Resources
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
        reservations:
          memory: 128M
      replicas: 3                     # Swarm mode

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # Other log drivers: syslog, journald, awslogs, gelf, fluentd

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password  # Docker secrets
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myuser -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  frontend:
  backend:
    internal: true

volumes:
  pgdata:
  staticfiles:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

---

## 5.2 Compose Commands

```bash
# Core workflow
docker compose up                     # create and start all services
docker compose up -d                  # detached
docker compose up --build             # force rebuild images
docker compose up --no-deps web       # start only web (no dependencies)
docker compose down                   # stop and remove containers
docker compose down -v                # also remove volumes (DESTROYS DATA)
docker compose down --rmi all         # also remove images

# Service management
docker compose start / stop / restart web
docker compose pause / unpause web
docker compose kill web               # SIGKILL

# Inspection
docker compose ps                     # list services + status
docker compose logs web               # logs for service
docker compose logs -f web            # follow logs
docker compose logs --tail=50 web
docker compose top                    # running processes
docker compose port web 80            # show bound host port

# Exec and run
docker compose exec web bash                  # exec in running container
docker compose exec -it web sh               # interactive shell
docker compose run --rm web node migrate.js  # run one-off command (new container)
docker compose run --no-deps --rm web bash   # without starting dependencies

# Build
docker compose build                  # build all services
docker compose build web              # build specific service
docker compose build --no-cache web
docker compose pull                   # pull updated images

# Config
docker compose config                 # validate and print merged config
docker compose config --services      # list service names

# Scale (without Swarm)
docker compose up -d --scale web=3   # run 3 replicas of web (requires no container_name)

# Multiple compose files (override pattern)
docker compose -f docker-compose.yml -f docker-compose.override.yml up
# docker-compose.override.yml is automatically merged if present
```

---

## 5.3 Compose Profiles and Override Patterns

```yaml
# docker-compose.yml — base config
services:
  app:
    image: myapp
  db:
    image: postgres

# docker-compose.override.yml — auto-merged in development
services:
  app:
    volumes:
      - .:/app            # hot reload in dev
    environment:
      DEBUG: "true"
  db:
    ports:
      - "5432:5432"       # expose DB port in dev (not in prod)

# docker-compose.prod.yml
services:
  app:
    deploy:
      replicas: 3
    restart: always

# Usage:
# Dev:  docker compose up  (auto-merges override.yml)
# Prod: docker compose -f docker-compose.yml -f docker-compose.prod.yml up

# ─── Profiles ───────────────────────────────────────────────────────────
services:
  app:
    image: myapp
  db:
    image: postgres
  debug-tools:
    image: busybox
    profiles: ["debug"]         # only started when profile is active
  load-test:
    image: k6
    profiles: ["testing"]

# docker compose --profile debug up   # starts app + db + debug-tools
# docker compose up                   # starts only app + db
```

---

# SECTION 6: SECURITY

## 6.1 Container Security Fundamentals

```bash
# ─── Run as non-root ────────────────────────────────────────────────────
# Dockerfile:
RUN useradd -u 1001 -r -g 0 -s /sbin/nologin appuser
USER 1001

# docker run:
docker run --user 1001:1001 myimage
docker run --user nobody myimage

# Check running user:
docker exec mycontainer whoami
docker inspect mycontainer | jq '.[0].Config.User'

# ─── Read-only filesystem ───────────────────────────────────────────────
docker run --read-only myimage                   # root filesystem read-only
docker run --read-only --tmpfs /tmp myimage      # allow writes to /tmp only

# ─── Drop capabilities ──────────────────────────────────────────────────
# Linux capabilities: fine-grained privileges (vs all-or-nothing root)
# Default Docker capabilities: CHOWN, SETUID, SETGID, NET_BIND_SERVICE, etc.
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx   # minimal privileges
docker run --cap-drop ALL myimage                            # no capabilities

# ─── Security options ───────────────────────────────────────────────────
docker run --security-opt no-new-privileges myimage  # prevent privilege escalation
docker run --security-opt seccomp=profile.json myimage  # custom seccomp profile
docker run --security-opt apparmor=docker-default myimage

# ─── Seccomp ────────────────────────────────────────────────────────────
# Default Docker seccomp profile blocks ~40 syscalls (ptrace, mount, etc.)
# Use --security-opt seccomp=unconfined only for debugging — NEVER in prod

# ─── Privileged mode ────────────────────────────────────────────────────
docker run --privileged myimage   # ALL capabilities, ALL devices, disable seccomp
# Only use for: running Docker-in-Docker, device access, kernel module loading
# NEVER in production for untrusted workloads

# ─── Resource limits ────────────────────────────────────────────────────
docker run --memory 512m myimage          # memory limit (OOM kill if exceeded)
docker run --memory 512m --memory-swap 512m myimage  # disable swap (swap = total - memory)
docker run --cpus 1.5 myimage             # max 1.5 CPU cores
docker run --cpu-shares 512 myimage       # relative weight (default 1024)
docker run --pids-limit 200 myimage       # max processes (prevent fork bombs)

# ─── Secrets management ─────────────────────────────────────────────────
# NEVER use ENV vars for secrets in production — visible in docker inspect, ps, logs
# Better options:
# 1. Docker secrets (Swarm)
# 2. Mount secret files at runtime: -v /path/to/secret:/run/secrets/mysecret:ro
# 3. BuildKit secrets: --mount=type=secret (never in image layer)
# 4. External: HashiCorp Vault, AWS Secrets Manager, env injection at startup
```

---

## 6.2 Image Security

```bash
# ─── Image scanning ─────────────────────────────────────────────────────
docker scout cves nginx:latest         # Docker Scout (built-in, 2023+)
docker scan nginx:latest               # legacy Snyk integration
trivy image nginx:latest               # Aqua Trivy (popular open source)
grype nginx:latest                     # Anchore Grype

# ─── Minimal base images ────────────────────────────────────────────────
# Preference order (smallest attack surface):
# scratch > distroless > alpine > slim > full

# distroless (Google):
FROM gcr.io/distroless/nodejs20-debian12   # no shell, no package manager
# Good for: Java, Python, Node.js apps in production

# alpine (musl libc, not glibc):
FROM node:20-alpine                         # ~5MB vs ~100MB for debian
# Warning: musl vs glibc differences can cause issues with native modules

# debian slim:
FROM node:20-slim                           # reduced debian, glibc, ~50MB

# ─── Content trust ──────────────────────────────────────────────────────
export DOCKER_CONTENT_TRUST=1          # require signed images
docker trust sign myimage:latest       # sign an image
docker trust inspect myimage:latest    # view signatures

# ─── Digest pinning ─────────────────────────────────────────────────────
# Tags are MUTABLE — nginx:1.25 can be updated
# Digests are IMMUTABLE — pin to exact image content
FROM nginx@sha256:a484819eb60211f5299034ac80f6a681b06f89e65866ce91f356ed7c72af059c
# Use in production for reproducibility and security

# ─── Check for root in running containers ───────────────────────────────
docker inspect -f '{{.Config.User}}' mycontainer   # empty = root!
# Find all containers running as root:
docker ps -q | xargs -I{} docker inspect {} --format '{{.Name}} {{.Config.User}}'
```

---

# SECTION 7: PERFORMANCE AND OPTIMIZATION

## 7.1 Image Size Optimization

```dockerfile
# ─── Technique 1: Multi-stage builds (most impactful) ──────────────────
# See Section 2.2

# ─── Technique 2: Merge RUN commands, clean caches ─────────────────────
# WRONG (3 layers, cache files still in layer 2):
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# CORRECT (1 layer, clean):
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─── Technique 3: Use --no-install-recommends ───────────────────────────
RUN apt-get install -y --no-install-recommends curl   # skip recommended packages

# ─── Technique 4: Minimize installed tools ──────────────────────────────
# For debugging, install tools in a dev stage only
# Don't install build tools in final image (use multi-stage)

# ─── Technique 5: Use .dockerignore aggressively ───────────────────────
# Include everything that doesn't need to be in the build context

# ─── Measure image size ─────────────────────────────────────────────────
docker image ls myimage                           # total size
docker image history myimage                      # per-layer sizes
dive myimage                                      # interactive layer explorer (tool)

# ─── Compress layers with squash (experimental) ─────────────────────────
docker build --squash -t myimage .                # merge all layers into one
# Reduces total size but loses layer caching benefits

# ─── Example size comparisons (Node.js app ~100KB code):
# node:20              → ~1.1GB
# node:20-slim         → ~230MB
# node:20-alpine       → ~170MB
# Multi-stage → alpine → ~80MB
# Distroless           → ~120MB
```

---

## 7.2 Runtime Performance

```bash
# ─── CPU ────────────────────────────────────────────────────────────────
docker run --cpus 2 myimage              # hard limit: 2 CPUs max
docker run --cpu-shares 2048 myimage     # soft limit: 2x default priority
docker run --cpuset-cpus "0,1" myimage   # pin to specific CPU cores

# ─── Memory ─────────────────────────────────────────────────────────────
docker run --memory 1g myimage           # hard limit: 1GB RAM
docker run --memory 1g --memory-swap 1g myimage   # disable swap (swap = total, not extra)
docker run --memory-reservation 512m myimage      # soft limit: prefer this much

# Memory stats:
docker stats mycontainer                 # live CPU/memory/net/IO stats
docker stats --no-stream                 # snapshot

# ─── Network performance ────────────────────────────────────────────────
# host > bridge > overlay (for latency/throughput)
# For high-performance networking: --network host on Linux
# MTU: docker network create --opt com.docker.network.driver.mtu=9000 mynet

# ─── Storage performance ────────────────────────────────────────────────
# Avoid writing to container layer — use volumes
# OverlayFS has overhead for small random writes
# For databases: named volumes > bind mounts > container filesystem
# tmpfs: fastest, but in-memory (no persistence)
--mount type=tmpfs,target=/tmp,tmpfs-size=256m,tmpfs-mode=1777

# ─── I/O limits ─────────────────────────────────────────────────────────
docker run --device-write-bps /dev/sda:1mb myimage   # write speed limit
docker run --device-read-iops /dev/sda:1000 myimage  # IOPS limit

# ─── Logging performance ────────────────────────────────────────────────
# json-file (default): simple, but not for high-throughput
# Use log limits to prevent disk fill:
docker run --log-opt max-size=10m --log-opt max-file=3 myimage
# For production: use journald, syslog, or a dedicated log driver
```

---

# SECTION 8: REGISTRY AND IMAGE MANAGEMENT

## 8.1 Working with Registries

```bash
# ─── Authentication ─────────────────────────────────────────────────────
docker login                             # Docker Hub
docker login registry.example.com       # private registry
docker login -u AWS -p $(aws ecr get-login-password) 123456789.dkr.ecr.us-east-1.amazonaws.com
docker logout registry.example.com

# Credentials stored in: ~/.docker/config.json
# For CI/CD: use credential helpers (docker-credential-ecr-login, etc.) — not plain text

# ─── Tagging conventions ────────────────────────────────────────────────
# Format: [registry/][namespace/]image[:tag]
nginx                                   # Docker Hub official
nginx:1.25                              # specific version
nginx:1.25-alpine
myuser/myimage:latest                   # Docker Hub user
registry.example.com/team/myimage:v1.2.3
123456789.dkr.ecr.us-east-1.amazonaws.com/myimage:latest  # AWS ECR

# Semantic versioning tags (best practice for production):
docker tag myimage:build-${GIT_SHA} myimage:1.2.3
docker tag myimage:1.2.3 myimage:1.2
docker tag myimage:1.2 myimage:1
docker tag myimage:1 myimage:latest
# Push all tags — users can pin at any level of specificity

# ─── Push / Pull ────────────────────────────────────────────────────────
docker push myuser/myimage:1.2.3
docker pull myuser/myimage:1.2.3
docker pull --platform linux/arm64 myimage:latest  # force specific platform

# ─── Image operations ───────────────────────────────────────────────────
docker image ls                         # list local images
docker image ls --filter dangling=true  # untagged layers
docker image inspect nginx:latest       # full metadata (JSON)
docker image rm nginx:latest            # remove (fails if container exists)
docker image prune                      # remove dangling images
docker image prune -a                   # remove ALL unused images (careful!)

# Save/load (for air-gapped environments):
docker save myimage:latest | gzip > myimage.tar.gz    # export to file
docker load < myimage.tar.gz                           # import from file
docker save myimage:latest | ssh user@host docker load  # pipe over SSH

# Export/import (container filesystem, no layer history):
docker export mycontainer > container.tar
docker import container.tar myimage:imported
```

---

## 8.2 Multi-Platform Builds

```bash
# ─── Setup buildx ───────────────────────────────────────────────────────
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap          # verify QEMU/binfmt support
docker buildx ls                           # list builders

# ─── Build for multiple platforms ───────────────────────────────────────
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  --tag myimage:latest \
  --push \              # must push (can't load multi-platform to local daemon)
  .

# ─── In Dockerfile — handle platforms ───────────────────────────────────
# syntax=docker/dockerfile:1
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"

# Platform-specific binaries with TARGETARCH:
ARG TARGETARCH
RUN curl -L "https://example.com/binary-${TARGETARCH}" -o /usr/local/bin/tool

# ─── Inspect a multi-platform image ─────────────────────────────────────
docker buildx imagetools inspect myimage:latest   # show all platform variants
docker manifest inspect myimage:latest            # raw manifest list
```

---

# SECTION 9: DEBUGGING AND TROUBLESHOOTING

## 9.1 Container Debugging

```bash
# ─── Logs ───────────────────────────────────────────────────────────────
docker logs mycontainer                  # all logs (stdout + stderr)
docker logs -f mycontainer               # follow
docker logs --tail 100 mycontainer       # last 100 lines
docker logs --since 1h mycontainer       # logs from last hour
docker logs --since 2024-01-15T10:00:00 mycontainer
docker logs mycontainer 2>&1 | grep ERROR   # filter

# ─── Execute commands ───────────────────────────────────────────────────
docker exec mycontainer ps aux           # running processes
docker exec -it mycontainer bash         # interactive bash
docker exec -it mycontainer sh           # sh (if no bash — alpine)
docker exec -u root mycontainer sh       # exec as root even if USER set
docker exec mycontainer env              # list environment variables
docker exec mycontainer cat /etc/hosts

# If container has no shell (distroless, scratch):
# Option 1: Add busybox in a debug stage
# Option 2: docker debug (Docker Desktop Enterprise)
# Option 3: nsenter — enter container namespaces from host
# Option 4: kubectl debug (copy container with tools added)

# ─── Inspect ────────────────────────────────────────────────────────────
docker inspect mycontainer               # full JSON — network, mounts, config
docker inspect -f '{{.State.ExitCode}}' mycontainer
docker inspect -f '{{.NetworkSettings.IPAddress}}' mycontainer
docker inspect -f '{{json .Mounts}}' mycontainer | jq

# ─── Stats and performance ──────────────────────────────────────────────
docker stats                             # live stats for all containers
docker stats mycontainer                 # single container
docker stats --no-stream                 # single snapshot
docker top mycontainer                   # processes inside container

# ─── Events ─────────────────────────────────────────────────────────────
docker events                            # real-time event stream
docker events --since 10m                # last 10 minutes
docker events --filter type=container --filter event=die   # container deaths

# ─── Common issues ──────────────────────────────────────────────────────
# Container exits immediately:
docker logs mycontainer                  # check output
docker inspect -f '{{.State}}' mycontainer  # exit code + error
# Exit code 1: app error
# Exit code 137: OOM kill (memory limit exceeded)
# Exit code 139: segfault
# Exit code 143: SIGTERM (graceful stop)

# Container OOM killed:
docker inspect mycontainer | jq '.[0].State.OOMKilled'  # true if OOM

# Permission denied errors:
docker exec mycontainer id               # check running user/uid
ls -la /host/path                        # check host file permissions

# DNS not resolving:
docker exec mycontainer cat /etc/resolv.conf
docker exec mycontainer nslookup google.com
# Check: same custom network? custom DNS server?
```

---

## 9.2 Build Debugging

```bash
# ─── Build output ───────────────────────────────────────────────────────
docker build --progress=plain .          # verbose step-by-step output
docker build --no-cache .                # bypass all cache
docker build --no-cache --target builder .  # build only to specific stage

# ─── Inspect build cache ────────────────────────────────────────────────
docker buildx du                         # disk usage by build cache
docker buildx prune                      # remove build cache
docker system df                         # overall Docker disk usage

# ─── Debug failing RUN steps ────────────────────────────────────────────
# Build fails on RUN step — debug by running previous stage:
docker build --target <stage_before_failing> -t debug-build .
docker run -it debug-build sh
# Now manually run the failing command

# ─── BuildKit debug ─────────────────────────────────────────────────────
BUILDKIT_PROGRESS=plain docker build .   # verbose (env var alternative)
# SSH forwarding in build:
docker buildx build --ssh default=$SSH_AUTH_SOCK .
# RUN --mount=type=ssh git clone git@github.com:private/repo.git
```

---

# SECTION 10: DOCKER IN CI/CD

## 10.1 CI/CD Patterns

```bash
# ─── GitHub Actions example ─────────────────────────────────────────────
# .github/workflows/docker.yml:
#
# jobs:
#   build:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: docker/setup-buildx-action@v3       # enable BuildKit + buildx
#       - uses: docker/login-action@v3
#         with:
#           registry: ghcr.io
#           username: ${{ github.actor }}
#           password: ${{ secrets.GITHUB_TOKEN }}
#       - uses: docker/build-push-action@v5
#         with:
#           context: .
#           platforms: linux/amd64,linux/arm64
#           push: ${{ github.ref == 'refs/heads/main' }}
#           tags: ghcr.io/org/myimage:latest
#           cache-from: type=gha          # GitHub Actions cache
#           cache-to: type=gha,mode=max

# ─── Layer cache strategies in CI ───────────────────────────────────────
# 1. Registry cache:
docker build \
  --cache-from myimage:latest \
  --tag myimage:${GIT_SHA} \
  --tag myimage:latest \
  . && docker push myimage:${GIT_SHA} && docker push myimage:latest

# 2. BuildKit inline cache:
docker buildx build \
  --cache-from type=registry,ref=myimage:buildcache \
  --cache-to type=registry,ref=myimage:buildcache,mode=max \
  -t myimage:latest --push .

# 3. Local cache mount (BuildKit):
docker buildx build \
  --cache-from type=local,src=/tmp/buildcache \
  --cache-to type=local,dest=/tmp/buildcache,mode=max .

# ─── Docker-in-Docker (DinD) ────────────────────────────────────────────
# Option 1: DinD (privileged) — isolated Docker daemon inside container
docker run --privileged docker:dind        # not recommended (privileged)

# Option 2: Docker socket mount — share host Docker daemon
docker run -v /var/run/docker.sock:/var/run/docker.sock docker:cli
# Security risk: socket gives root-equivalent access to host
# Use rootless Docker or Kaniko/Buildah for better security

# Option 3: Kaniko — builds without Docker daemon
# Good for Kubernetes CI (no privileged required)
docker run -v $(pwd):/workspace \
  gcr.io/kaniko-project/executor:latest \
  --context=dir:///workspace \
  --dockerfile=Dockerfile \
  --destination=myimage:latest

# ─── Tagging strategy in CI ─────────────────────────────────────────────
GIT_SHA=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD | sed 's/\//-/g')

docker tag myimage:latest myimage:${GIT_SHA}         # immutable, traceable
docker tag myimage:latest myimage:${BRANCH}          # branch-latest
# In release: docker tag myimage:latest myimage:1.2.3
```

---

# SECTION 11: DOCKER SWARM AND ORCHESTRATION CONTEXT

## 11.1 Docker Swarm Fundamentals

```bash
# ─── Swarm init ─────────────────────────────────────────────────────────
docker swarm init --advertise-addr 192.168.1.10     # init manager node
docker swarm join-token worker                       # get worker join token
docker swarm join --token SWMTKN-... 192.168.1.10:2377  # join as worker
docker swarm join --token SWMTKN-... 192.168.1.10:2377  # join as manager (different token)
docker node ls                                       # list nodes
docker node inspect mynode
docker node update --availability drain mynode      # move containers off node
docker swarm leave --force                          # leave (or dissolve) swarm

# ─── Services (Swarm equivalent of containers) ───────────────────────────
docker service create --name web --replicas 3 -p 80:80 nginx
docker service ls
docker service ps web                               # tasks (container instances) + placement
docker service inspect web
docker service update --replicas 5 web             # scale
docker service update --image nginx:1.25 web       # rolling update
docker service rollback web                         # undo last update
docker service rm web

# ─── Stack deploy (Compose for Swarm) ───────────────────────────────────
docker stack deploy -c docker-compose.yml mystack
docker stack ls
docker stack ps mystack                             # all tasks in stack
docker stack services mystack                       # services in stack
docker stack rm mystack

# ─── Swarm vs Kubernetes ─────────────────────────────────────────────────
# Swarm:
#   + Built into Docker, zero extra install
#   + Simpler, lower learning curve
#   + Compose files are reusable
#   - Less ecosystem, less features
#   - No auto-scaling, limited scheduling
#   - Smaller community, Docker deprioritizing it

# Kubernetes:
#   + Industry standard, massive ecosystem
#   + Auto-scaling, advanced scheduling, RBAC
#   + Rich observability integrations
#   - Complex setup and operations
#   - Steeper learning curve

# Recommendation: Swarm for small teams/simple needs; K8s for production scale
```

---

# SECTION 12: ROOTLESS DOCKER AND ADVANCED SECURITY

## 12.1 Rootless Mode

```bash
# ─── Rootless Docker ────────────────────────────────────────────────────
# Runs Docker daemon as non-root user — no root access even if container escapes
# Required: kernel >= 5.11 (or older with user namespaces enabled)

# Install (as regular user, not root):
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
systemctl --user start docker

# Limitations:
# - Some features unavailable (overlay network, certain drivers)
# - Slower than rootful (user namespace mapping overhead)
# - Port < 1024 not directly bindable without net.ipv4.ip_unprivileged_port_start

# ─── User namespace remapping ───────────────────────────────────────────
# Map container root (uid 0) to unprivileged host user
# /etc/docker/daemon.json:
# { "userns-remap": "default" }
# Container root → host uid 165536 (unprivileged)
# Provides isolation even in rootful Docker

# ─── AppArmor and SELinux ───────────────────────────────────────────────
# AppArmor (Ubuntu/Debian):
docker run --security-opt apparmor=docker-default myimage   # default profile
docker run --security-opt apparmor=unconfined myimage        # disable (unsafe)

# SELinux (RHEL/Fedora/CentOS):
docker run --security-opt label=type:container_t myimage
# Bind mounts on SELinux: add :z (shared) or :Z (private) label
docker run -v /host/data:/app/data:z myimage   # relabels for container use

# ─── Seccomp deep dive ──────────────────────────────────────────────────
# Default profile blocks: keyctl, ptrace, mount, pivot_root, etc.
# View default profile: docker run --rm alpine cat /proc/1/status
# Custom profile — allow only needed syscalls:
# { "defaultAction": "SCMP_ACT_ERRNO", "syscalls": [{"names": ["read","write","exit"], "action": "SCMP_ACT_ALLOW"}] }
docker run --security-opt seccomp=custom-profile.json myimage
```

---

# SECTION 13: SYSTEM MANAGEMENT AND HOUSEKEEPING

## 13.1 Cleanup and Disk Management

```bash
# ─── System overview ────────────────────────────────────────────────────
docker system df                              # disk usage: images, containers, volumes, cache
docker system df -v                           # verbose with individual items

# ─── Prune commands (from least to most destructive) ────────────────────
docker container prune                        # remove stopped containers
docker image prune                            # remove dangling images (untagged)
docker image prune -a                         # remove ALL unused images
docker volume prune                           # remove unused volumes (DATA LOSS!)
docker network prune                          # remove unused networks
docker buildx prune                           # remove build cache
docker system prune                           # containers + networks + dangling images
docker system prune -a                        # + all unused images
docker system prune -a --volumes              # + volumes (MAXIMUM CLEANUP — DATA LOSS!)

# ─── Targeted cleanup ───────────────────────────────────────────────────
# Remove all exited containers:
docker rm $(docker ps -aq -f status=exited)

# Remove containers older than 24h:
docker container prune --filter "until=24h"

# Remove images with specific label:
docker image prune --filter "label=temp=true"

# Remove dangling images:
docker image prune --filter "dangling=true"

# ─── Daemon configuration (/etc/docker/daemon.json) ─────────────────────
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "data-root": "/var/lib/docker",
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "registry-mirrors": ["https://mirror.example.com"],
  "insecure-registries": [],
  "live-restore": true,               # keep containers running on daemon restart
  "userns-remap": "default"
}

# Apply config: sudo systemctl restart docker

# ─── Container garbage collection strategy ──────────────────────────────
# Use --rm for one-off containers
# docker run --rm alpine echo hello

# Set restart policies carefully:
# no          — never restart
# always      — always restart (even after docker restart)
# unless-stopped — restart unless manually stopped
# on-failure[:N] — restart only on non-zero exit, optionally max N times
```

---

# SECTION 14: DOCKER ARCHITECTURE INTERNALS

## 14.1 How Docker Works

```
CLIENT → REST API → DOCKER DAEMON (dockerd) → containerd → runc

Docker CLI (client):
  - Sends API calls to dockerd via Unix socket (/var/run/docker.sock) or TCP
  - Remote API: tcp://host:2376 (TLS), tcp://host:2375 (insecure — never expose!)

Docker Daemon (dockerd):
  - Manages images, containers, networks, volumes
  - Delegates actual container lifecycle to containerd

containerd:
  - Industry-standard container runtime (CNCF project)
  - Manages container lifecycle, image pull/push, snapshotter
  - Replaced direct runC calls from Docker 1.11+

runc:
  - Low-level OCI runtime — creates/runs containers using kernel features
  - Calls clone() with namespace flags, creates cgroups, sets capabilities
  - Alternative runtimes: gVisor (runsc), Kata Containers (VM-based)

OCI (Open Container Initiative):
  - OCI Image Spec — standard image format (layers + config JSON)
  - OCI Runtime Spec — how containers should be started
  - All Docker images are OCI-compliant → work with Podman, containerd, etc.

IMAGE PULL FLOW:
1. docker pull nginx:latest
2. dockerd queries registry for manifest
3. Manifest contains list of layer digests
4. dockerd downloads missing layers (parallel)
5. Layers extracted to OverlayFS snapshots
6. Image ready — pointer from tag to manifest digest stored

CONTAINER START FLOW:
1. docker run nginx
2. dockerd creates container config (JSON)
3. Passed to containerd
4. containerd prepares OverlayFS mount (lowerdir=image layers, upperdir=new dir)
5. containerd calls runc
6. runc creates Linux namespaces (clone syscall with flags)
7. runc sets up cgroups, capabilities, seccomp
8. runc exec's PID 1 (the CMD/ENTRYPOINT)
9. Container is running
```

---

## 14.2 OverlayFS Internals

```bash
# OverlayFS structure for a running container:
# /var/lib/docker/overlay2/
#   <layer-sha>/
#     diff/       ← filesystem contents for this layer
#     link        ← short symlink identifier
#     lower       ← list of lower layer IDs
#     merged/     ← union mount (only for running container)
#     work/       ← OverlayFS internal

# Container's OverlayFS mount:
# lowerdir = all image layers (read-only, bottom to top)
# upperdir = container write layer (writable)
# workdir  = OverlayFS internal
# merged   = union view shown to container processes

# Copy-on-write:
# First write to a read-only file → file copied to upperdir → modifications there
# Reads check upperdir first, then fall through to lowerdir layers
# Deletion: whiteout file created in upperdir (hides lower file)

# Check current storage driver:
docker info | grep "Storage Driver"
docker system info --format '{{.Driver}}'

# overlay2 requirements:
# - Linux kernel >= 4.0 (or RHEL/CentOS 3.10.0-514+)
# - XFS filesystem with ftype=1, or ext4
# - Kernel support: cat /proc/filesystems | grep overlay
```

---

# SECTION 15: COMMON PATTERNS AND RECIPES

## 15.1 Production Patterns

```dockerfile
# ─── Pattern 1: Entrypoint wrapper script ───────────────────────────────
# docker-entrypoint.sh:
#!/bin/sh
set -e
# Run migrations on startup
if [ "$1" = "server" ]; then
  node migrate.js
fi
exec "$@"   # hand off to CMD — preserves PID 1 and signal handling

# Dockerfile:
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["server"]

# ─── Pattern 2: init process for zombie reaping ─────────────────────────
docker run --init myimage            # uses tini as PID 1
# Or in Dockerfile:
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
# Necessary when: app spawns child processes that might become zombies

# ─── Pattern 3: Wait for dependency ─────────────────────────────────────
# Use Compose depends_on with healthcheck (Section 5.1)
# Or: wait-for-it.sh / dockerize tool
COPY wait-for-it.sh /usr/local/bin/
CMD ["wait-for-it.sh", "db:5432", "--", "node", "server.js"]

# ─── Pattern 4: Config via environment ──────────────────────────────────
# 12-factor app: config in environment, not baked into image
ENV NODE_ENV=production
# Never bake environment-specific config into image
# Use -e, --env-file, or secrets at runtime

# ─── Pattern 5: Graceful shutdown ───────────────────────────────────────
# Node.js example: trap SIGTERM
# process.on('SIGTERM', async () => {
#   await server.close();
#   await db.disconnect();
#   process.exit(0);
# });
# Requires: exec form CMD, --stop-timeout > server shutdown time
```

---

## 15.2 Quick Reference Commands

```bash
# ─── Most used daily commands ───────────────────────────────────────────
docker ps                                 # running containers
docker ps -a                              # all containers (including stopped)
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

docker images                             # local images
docker images --filter "dangling=false"

docker run -d -p 8080:80 --name web nginx
docker stop web && docker rm web
docker run --rm -it alpine sh            # one-time interactive container

docker exec -it web bash
docker logs -f web
docker inspect web
docker stats

docker build -t myimage:v1 .
docker build -t myimage:v1 --no-cache .
docker push myuser/myimage:v1

# ─── System cleanup ─────────────────────────────────────────────────────
docker system prune -af                  # nuclear option: remove everything unused

# ─── Useful one-liners ──────────────────────────────────────────────────
# Stop all containers:
docker stop $(docker ps -q)

# Remove all stopped containers:
docker rm $(docker ps -aq -f status=exited)

# Remove all images with tag <none>:
docker rmi $(docker images -f "dangling=true" -q)

# Follow logs of last started container:
docker logs -f $(docker ps -lq)

# Inspect ENV vars in running container:
docker exec mycontainer env | sort

# Get container IP:
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' mycontainer

# Run busybox in same network as container (for debugging):
docker run --rm -it --network container:mycontainer busybox sh

# Copy files to/from container:
docker cp mycontainer:/app/logs/app.log ./app.log
docker cp ./config.json mycontainer:/app/config.json

# Diff container filesystem from image:
docker diff mycontainer     # A=added, C=changed, D=deleted

# Commit container state to new image (for debugging, not production):
docker commit mycontainer myimage:debug

# ─── Docker Compose one-liners ──────────────────────────────────────────
docker compose up -d && docker compose logs -f   # start and tail logs
docker compose exec db psql -U postgres           # exec into DB service
docker compose run --rm app sh                    # one-off shell
docker compose down && docker compose up -d --build  # full restart with rebuild
```

---

# SECTION 16: VERSION HISTORY AND ECOSYSTEM

## 16.1 Docker Version Timeline

```
Docker 1.0  (2014): First stable release, LXC backend
Docker 1.6  (2015): Labels, logging drivers
Docker 1.9  (2015): Networks (multi-host), volumes subcommand
Docker 1.10 (2016): User namespaces, seccomp
Docker 1.12 (2016): Swarm mode built-in, health checks, --init
Docker 1.13 (2017): docker system prune, stack deploy, --mount flag
Docker 17.06 (2017): Multi-stage builds, secret support in builds
Docker 18.09 (2018): BuildKit enabled as opt-in (DOCKER_BUILDKIT=1)
Docker 19.03 (2019): Rootless Docker, GPU support, BuildKit default for some ops
Docker 20.10 (2020): cgroups v2 support, Compose v2 plugin, live restore improvements
Docker 23.0  (2023): BuildKit always on, compose integrated, image manifest improvements
Docker 24.0  (2023): containerd image store (opt-in)
Docker 25.0  (2024): containerd image store default improvements
Docker 26.0  (2024): Performance improvements, Docker Debug command

KEY ECOSYSTEM PROJECTS:
- containerd (2017, CNCF): container runtime extracted from Docker
- Kubernetes (2014, CNCF): orchestration (replaced Swarm at scale)
- BuildKit (2018): next-gen builder — parallel, cache mounts, secrets
- Buildx (2019): CLI plugin wrapping BuildKit (multi-platform, bake)
- Compose V2 (2021): rewrite in Go, docker compose (not docker-compose)
- Docker Scout (2023): vulnerability scanning built-in
- Docker Init (2023): docker init — scaffolds Dockerfile + compose for common stacks

ALTERNATIVES TO DOCKER:
- Podman: daemonless, rootless-first, drop-in Docker replacement (Red Hat)
- Buildah: OCI image builder without daemon
- Skopeo: image copy/inspection without daemon
- nerdctl: containerd CLI (docker-compatible syntax)
- Kaniko: build images in Kubernetes (no daemon needed)
- Podman Compose: docker-compose compatible

OCI COMPATIBILITY:
Docker images = OCI images → run on any OCI runtime
docker run = can be replaced with: podman run / nerdctl run / ctr run
```

---

# SECTION 17: TALENT SIGNALS BY SENIORITY

## Seniority Model

```
JUNIOR SIGNALS:
+ Knows basic Dockerfile instructions (FROM, RUN, COPY, CMD)
+ Can docker run, docker build, docker push
+ Understands the difference between image and container
+ Uses Docker Compose for local development
+ Understands port mapping (-p flag)
- Writes single-stage Dockerfiles without size concern
- Uses :latest tag everywhere
- Runs containers as root without thinking about it
- Mounts full source directory in prod instead of copying
- Doesn't know .dockerignore exists
- Confuses ENTRYPOINT and CMD
- Uses ADD for local files instead of COPY

MID-LEVEL SIGNALS:
+ Writes multi-stage builds to optimize image size
+ Understands layer caching and orders instructions accordingly
+ Uses .dockerignore effectively
+ Understands exec form vs shell form and why it matters
+ Can configure Docker networks (custom bridge, service discovery)
+ Knows ENTRYPOINT + CMD separation pattern
+ Uses named volumes vs bind mounts appropriately
+ Understands docker stop (SIGTERM) vs docker kill (SIGKILL)
+ Configures health checks
+ Uses non-root USER in Dockerfile
+ Understands BuildKit and can enable it
- Doesn't think about secrets management (still uses ENV for passwords)
- Doesn't consider CPU/memory limits
- Can't explain OverlayFS at a high level
- Doesn't know about log driver options

SENIOR SIGNALS:
+ Designs full CI/CD pipeline with caching strategy (registry cache, GHA cache)
+ Implements BuildKit secret mounts for sensitive build-time data
+ Builds multi-platform images with buildx
+ Configures resource limits and understands cgroups implications
+ Implements Docker security hardening: non-root, read-only, cap-drop, seccomp
+ Understands and uses Compose profiles and override files
+ Can debug OOM kills, zombie processes, signal propagation issues
+ Designs volume strategy: what to persist, backup approach
+ Knows when NOT to use Docker (K8s, serverless, native dev)
+ Can diagnose networking issues (DNS, MTU, routing)
+ Understands OverlayFS and copy-on-write semantics
+ Uses init process (tini) when needed
+ Implements graceful shutdown correctly

STAFF/PRINCIPAL SIGNALS:
+ Designs container security strategy: rootless, user namespace remapping, seccomp profiles
+ Can reason about container escape vectors and mitigations
+ Evaluates Docker vs Podman vs Containerd for specific org requirements
+ Designs image lifecycle management: scanning, signing, SBOM generation
+ Can reason about Docker daemon architecture and failure modes
+ Understands containerd/runc interface and can reason about OCI spec
+ Has designed distributed build systems with BuildKit + caching layers
+ Can reason about cgroup v1 vs v2 differences and implications
+ Knows tradeoffs of Docker Swarm vs K8s for given team/scale
+ Designs observability strategy for containerized workloads
+ Can evaluate and implement supply chain security (SLSA, Sigstore/Cosign)
+ Understands overlay network internals for multi-host Swarm/K8s deployments
```

---

*End of Docker RAG Knowledge Base Document*
*Total sections: 17 | Coverage: Junior through Staff | Includes: Core concepts, Dockerfile, multi-stage builds, networking, volumes, Compose, security, performance, registry, debugging, CI/CD, Swarm, internals (OverlayFS, containerd/runc), system management, production patterns, version history, talent signals*
