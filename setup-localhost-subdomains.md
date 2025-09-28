# Setting up Localhost Subdomains for Development

To test the multi-tenant subdomain functionality locally, you need to configure your system to handle subdomains on localhost.

## Windows (using hosts file)

1. Open Notepad as Administrator
2. Open the file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines at the end:
```
127.0.0.1 localhost
127.0.0.1 demo.localhost
127.0.0.1 johnstore.localhost
127.0.0.1 mystore.localhost
```

## macOS/Linux (using hosts file)

1. Open terminal
2. Edit the hosts file: `sudo nano /etc/hosts`
3. Add these lines:
```
127.0.0.1 localhost
127.0.0.1 demo.localhost
127.0.0.1 johnstore.localhost
127.0.0.1 mystore.localhost
```

## Testing the Setup

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend/invently-frontend && npm run dev`
3. Visit: `http://localhost:3000` (main app)
4. Register a new shop with subdomain "mystore"
5. You should be redirected to: `http://mystore.localhost:3000/dashboard`

## Browser Considerations

- Some browsers may cache DNS lookups, so you might need to clear your browser cache
- Chrome/Edge: Try incognito mode if subdomains don't work immediately
- Firefox: Usually works better with localhost subdomains

## Troubleshooting

If subdomains don't work:
1. Check that the hosts file was saved correctly
2. Try flushing DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (macOS)
3. Restart your browser
4. Try a different browser
