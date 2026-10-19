# 🚀 Feasy AWS EC2 Deployment Guide

This guide walks you through deploying **Feasy** directly on an AWS EC2 instance using Docker & Docker Compose.

---

## 1. Launch & Configure Your AWS EC2 Instance
1. **AMI**: Ubuntu Server 22.04 LTS or 24.04 LTS (x86_64).
2. **Instance Type**: `t3.small` or `t3.medium` recommended (min 1GB RAM; `t3.small` with 2GB recommended for seamless multi-tenant operations).
3. **Security Group Inbound Rules**:
   - `SSH` (Port 22) → Your IP
   - `HTTP` (Port 80) → `0.0.0.0/0` (Anywhere)
   - `HTTPS` (Port 443) → `0.0.0.0/0` (Anywhere)
   - *(Optional)* Custom TCP (Port 5000) if testing directly without port 80 mapping.

---

## 2. Connect to EC2 & Install Docker
SSH into your instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

Update packages and install Docker + Docker Compose:
```bash
# Update package list
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker & Docker Compose plugin
sudo apt-get install -y docker.io docker-compose-v2

# Add ubuntu user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker ubuntu
newgrp docker
```

Verify installation:
```bash
docker --version
docker compose version
```

---

## 3. Option A: Pull & Run Directly from Docker Hub (Zero Code on EC2)
You don't even need to clone the entire repo or build anything on EC2. You only need the `docker-compose.prod.yml` and `.env` file!

1. Create a project directory on your EC2 instance:
   ```bash
   mkdir feasy && cd feasy
   ```
2. Download the compose file:
   ```bash
   curl -O https://raw.githubusercontent.com/<YOUR_GITHUB_USER>/feasy/main/docker-compose.prod.yml
   mv docker-compose.prod.yml docker-compose.yml
   ```
3. Create your `.env` file with production secrets:
   ```bash
   nano .env
   ```
   *(Paste your MongoDB Atlas URI, JWT Secret, and specify `DOCKER_IMAGE=<your-dockerhub-username>/feasy:latest`)*

4. Pull and run immediately:
   ```bash
   docker compose pull
   docker compose up -d
   ```

---

## 3. Option B: Clone Repo on EC2
```bash
git clone <YOUR_GIT_REPO_URL> feasy
cd feasy
cp .env.prod .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Useful Management Commands:
- **View live server logs:**
  ```bash
  docker compose logs -f
  ```
- **Check container health & status:**
  ```bash
  docker compose ps
  ```
- **Restart the application:**
  ```bash
  docker compose restart
  ```
- **Stop the application:**
  ```bash
  docker compose down
  ```
- **Pull latest changes and re-deploy:**
  ```bash
  git pull origin main
  docker compose up -d --build
  ```

---

## 6. Access Your Application
Open your browser and navigate to:
```
http://<your-ec2-public-ip>
```
Your multi-tenant Feasy SaaS platform will be live, fully functional with automated SPA routing and REST API on port 80.

