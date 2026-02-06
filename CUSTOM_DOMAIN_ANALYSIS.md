# Custom Domain Support Analysis

## Overview
This document outlines all the modifications needed to support users using their own custom domains (e.g., `mystore.com`) instead of requiring subdomains ending with `.shopu.ge` (e.g., `mystore.shopu.ge`).

## Current Architecture

### Domain Resolution Flow
1. **Frontend**: Sends requests with `X-Original-Host` header containing the hostname
2. **Backend Middleware** (`tenantResolver.js`): 
   - Extracts subdomain from host header
   - Looks up tenant by `subdomain` field in database
   - Assumes subdomain format: `subdomain.shopu.ge` or `subdomain.localhost`

### Current Limitations
- Hardcoded `.shopu.ge` suffix in multiple places
- CORS only allows `.shopu.ge` and `.momigvare.ge` domains
- Tenant lookup only uses `subdomain` field
- Frontend assumes subdomain-based routing

---

## Required Modifications

### 1. Database Schema Changes

**File**: `backend/prisma/schema.prisma`

**Change**: Add `customDomain` field to Tenant model
```prisma
model Tenant {
  id            String         @id @default(uuid())
  name          String
  subdomain     String         @unique
  customDomain  String?        @unique  // NEW: Optional custom domain
  description   String?
  // ... rest of fields
}
```

**Migration**: Create a new migration to add the `customDomain` column

---

### 2. Backend: Tenant Resolver Middleware

**File**: `backend/src/middleware/tenantResolver.js`

**Current Logic**:
- Extracts subdomain from host (assumes `subdomain.domain.com` format)
- Queries tenant by `subdomain` only

**Required Changes**:
1. Check if incoming host matches a `customDomain` first
2. If no custom domain match, fall back to subdomain extraction
3. Handle both subdomain and custom domain lookups

**New Logic Flow**:
```javascript
// 1. Check if host matches any customDomain
const tenantByCustomDomain = await prisma.tenant.findFirst({
  where: { customDomain: host }
});

if (tenantByCustomDomain) {
  req.tenant = tenantByCustomDomain;
  return next();
}

// 2. Fall back to subdomain extraction (existing logic)
// ... existing subdomain logic
```

---

### 3. Backend: CORS Configuration

**File**: `backend/server.js` (lines 34-65)

**Current**: Only allows specific domains and `.shopu.ge` subdomains

**Required Changes**:
1. Allow requests from any domain (for custom domains)
2. OR: Dynamically check if the origin's domain is registered as a customDomain
3. Keep existing `.shopu.ge` and `.momigvare.ge` support

**Option A - Allow All Domains** (Simpler, less secure):
```javascript
origin: function (origin, callback) {
  if (!origin) return callback(null, true);
  if (origin.includes('localhost')) return callback(null, true);
  
  // Allow shopu.ge domains
  if (origin.includes('shopu.ge') || origin.includes('momigvare.ge')) {
    return callback(null, true);
  }
  
  // For custom domains, verify they're registered (async check)
  // This requires async CORS validation - may need different approach
  callback(null, true); // Allow all for now, verify in middleware
}
```

**Option B - Dynamic Domain Verification** (More secure):
- Query database to verify custom domain is registered
- Cache results for performance
- Requires async CORS validation (may need `cors` package update)

---

### 4. Backend: Tenant Service & Repository

**File**: `backend/src/services/TenantService.js`

**Add Method**: `updateCustomDomain(tenantId, customDomain, userId)`
- Validate domain format
- Check domain uniqueness
- Update tenant's customDomain field
- Optionally verify DNS configuration

**File**: `backend/src/repositories/TenantRepository.js`

**Add Method**: `findByCustomDomain(customDomain)`
- Query tenant by customDomain field

---

### 5. Backend: Settings Controller & Routes

**File**: `backend/src/controllers/settingsController.js`

**Add**: `updateTenantCustomDomain` controller
- Validate domain format
- Check domain availability
- Update tenant's customDomain

**File**: `backend/src/routes/settings.js`

**Add Route**: `PUT /api/settings/tenant/custom-domain`
- Protected route (requires authentication)
- Validates domain format
- Updates tenant's customDomain

---

### 6. Backend: Domain Validation

**File**: `backend/src/utils/validation.js`

**Add Schema**: Domain validation schema
```javascript
updateTenantCustomDomain: Joi.object({
  customDomain: Joi.string()
    .domain()
    .optional()
    .allow(null, '')
    .custom((value, helpers) => {
      if (value && !value.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
})
```

---

### 7. Frontend: API Utilities

**File**: `frontend/invently-frontend/src/utils/api.ts`

**Current**: `isOnSubdomain()` function checks for `.shopu.ge` suffix

**Required Changes**:
1. Update `isOnSubdomain()` to detect custom domains
2. Add `getCurrentDomain()` function to get current domain/subdomain
3. Update `getCurrentSubdomain()` to handle custom domains

**New Logic**:
```typescript
export const isOnSubdomain = () => {
  const host = window.location.hostname;
  
  // Not a subdomain if it's localhost or an IP address
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  
  // localhost special-case
  if (host.endsWith('.localhost')) return true;
  
  // Check if it's NOT the main domain (shopu.ge or momigvare.ge)
  const mainDomains = ['shopu.ge', 'momigvare.ge'];
  if (mainDomains.includes(host)) return false;
  
  // If it ends with .shopu.ge or .momigvare.ge, it's a subdomain
  if (host.endsWith('.shopu.ge') || host.endsWith('.momigvare.ge')) return true;
  
  // Otherwise, assume it's a custom domain (subdomain)
  return true;
};
```

