# Custom Domain Deployment Instructions

## Step 1: Run Database Migration

After deploying the code, run the database migration to add the `customDomain` field:

```bash
cd backend
npx prisma migrate deploy
# OR for development:
npx prisma migrate dev
```

This will add the `customDomain` column to the `tenants` table.

---

## Step 2: Configure Reverse Proxy (Nginx)

You need to configure nginx to accept requests for ANY domain (not just shopu.ge). This is critical for custom domains to work.

### Update Nginx Configuration

Edit your nginx configuration file (usually `/etc/nginx/sites-available/shopu` or similar):

```nginx
# Main server block for shopu.ge and subdomains
server {
    listen 80;
    listen [::]:80;
    server_name shopu.ge *.shopu.ge momigvare.ge *.momigvare.ge;

    location / {
        proxy_pass http://localhost:3000;  # Your frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Original-Host $host;  # CRITICAL for custom domains!
    }

    location /api {
        proxy_pass http://localhost:3001;  # Your backend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # CRITICAL for custom domains!
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Catch-all server block for custom domains
server {
    listen 80;
    listen [::]:80;
    server_name _;  # Matches ANY domain

    location / {
        proxy_pass http://localhost:3000;  # Your frontend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # CRITICAL!
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;  # Your backend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # CRITICAL!
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Key Points:**
- The catch-all server block (`server_name _`) handles custom domains
- `X-Original-Host` header is CRITICAL - your backend uses this to identify the domain
- Make sure this catch-all block comes AFTER your main domain blocks

### Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 3: Configure SSL Certificates (Let's Encrypt)

You need SSL certificates for each custom domain. Here are your options:

### Option A: Manual SSL Provisioning (Per Domain)

When a user adds a custom domain, manually provision SSL:

```bash
sudo certbot --nginx -d www.mystore.com -d mystore.com
sudo systemctl reload nginx
```

### Option B: Automated SSL (Recommended)

**Using Traefik (if using Docker):**
- Traefik automatically provisions SSL certificates for any domain
- Configure Traefik to watch for new domains

**Using a Script:**
Create a script that runs when a custom domain is added:

```bash
#!/bin/bash
# scripts/provision-ssl.sh
DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./provision-ssl.sh <domain>"
  exit 1
fi

# Issue certificate
certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --email your@email.com

# Reload nginx
systemctl reload nginx

echo "SSL certificate provisioned for $DOMAIN"
```

**Using Cloudflare (Easiest):**
- If using Cloudflare, SSL is handled automatically
- Just ensure DNS points to Cloudflare

---

## Step 4: Verify Backend is Running

Make sure your backend is running and accessible:

```bash
# Check if backend is running
curl http://localhost:3001/healthz

# Check if frontend is running
curl http://localhost:3000
```

---

## Step 5: Test Custom Domain Setup

### Test Steps:

1. **Add Custom Domain in Platform:**
   - Log into your Shopu dashboard
   - Go to Settings → Account
   - Scroll to "Custom Domain" field
   - Enter: `www.yourdomain.com`
   - Click Save

2. **Configure DNS (User Side):**
   - User logs into their domain registrar
   - Adds CNAME record:
     - Type: CNAME
     - Name: `www`
     - Value: `shopu.ge`
     - TTL: 3600

3. **Wait for DNS Propagation:**
   - Usually 5-60 minutes
   - Check: https://www.whatsmydns.net

4. **Provision SSL Certificate:**
   ```bash
   sudo certbot --nginx -d www.yourdomain.com
   sudo systemctl reload nginx
   ```

5. **Test Access:**
   - Visit: `https://www.yourdomain.com/store`
   - Should show the tenant's storefront
   - Visit: `https://www.yourdomain.com/admin/dashboard`
   - Should show the admin dashboard

---

## Step 6: Environment Variables

Make sure these environment variables are set (if needed):

```env
# Backend
DATABASE_URL=your_database_url
FRONTEND_BASE_URL=https://shopu.ge

# SSL (for Let's Encrypt)
SSL_EMAIL=your@email.com
```

---

## Troubleshooting

### Custom Domain Not Working?

1. **Check Nginx Configuration:**
   ```bash
   sudo nginx -t
   sudo nginx -T | grep -A 20 "server_name _"
   ```

2. **Check Backend Logs:**
   ```bash
   # Check if backend receives requests
   tail -f /var/log/your-app/backend.log
   ```

3. **Check DNS:**
   ```bash
   dig www.yourdomain.com
   nslookup www.yourdomain.com
   ```

4. **Check CORS:**
   - Backend should allow custom domains
   - Check browser console for CORS errors

5. **Check SSL Certificate:**
   ```bash
   sudo certbot certificates
   ```

### Common Issues:

**Issue: "Tenant not found" error**
- Solution: Make sure custom domain is added in Settings
- Check database: `SELECT * FROM tenants WHERE "customDomain" = 'www.yourdomain.com';`

**Issue: CORS error**
- Solution: Backend CORS should allow custom domains (already implemented)
- Check if domain is registered in database

**Issue: SSL certificate not working**
- Solution: Run `sudo certbot --nginx -d www.yourdomain.com`
- Check nginx SSL configuration

**Issue: Domain resolves but shows wrong content**
- Solution: Check nginx `X-Original-Host` header is set correctly
- Verify tenant resolver middleware is checking customDomain

---

## Production Checklist

Before going live:

- [ ] Database migration completed
- [ ] Nginx configured with catch-all server block
- [ ] `X-Original-Host` header set in nginx
- [ ] SSL certificate provisioning process set up (manual or automated)
- [ ] Backend CORS allows custom domains
- [ ] Tested with at least one custom domain
- [ ] DNS propagation verified
- [ ] SSL certificate working
- [ ] Storefront accessible via custom domain
- [ ] Admin dashboard accessible via custom domain

---

## After Deployment

Once deployed, users can:

1. **Add Custom Domain:**
   - Settings → Account → Custom Domain
   - Enter domain (e.g., `www.mystore.com`)
   - Save

2. **Configure DNS:**
   - Add CNAME: `www` → `shopu.ge`

3. **Wait for DNS:**
   - 5-60 minutes

4. **SSL Certificate:**
   - You'll need to provision SSL (manual or automated)

5. **Access Store:**
   - `https://www.mystore.com/store` (storefront)
   - `https://www.mystore.com/admin/dashboard` (admin)

---

## Notes

- **DNS Setup**: Users must configure DNS themselves (CNAME record)
- **SSL Certificates**: You need to provision SSL for each custom domain
- **Performance**: Consider caching domain lookups to avoid database queries on every request
- **Monitoring**: Monitor SSL certificate expiration (Let's Encrypt expires every 90 days)
- **Backward Compatibility**: Existing subdomains (e.g., `mystore.shopu.ge`) continue to work

---

## Quick Reference

```bash
# Run migration
cd backend && npx prisma migrate deploy

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Provision SSL for a domain
sudo certbot --nginx -d www.mystore.com

# Check SSL certificates
sudo certbot certificates

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
