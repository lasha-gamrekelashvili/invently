# Easiest Custom Domains: VPS + Caddy in Front of Render

This guide gets you **automatic** custom domains with minimal change: stay on Render, add one small VPS running Caddy as a reverse proxy. No code changes required.

---

## Part 1: Code (No Changes Required)

Your app already supports this:

- **Frontend** sends `X-Original-Host` with every API request (so the backend knows the visitor’s domain).
- **Backend** resolves tenant by `customDomain` and allows CORS for registered custom domains.

You don’t need to change any code. Optional: keep API base URL as `https://momigvare.onrender.com/api` (API calls go straight from the browser to Render backend with `X-Original-Host` set).

---

## Part 2: What You’ll Do (Overview)

1. Rent a small VPS.
2. Install Caddy and add one config file.
3. Point **shopu.ge** (and www / subdomains) to the VPS.
4. Users keep adding their domain in your app and CNAME to **shopu.ge** — no manual steps from you.

---

## Part 3: VPS Setup

### Step 1: Get a VPS

- **Hetzner**: https://www.hetzner.com/cloud (e.g. CX11 ~€4/mo).
- **DigitalOcean**: https://www.digitalocean.com (e.g. Basic Droplet $6/mo).
- **Linode**: https://www.linode.com (e.g. Nanode $5/mo).

- **OS**: Ubuntu 22.04 LTS.
- **Size**: 1 vCPU, 512MB–1GB RAM is enough (Caddy is light).
- Note the **public IP** of the server.

### Step 2: SSH and Update

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
```

### Step 3: Install Caddy

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
systemctl enable caddy
```

### Step 4: Caddyfile (Reverse Proxy to Render)

Create the config:

```bash
nano /etc/caddy/Caddyfile
```

Paste this (replace `momigvare-client.onrender.com` with your **actual Render frontend URL** if different):

```caddyfile
# Catch-all: accept any hostname on 443, get SSL automatically, proxy to Render frontend
:443 {
    tls {
        on_demand
    }
    reverse_proxy https://momigvare-client.onrender.com {
        header_up Host {host}
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-For {remote_host}
    }
}
```

Caddy will automatically get a Let's Encrypt certificate for any hostname that points to this server (e.g. shopu.ge, www.commercia.ge).

Save (Ctrl+O, Enter, Ctrl+X).

Restart Caddy:

```bash
systemctl restart caddy
```

Open firewall:

```bash
ufw allow 80
ufw allow 443
ufw allow 22
ufw --force enable
```

---

## Part 4: DNS (You)

Point your **shopu.ge** traffic to the VPS so Caddy (and later, user custom domains) receive it.

Where **shopu.ge** is managed (e.g. Cloudflare, registrar):

| Type | Name | Value        | TTL  |
|------|------|--------------|------|
| A    | @    | YOUR_VPS_IP  | 3600 |
| A    | www  | YOUR_VPS_IP  | 3600 |
| A    | *   | YOUR_VPS_IP  | 3600 |

If your provider only allows CNAME for `www` / `*`:

- `www` → CNAME → `shopu.ge` (if @ is already A to VPS).
- `*` → A → YOUR_VPS_IP (or CNAME to `shopu.ge` if supported).

Wait 5–15 minutes, then test:

- https://shopu.ge  
- https://www.shopu.ge  
- https://lashu.shopu.ge  

All should hit the VPS and show your Render app.

---

## Part 5: Render (Optional Cleanup)

- Traffic to **shopu.ge** now goes **VPS → Render**, so Render no longer needs to “own” shopu.ge.
- You can remove **shopu.ge**, **www.shopu.ge**, and **\*.shopu.ge** from Render “Custom Domains” to avoid confusion. The app will still work because the VPS forwards with the correct `Host` header.
- Keep the default Render URL (e.g. `momigvare-client.onrender.com`) so the VPS can proxy to it.

---

## Part 6: User Custom Domains (Fully Automatic)

For a store like **commercia.ge**:

1. **User (or you once)** adds custom domain in your app: **Settings → Account → Custom Domain** → `www.commercia.ge`.
2. **User** sets DNS at their registrar:
   - Type: **CNAME**
   - Name: **www**
   - Value: **shopu.ge**
   - TTL: 3600

No steps on Render and no steps on your VPS. Caddy will:

- Receive the first request for `www.commercia.ge`.
- Issue a certificate (Let’s Encrypt) for that hostname.
- Proxy to your Render frontend with `Host: www.commercia.ge`.

Your app (unchanged) will resolve the tenant by `customDomain` and serve the right store.

---

## Part 7: Troubleshooting

- **502 / connection errors**  
  - Check Render frontend URL in Caddyfile.  
  - `systemctl status caddy` and `journalctl -u caddy -f`.

- **SSL not issued for a new domain**  
  - Ensure DNS for that domain points to **YOUR_VPS_IP** (e.g. CNAME www → shopu.ge and shopu.ge A → VPS).  
  - Port 80 must be open (ACME challenge).  
  - Wait 1–2 minutes and retry.

- **CORS errors from custom domain**  
  - Backend already allows origins whose hostname is in `customDomain`.  
  - Ensure the tenant has `customDomain` set (e.g. `www.commercia.ge`) in your app.

---

## Summary

| Item              | Action                                      |
|-------------------|---------------------------------------------|
| Code              | No changes                                  |
| VPS               | One small Ubuntu server + Caddy             |
| Caddyfile         | Catch-all `:443` → proxy to Render frontend |
| Your DNS          | shopu.ge / www / * → VPS IP                  |
| Render            | Optional: remove shopu.ge custom domains    |
| New user domains  | User adds in app + CNAME to shopu.ge only   |

After this, every new custom domain is handled automatically from the user side only.
