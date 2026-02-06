# Custom Domain Setup Guide

## Overview
This guide explains what users need to do after purchasing a domain, and what configurations you need to set up on your platform side to support custom domains.

---

## Part 1: What Users Need to Do (DNS Configuration)

### Step 1: Purchase a Domain
Users buy a domain from a registrar (e.g., Namecheap, GoDaddy, Google Domains, etc.)

### Step 2: Configure DNS Records

Users need to add DNS records pointing their domain to your platform. There are two main approaches:

#### Option A: CNAME Record (Recommended)
**Best for**: Most users, easier to manage

**What users do:**
1. Log into their domain registrar's DNS management panel
2. Add a CNAME record:
   - **Type**: CNAME
   - **Name/Host**: `www` (or `@` for root domain, depending on registrar)
   - **Value/Target**: `shopu.ge` (or your main domain)
   - **TTL**: 3600 (or default)

**Example DNS Configuration:**
```
Type    Name    Value           TTL
CNAME   www     shopu.ge        3600
```

**Note**: Some registrars use different terminology:
- **Namecheap**: Host = `www`, Value = `shopu.ge`
- **GoDaddy**: Name = `www`, Points to = `shopu.ge`
- **Cloudflare**: Name = `www`, Target = `shopu.ge`

#### Option B: A Record (If you provide an IP address)
**Best for**: Root domain support (without www)

**What users do:**
1. Add an A record:
   - **Type**: A
   - **Name/Host**: `@` (root domain)
   - **Value**: Your server's IP address (e.g., `123.45.67.89`)
   - **TTL**: 3600

**Example DNS Configuration:**
```
Type    Name    Value           TTL
A       @       123.45.67.89    3600
CNAME   www     shopu.ge        3600
```

### Step 3: Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours to propagate
- Usually takes 15-60 minutes
- Users can check propagation at: https://www.whatsmydns.net

### Step 4: Add Custom Domain in Your Platform
1. User logs into their dashboard
2. Goes to Settings → Custom Domain
3. Enters their domain (e.g., `www.mystore.com` or `mystore.com`)
4. Clicks "Save" or "Verify Domain"

### Step 5: Domain Verification (Optional but Recommended)
Your platform should verify the domain before activating it. Options:

**Method 1: DNS TXT Record Verification**
- Platform generates a unique verification code
- User adds TXT record: `_shopu-verify.mystore.com` → `abc123verificationcode`
- Platform checks DNS and verifies ownership

**Method 2: CNAME Verification**
- Platform asks user to add: `_shopu-verify.mystore.com` → `verify.shopu.ge`
- Platform checks if this CNAME exists

---

## Part 2: What You Need to Configure (Platform Side)

### 1. Reverse Proxy / Load Balancer Configuration

You need a reverse proxy (nginx, Traefik, or Cloudflare) that:
- Accepts requests for custom domains
- Routes them to your application
- Handles SSL certificates

#### Option A: Nginx Configuration

**File**: `/etc/nginx/sites-available/shopu` or nginx config

```nginx
# Main server block for shopu.ge and subdomains
server {
    listen 80;
    listen [::]:80;
    server_name shopu.ge *.shopu.ge;

    location / {
        proxy_pass http://localhost:3000;  # Frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;  # Backend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Catch-all for custom domains
server {
    listen 80;
    listen [::]:80;
    server_name _;  # Matches any domain

    location / {
        proxy_pass http://localhost:3000;  # Frontend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # Important!
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;  # Backend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # Important!
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Key Points**:
- `X-Original-Host` header is crucial - your backend uses this to identify the domain
- Catch-all server block handles custom domains
- Backend reads `req.get('x-original-host') || req.get('host')` to get the domain

#### Option B: Traefik Configuration (Docker)

If using Docker with Traefik:

```yaml
# docker-compose.yml
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./letsencrypt:/letsencrypt
    labels:
      - "traefik.enable=true"

  frontend:
    # ... your frontend config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=HostRegexp(`{host:.+}`)"
      - "traefik.http.routers.frontend.entrypoints=web,websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"