---

### 8. Frontend: Settings Page

**File**: `frontend/invently-frontend/src/pages/Settings.tsx`

**Add**: Custom domain input field
- Input for custom domain
- Validation
- Save/update functionality
- Display current custom domain
- Option to remove custom domain

**UI Changes**:
- Add new section for "Custom Domain"
- Show current custom domain if set
- Input field with domain validation
- Help text explaining DNS setup requirements
- Save button

---

### 9. Frontend: Registration Page

**File**: `frontend/invently-frontend/src/pages/Register.tsx`

**Current**: Shows `.shopu.ge` suffix hardcoded (line 302)

**Required Changes**:
- Keep subdomain input (still required for fallback)
- Optionally add custom domain input (can be added later)
- Update help text to mention custom domains are available

---

### 10. Frontend: Multiple Hardcoded References

**Files to Update**:

1. **`frontend/invently-frontend/src/components/ShopsCarousel.tsx`** (line 60)
   - Currently: `shop.subdomain.shopu.ge`
   - Change: Use tenant's customDomain if available, else fallback to subdomain

2. **`frontend/invently-frontend/src/pages/Dashboard.tsx`** (line 157)
   - Currently: `subdomain.shopu.ge`
   - Change: Use customDomain if available

3. **`frontend/invently-frontend/src/contexts/AuthContext.tsx`** (line 156)
   - Currently: Assumes `.shopu.ge` suffix
   - Change: Handle custom domains

4. **`frontend/invently-frontend/src/components/StorefrontFooter.tsx`** (line 269)
   - Currently: Hardcoded "Shopu.ge"
   - Change: Keep as branding, but don't assume domain structure

5. **`frontend/invently-frontend/src/components/StorefrontPreview.tsx`** (line 253)
   - Currently: Hardcoded "Shopu.ge"
   - Change: Keep as branding

---

### 11. Backend: Order Service

**File**: `backend/src/services/OrderService.js` (line 175)

**Current**: Hardcoded `subdomain.shopu.ge` in order URLs

**Required Changes**:
- Use tenant's customDomain if available
- Fallback to subdomain.shopu.ge if no customDomain

---

### 12. Frontend: Type Definitions

**File**: `frontend/invently-frontend/src/types/index.ts`

**Add**: `customDomain` field to Tenant interface
```typescript
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;  // NEW
  // ... rest of fields
}
```

---

### 13. DNS Configuration Documentation

**New File**: `docs/CUSTOM_DOMAIN_SETUP.md`

**Content**:
- Instructions for users on how to configure DNS
- CNAME record setup: `www` → `shopu.ge` or `momigvare.ge`
- A record setup (if using IP)
- SSL certificate requirements
- Verification steps

---

## Implementation Priority

### Phase 1: Core Backend Support
1. ✅ Database schema migration (add `customDomain` field)
2. ✅ Tenant resolver middleware (support custom domain lookup)
3. ✅ CORS configuration (allow custom domains)
4. ✅ Tenant service/repository (add custom domain methods)
5. ✅ Settings API endpoints (add custom domain update endpoint)

### Phase 2: Frontend Support
6. ✅ Settings page UI (add custom domain input)
7. ✅ API utilities (update domain detection logic)
8. ✅ Fix hardcoded domain references
9. ✅ Type definitions (add customDomain field)

### Phase 3: Additional Features
10. ✅ Domain validation (format, uniqueness)
11. ✅ DNS verification (optional - verify CNAME/A records)
12. ✅ Documentation (DNS setup guide)
13. ✅ Email notifications (when custom domain is added/changed)

---

## Security Considerations

1. **Domain Hijacking Prevention**:
   - Verify domain ownership before allowing custom domain
   - Require DNS verification (CNAME or TXT record)
   - Rate limit domain changes

2. **CORS Security**:
   - Dynamically verify custom domains are registered
   - Cache verification results
   - Implement domain allowlist

3. **Input Validation**:
   - Validate domain format strictly
   - Prevent subdomain injection
   - Sanitize domain input

4. **SSL/TLS**:
   - Ensure SSL certificates are provisioned for custom domains
   - Use Let's Encrypt or similar for automatic SSL
   - Handle certificate renewal

---

## Testing Checklist

- [ ] Register tenant with custom domain
- [ ] Access storefront via custom domain
- [ ] Access admin dashboard via custom domain
- [ ] Update custom domain in settings
- [ ] Remove custom domain (fallback to subdomain)
- [ ] Verify CORS allows custom domain requests
- [ ] Test subdomain fallback when custom domain not set
- [ ] Test domain validation (invalid formats)
- [ ] Test domain uniqueness (prevent duplicates)
- [ ] Test DNS verification (if implemented)

---

## Migration Strategy

1. **Backward Compatibility**: 
   - Keep subdomain field required
   - Custom domain is optional
   - Existing tenants continue working with subdomains

2. **Gradual Rollout**:
   - Deploy backend changes first
   - Test with a few beta users
   - Roll out frontend changes
   - Enable for all users

3. **Data Migration**:
   - No data migration needed (new field is nullable)
   - Existing tenants can add custom domains via settings

---

## Notes

- **DNS Setup**: Users will need to configure DNS records pointing to your server
- **SSL Certificates**: You'll need to provision SSL certificates for custom domains (consider Let's Encrypt)
- **Reverse Proxy**: May need to configure reverse proxy (nginx/traefik) to handle custom domains
- **Performance**: Consider caching domain lookups to avoid database queries on every request
