# Deployment Guide

This guide covers different deployment options for Copy-ME.

## 🚀 Quick Deploy

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/selvin-paul-raj/copy_me)

1. Click the deploy button above
2. Connect your GitHub account
3. Set environment variables (see below)
4. Deploy!

---

## 🔧 Environment Setup

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Getting Supabase Credentials

1. **Create a Supabase Project**
   - Visit [Supabase](https://supabase.com/)
   - Click "Start your project"
   - Create a new organization (if needed)
   - Create a new project

2. **Get API Credentials**
   - Go to Settings → API
   - Copy the Project URL
   - Copy the `anon` `public` key

3. **Set up the Database**
   ```sql
   -- Create the rooms table
   CREATE TABLE rooms (
     id TEXT PRIMARY KEY,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     expires_at TIMESTAMPTZ NOT NULL,
     notebooks JSONB NOT NULL DEFAULT '[]'::jsonb,
     users JSONB NOT NULL DEFAULT '[]'::jsonb
   );

   -- Enable Row Level Security
   ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

   -- Create policy for public access
   CREATE POLICY "Allow all operations on rooms" ON rooms
   FOR ALL USING (true) WITH CHECK (true);

   -- Create index for performance
   CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);
   CREATE INDEX idx_rooms_last_active ON rooms(last_active);
   ```

---

## 🌐 Platform-Specific Deployments

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy with environment variables
vercel --prod
```

### Netlify

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add your Supabase credentials

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add

# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=your-url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Deploy
railway up
```

### DigitalOcean App Platform

1. **Create App**
   - Go to [DigitalOcean](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure Build**
   ```
   Build Command: npm run build
   Run Command: npm start
   ```

3. **Environment Variables**
   - Add your Supabase credentials in the app settings

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  copy-me:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: unless-stopped
```

### Build and Run

```bash
# Build the image
docker build -t copy-me .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  copy-me

# Or use docker-compose
docker-compose up -d
```

---

## ☁️ Cloud Provider Specific

### AWS (Amplify)

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub repository

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### Google Cloud Platform

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Deploy to Cloud Run
gcloud run deploy copy-me \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=your-url \
  --set-env-vars NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Azure

```bash
# Install Azure CLI
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Create resource group
az group create --name copy-me-rg --location eastus

# Create App Service plan
az appservice plan create --name copy-me-plan --resource-group copy-me-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group copy-me-rg --plan copy-me-plan --name copy-me-app --runtime "NODE|18-lts"

# Set environment variables
az webapp config appsettings set --resource-group copy-me-rg --name copy-me-app --settings NEXT_PUBLIC_SUPABASE_URL=your-url NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Deploy
az webapp deployment source config --resource-group copy-me-rg --name copy-me-app --repo-url https://github.com/your-username/copy_me --branch main
```

---

## 🔧 Custom Server Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build the application
npm run build

# Create ecosystem file
echo 'module.exports = {
  apps: [{
    name: "copy-me",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: "your-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-key"
    }
  }]
}' > ecosystem.config.js

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Use HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Backup strategy for database
- [ ] Environment variable security

### Supabase Security

```sql
-- Create more restrictive RLS policies
CREATE POLICY "Users can only access active rooms" ON rooms
FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can only update recent rooms" ON rooms
FOR UPDATE USING (last_active > now() - interval '1 hour');
```

---

## 📊 Monitoring

### Health Check Endpoint

Add to your deployment:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  });
}
```

### Monitoring Services

- **Vercel Analytics**: Built-in for Vercel deployments
- **Google Analytics**: Add tracking code
- **Sentry**: Error monitoring and performance
- **Uptime Robot**: Uptime monitoring

---

## 🔄 Continuous Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run type-check
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📞 Support

For deployment help:
- **GitHub Issues**: [Deployment issues](https://github.com/selvin-paul-raj/copy_me/issues)
- **Documentation**: Check the README.md
- **Email**: selvinpaulraj@gmail.com