```

#### Option C: Cloudflare (Easiest)

If using Cloudflare:
1. Point DNS to Cloudflare
2. Enable "Proxy" (orange cloud)
3. Cloudflare handles SSL automatically
4. Configure Cloudflare Workers or Page Rules to route to your backend

**Cloudflare Page Rule Example:**
- URL Pattern: `*mystore.com/*`
- Settings:
  - Forwarding URL: `https://shopu.ge/$1` (Status 301)
  - OR use Workers to route dynamically

---

### 2. SSL Certificate Provisioning

You need SSL certificates for each custom domain. Options:

#### Option A: Let's Encrypt (Free, Automatic)

**Using Certbot:**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate for a custom domain
sudo certbot --nginx -d mystore.com -d www.mystore.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

**Using acme.sh (More flexible):**
```bash
# Install acme.sh
curl https://get.acme.sh | sh

# Issue certificate
~/.acme.sh/acme.sh --issue -d mystore.com -d www.mystore.com --nginx

# Install certificate
~/.acme.sh/acme.sh --install-cert -d mystore.com \
  --key-file /etc/nginx/ssl/mystore.com/key.pem \
  --fullchain-file /etc/nginx/ssl/mystore.com/cert.pem \
  --reloadcmd "systemctl reload nginx"
```

**Automated Certificate Management:**
- Use a service like **Cert Manager** (Kubernetes) or **Traefik** (auto-provisions)
- Or build a script that:
  1. Detects new custom domain added
  2. Runs certbot for that domain
  3. Updates nginx config
  4. Reloads nginx

#### Option B: Wildcard Certificate (If using subdomains)

If all custom domains are subdomains of one domain:
```bash
# Get wildcard certificate
sudo certbot certonly --dns-cloudflare \
  -d *.yourplatform.com \
  -d yourplatform.com
```

#### Option C: Cloudflare SSL (Easiest)

- Cloudflare provides free SSL certificates
- Automatic provisioning
- Works with "Full" or "Full (strict)" SSL mode

---

### 3. Backend Configuration Updates

#### Update CORS to Allow Custom Domains

**File**: `backend/server.js`

```javascript
app.use(cors({
  origin: async function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Allow localhost
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow your main domains
    if (origin.includes('shopu.ge') || origin.includes('momigvare.ge')) {
      return callback(null, true);
    }
    
    // For custom domains, verify they're registered in database
    try {
      const host = new URL(origin).hostname;
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: host },
            { customDomain: `www.${host}` },
            { customDomain: host.replace('www.', '') }
          ]
        }
      });
      
      if (tenant) {
        return callback(null, true);
      }
    } catch (error) {
      console.error('CORS verification error:', error);
    }
    
    // Reject if not verified
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
```

**Performance Note**: Consider caching verified domains to avoid database queries on every request.

#### Update Tenant Resolver

**File**: `backend/src/middleware/tenantResolver.js`

```javascript
const tenantResolver = async (req, res, next) => {
  try {
    let host = req.get('x-original-host') || req.get('host');
    if (!host) {
      return res.status(400).json({ error: 'Host header is required' });
    }

    host = host.split(':')[0].toLowerCase();

    // Step 1: Check if host matches a custom domain
    const tenantByCustomDomain = await prisma.tenant.findFirst({
      where: {
        OR: [
          { customDomain: host },
          { customDomain: `www.${host}` },
          { customDomain: host.replace('www.', '') }
        ]
      },
      include: {
        owner: { select: { id: true, email: true, role: true } },
        subscription: true
      }
    });

    if (tenantByCustomDomain) {
      req.tenant = tenantByCustomDomain;
      req.tenantId = tenantByCustomDomain.id;
      // Continue with existing logic...
      return next();
    }

    // Step 2: Fall back to subdomain extraction (existing logic)
    // ... existing subdomain logic ...
  } catch (error) {
    // ... error handling ...
  }
};
```

---

### 4. Domain Verification Service (Recommended)

Create a service to verify domain ownership before activating:

**File**: `backend/src/services/DomainVerificationService.js`

```javascript
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

export class DomainVerificationService {
  /**
   * Generate verification code for domain
   */
  generateVerificationCode() {
    return `shopu-verify-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Verify domain ownership via TXT record
   */
  async verifyDomainTxtRecord(domain, expectedCode) {
    try {
      const txtRecords = await resolveTxt(`_shopu-verify.${domain}`);
      const records = txtRecords.flat();
      return records.includes(expectedCode);
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify domain ownership via CNAME record
   */
  async verifyDomainCname(domain) {
    try {
      const cnameRecords = await resolveCname(`_shopu-verify.${domain}`);
      return cnameRecords.some(record => 
        record.includes('verify.shopu.ge')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if domain points to our server (CNAME or A record)
   */
  async verifyDomainPointsToUs(domain) {
    try {
      const addresses = await resolve4(domain);
      // Check if IP matches your server IP
      // Or check CNAME points to shopu.ge
      return true; // Implement your logic
    } catch (error) {
      return false;
    }
  }
}
```

---

### 5. SSL Certificate Automation Script

Create a script to automatically provision SSL certificates when a custom domain is added:

**File**: `scripts/provision-ssl.sh`

```bash
#!/bin/bash
DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./provision-ssl.sh <domain>"
  exit 1
fi

# Issue certificate
certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos

# Update nginx config (you'll need to generate this)
# Reload nginx
systemctl reload nginx

echo "SSL certificate provisioned for $DOMAIN"
```

**Trigger from Backend:**
```javascript
// When custom domain is added
const { exec } = require('child_process');
exec(`./scripts/provision-ssl.sh ${customDomain}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`SSL provisioning error: ${error}`);
  }
});
```

---

### 6. Environment Variables

Add to your `.env`:

```env
# Custom Domain Configuration
ENABLE_CUSTOM_DOMAINS=true
MAIN_DOMAIN=shopu.ge
SSL_EMAIL=your@email.com  # For Let's Encrypt
CERTBOT_PATH=/usr/bin/certbot
NGINX_CONFIG_PATH=/etc/nginx/sites-available/shopu
```

---

## Part 3: Infrastructure Setup Checklist

### Server/Infrastructure Requirements:

- [ ] **Reverse Proxy**: Nginx, Traefik, or Cloudflare configured
- [ ] **SSL Certificate Provider**: Let's Encrypt, Cloudflare, or commercial CA
- [ ] **DNS Management**: Ability to verify DNS records
- [ ] **Firewall**: Ports 80 (HTTP) and 443 (HTTPS) open
- [ ] **Domain Verification**: Service to verify domain ownership
- [ ] **SSL Automation**: Script/service to provision certificates automatically
- [ ] **Monitoring**: Monitor SSL certificate expiration
- [ ] **Backup**: Backup SSL certificates and nginx configs

### Recommended Architecture:

```
Internet
  ↓
