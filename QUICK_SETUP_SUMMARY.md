# Quick Setup Summary: Custom Domains

## What Users Do (After Buying Domain)

### Simple 3-Step Process:

1. **Add DNS Record** (in their domain registrar):
   ```
   Type: CNAME
   Name: www
   Value: shopu.ge
   ```

2. **Add Domain in Your Platform**:
   - Go to Settings → Custom Domain
   - Enter: `www.mystore.com`
   - Click Save

3. **Wait 5-60 minutes** for DNS to propagate

That's it! Your platform handles the rest automatically.

---

## What You Need to Configure (Platform Side)

### 1. Reverse Proxy (Nginx) - REQUIRED

**Why**: Your server needs to accept requests for ANY domain (not just shopu.ge)

**Configuration** (`/etc/nginx/sites-available/shopu`):
```nginx
# Catch-all server block for custom domains
server {
    listen 80;
    server_name _;  # Matches ANY domain

    location / {
        proxy_pass http://localhost:3000;  # Your frontend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # CRITICAL!
    }

    location /api {
        proxy_pass http://localhost:3001;  # Your backend
        proxy_set_header Host $host;
        proxy_set_header X-Original-Host $host;  # CRITICAL!
    }
}
```

**Key Point**: The `X-Original-Host` header tells your backend which domain the request came from.

---

### 2. SSL Certificates (Let's Encrypt) - REQUIRED

**Why**: HTTPS is required for custom domains

**Option A: Manual (per domain)**:
```bash
sudo certbot --nginx -d www.mystore.com
```

**Option B: Automated (recommended)**:
- Use Traefik (auto-provisions SSL)
- Or create a script that runs certbot when domain is added
- Or use Cloudflare (handles SSL automatically)

---

### 3. Update Backend Code - REQUIRED

**A. Update CORS** (`backend/server.js`):
```javascript
// Allow custom domains (verify they're in database)
origin: async function (origin, callback) {
  // ... check if domain is registered in database
  callback(null, true);
}
```

**B. Update Tenant Resolver** (`backend/src/middleware/tenantResolver.js`):
```javascript
// First check customDomain field
const tenant = await prisma.tenant.findFirst({
  where: { customDomain: host }
});
// Then fall back to subdomain lookup
```

**C. Add customDomain field** to Tenant model in database

---

### 4. Domain Verification (Optional but Recommended)

**Why**: Prevent domain hijacking

**How**: 
- User adds TXT record: `_shopu-verify.mystore.com` → `verification-code`
- Your backend checks DNS and verifies ownership
- Only then activate the custom domain

---

## Infrastructure Requirements

### Minimum Setup:
- ✅ Reverse proxy (nginx) configured to accept any domain
- ✅ SSL certificate provider (Let's Encrypt)
- ✅ Backend code updated to check customDomain field
- ✅ Database migration to add customDomain column

### Recommended Setup:
- ✅ Automated SSL provisioning (Traefik or script)
- ✅ Domain verification before activation
- ✅ SSL certificate monitoring/auto-renewal
- ✅ DNS propagation checker

---

## Architecture Flow

```
User's Domain (www.mystore.com)
    ↓
DNS: CNAME → shopu.ge
    ↓
Nginx Reverse Proxy (accepts any domain)
    ↓
Backend checks: customDomain field in database
    ↓
Routes to correct tenant's storefront
```

---

## Cost Considerations

- **Free**: Let's Encrypt SSL certificates
- **Free**: Cloudflare SSL (if using Cloudflare)
- **Paid**: Commercial SSL certificates (if needed)
- **Server**: Same server, no additional cost

---

## Time to Implement

- **Backend code changes**: 2-4 hours
- **Nginx configuration**: 30 minutes
- **SSL setup**: 1-2 hours (or automated)
- **Testing**: 2-3 hours
- **Total**: ~1 day of development

---

## Most Important Points

1. **Users only need to add ONE CNAME record** - that's it!
2. **You need nginx configured** to accept any domain
3. **SSL certificates** must be provisioned (automated is best)
4. **Backend must check** `customDomain` field before subdomain
5. **X-Original-Host header** is critical for domain detection

---

## Next Steps

1. Set up nginx reverse proxy (if not already done)
2. Configure Let's Encrypt / SSL automation
3. Implement backend code changes (see CUSTOM_DOMAIN_ANALYSIS.md)
4. Test with a test domain
5. Deploy and enable for users