[Cloudflare / Load Balancer] (SSL termination, DDoS protection)
  ↓
[Nginx Reverse Proxy] (Routes to frontend/backend)
  ↓
[Your Application]
  ├── Frontend (Port 3000)
  └── Backend (Port 3001)
```

---

## Part 4: User-Facing Instructions

Create a help page or email template for users:

### Email Template: "How to Connect Your Custom Domain"

```
Subject: How to Connect Your Custom Domain to Shopu

Hi [User Name],

Thank you for choosing Shopu! Here's how to connect your custom domain:

STEP 1: Configure DNS
1. Log into your domain registrar (Namecheap, GoDaddy, etc.)
2. Go to DNS Management / DNS Settings
3. Add a CNAME record:
   - Type: CNAME
   - Name: www
   - Value: shopu.ge
   - TTL: 3600

STEP 2: Add Domain in Shopu
1. Log into your Shopu dashboard
2. Go to Settings → Custom Domain
3. Enter your domain: www.yourstore.com
4. Click "Verify Domain"

STEP 3: Wait for DNS Propagation
- DNS changes can take 5-60 minutes
- Check status: https://www.whatsmydns.net

STEP 4: SSL Certificate (Automatic)
- We'll automatically provision an SSL certificate
- This may take 5-10 minutes after DNS propagates
- Your site will be available at https://www.yourstore.com

Need Help?
- DNS Setup Guide: [link]
- Contact Support: support@shopu.ge

Best regards,
Shopu Team
```

---

## Part 5: Testing Checklist

Before going live, test:

- [ ] User can add custom domain in settings
- [ ] Domain verification works (TXT/CNAME check)
- [ ] DNS propagation detection works
- [ ] SSL certificate is automatically provisioned
- [ ] Custom domain routes to correct tenant
- [ ] HTTPS works on custom domain
- [ ] www and non-www versions work
- [ ] CORS allows custom domain requests
- [ ] Admin dashboard accessible via custom domain
- [ ] Storefront accessible via custom domain
- [ ] API calls work from custom domain
- [ ] SSL certificate auto-renewal works

---

## Summary

### Users Need To:
1. ✅ Buy a domain
2. ✅ Add CNAME record: `www` → `shopu.ge`
3. ✅ Add domain in your platform settings
4. ✅ Wait for DNS propagation

### You Need To:
1. ✅ Configure reverse proxy (nginx/Traefik) to accept custom domains
2. ✅ Set up SSL certificate provisioning (Let's Encrypt)
3. ✅ Update backend CORS to allow custom domains
4. ✅ Update tenant resolver to check custom domains
5. ✅ Implement domain verification (optional but recommended)
6. ✅ Automate SSL certificate provisioning
7. ✅ Monitor SSL certificate expiration

---

## Quick Start Commands

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Test certificate generation
sudo certbot certonly --nginx -d test.yourdomain.com --dry-run

# Check nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Additional Resources

- **Let's Encrypt Docs**: https://letsencrypt.org/docs/
- **Nginx Reverse Proxy**: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- **DNS Propagation Checker**: https://www.whatsmydns.net
- **Certbot Documentation**: https://certbot.eff.org/
