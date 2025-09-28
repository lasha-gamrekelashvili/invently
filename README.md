# Invently - Multi-Tenant Shop Platform (MVP)

A SaaS platform where sellers can instantly create an online shop. Each shop lives under its own subdomain and is managed through an admin panel.

## Features

### Core Features ✅

- **Multi-Tenant Architecture**: Each shop operates under its own subdomain (e.g., `furniture.example.com`)
- **Automatic Shop Provisioning**: Sellers register and get their own shop instantly
- **Authentication System**: JWT-based authentication with role-based access (Platform Admin, Store Owner)
- **Admin Panel Features**:
  - Categories with hierarchical support (parent/child relationships)
  - Products with full CRUD operations
  - Image upload and management
  - Inventory tracking (stock quantities)
  - Product status management (Active/Draft)
- **Public Storefront**: Customer-facing endpoints for browsing products and categories
- **Platform Admin Panel**: System-wide tenant and user management
- **Audit Logging**: Complete action logging for compliance and monitoring
- **Health Checks**: Comprehensive health and readiness endpoints

### Technical Features ✅

- **Tenant Resolution**: Automatic tenant detection from subdomain
- **Data Isolation**: Complete data segregation between tenants
- **Soft Delete**: Data preservation with soft delete functionality
- **Input Validation**: Comprehensive validation using Joi
- **Pagination & Filtering**: Efficient data handling with pagination
- **API Documentation**: Complete OpenAPI/Swagger documentation
- **Security**: Password hashing, JWT tokens, rate limiting

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **ORM**: Prisma
- **Authentication**: JWT, bcrypt
- **Validation**: Joi
- **File Upload**: Multer
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
invently/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, tenant resolution, etc.
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Validation, audit logging
│   │   └── config/         # Swagger configuration
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── uploads/            # File uploads directory
│   ├── server.js           # Main application entry
│   └── test-api.js         # API test suite
└── frontend/               # Frontend directory (ready for implementation)
```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Setup the backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev
   ```

2. **Setup the frontend (in a new terminal):**
   ```bash
   cd frontend/invently-frontend
   npm install
   npm run dev
   ```

3. **Access the application:**
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:3001`
   - **API Documentation**: `http://localhost:3001/api/docs`

### Demo Login

Use these credentials to test the application:
- **Email**: `john@example.com`
- **Password**: `password123`

(These are created by running the backend test suite)

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3001/api/docs`
- **Health Check**: `http://localhost:3001/healthz`
- **Readiness Check**: `http://localhost:3001/readyz`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user + create shop
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Admin Panel (Store Owner)
- `GET|POST|PUT|DELETE /api/categories` - Category management
- `GET|POST|PUT|DELETE /api/products` - Product management
- `POST /api/media/products/:id/images` - Upload product images

### Public Storefront
- `GET /api/storefront/info` - Store information
- `GET /api/storefront/categories` - Public categories
- `GET /api/storefront/products` - Public products
- `GET /api/storefront/products/:slug` - Product details

### Platform Admin
- `GET /api/admin/tenants` - List all shops
- `GET /api/admin/users` - List all users
- `GET /api/admin/audit-logs` - Audit trail
- `GET /api/admin/stats` - System statistics

## Testing

Run the comprehensive test suite:

```bash
cd backend
node test-api.js
```

This tests all major functionality including:
- User registration and login
- Tenant creation
- Category and product management
- Public storefront endpoints
- Multi-tenant data isolation

## Usage Examples

### 1. Register a New Store

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "tenantName": "John'\''s Electronics",
    "subdomain": "johnstore"
  }'
```

### 2. Access Store as Customer

```bash
curl -H "Host: johnstore.example.com" \
  http://localhost:3001/api/storefront/products
```

### 3. Create Products (Store Owner)

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Host: johnstore.example.com" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 15",
    "slug": "iphone-15",
    "price": 999.99,
    "stockQuantity": 10,
    "status": "ACTIVE"
  }'
```

## Database Schema

### Core Tables
- **Users**: Platform users (admin, store owners)
- **Tenants**: Shop/store instances
- **Categories**: Product categories with hierarchy
- **Products**: Store products with pricing and inventory
- **ProductImages**: Product image management
- **AuditLogs**: Complete action logging

### Key Features
- UUID primary keys
- Soft delete support
- Tenant isolation
- Hierarchical categories
- Audit trail

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Protection against brute force
- **Input Validation**: Comprehensive validation
- **Tenant Isolation**: Complete data segregation
- **CORS Configuration**: Secure cross-origin requests

## Development Notes

### Adding New Features

1. Update Prisma schema if needed
2. Run migration: `npx prisma migrate dev`
3. Add controller logic
4. Create routes
5. Add validation schemas
6. Update tests

### Production Deployment

1. Update DATABASE_URL to PostgreSQL
2. Change JWT_SECRET to a secure value
3. Configure proper CORS origins
4. Set up file storage (AWS S3, etc.)
5. Configure subdomain routing

## Roadmap

### Phase 1 (Completed ✅)
- Core multi-tenant architecture
- Authentication and authorization
- Product and category management
- Basic storefront
- Admin panel

### Phase 2 (Future)
- Payment integration
- Order management
- Customer accounts
- Email notifications
- Advanced analytics

### Phase 3 (Future)
- Theme customization
- Advanced SEO features
- Multi-language support
- Mobile app APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Check the API documentation at `/api/docs`
- Review the test suite for usage examples
- Open an issue for bugs or feature requests

---

## Frontend Features ✅

### Modern React Application
- **React 19** with TypeScript for type safety
- **Vite** for lightning-fast development
- **Tailwind CSS** for modern, responsive design
- **React Router** for client-side routing
- **TanStack Query** for server state management

### User Interface
- **Authentication Pages**: Login and registration with validation
- **Admin Dashboard**: Overview with metrics and quick actions
- **Category Management**: Hierarchical category organization
- **Product Management**: Complete product lifecycle
- **Public Storefront**: Customer-facing shop interface
- **Platform Admin**: System-wide administration (for platform admins)

### User Experience
- **Responsive Design**: Mobile-first approach
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time validation feedback
- **Modern Icons**: Beautiful Heroicons throughout

### Technical Features
- **Multi-Tenant Support**: Each shop isolated by subdomain
- **JWT Authentication**: Secure token-based auth
- **API Integration**: Type-safe API client with interceptors
- **State Management**: Context + TanStack Query pattern
- **Code Splitting**: Optimized bundle sizes

## Frontend Structure

```
frontend/invently-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx      # Main app layout with sidebar
│   │   ├── LoadingSpinner.tsx
│   │   └── PrivateRoute.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── pages/             # Route components
│   │   ├── Login.tsx      # User login
│   │   ├── Register.tsx   # User registration + shop creation
│   │   ├── Dashboard.tsx  # Admin dashboard
│   │   ├── Categories.tsx # Category management
│   │   ├── Products.tsx   # Product management
│   │   ├── Storefront.tsx # Public store interface
│   │   ├── ProductDetail.tsx
│   │   └── PlatformAdmin.tsx
│   ├── types/             # TypeScript definitions
│   │   └── index.ts       # All type definitions
│   ├── utils/             # Utilities
│   │   └── api.ts         # API client with all endpoints
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── tailwind.config.js     # Tailwind configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies and scripts
```

## Accessing the Application

### Frontend URLs (localhost:3000)
- `/login` - User login
- `/register` - Create new shop
- `/dashboard` - Shop owner dashboard
- `/categories` - Manage categories
- `/products` - Manage products
- `/store` - Public storefront view
- `/admin` - Platform admin (admin users only)

### Demo Flow
1. **Register**: Create a new shop at `/register`
2. **Login**: Sign in with existing credentials
3. **Dashboard**: View shop overview and stats
4. **Categories**: Create product categories
5. **Products**: Add products to your shop
6. **Storefront**: View your public shop

**Status**: Full-Stack MVP Complete ✅
**Last Updated**: September 27, 2025
**API Version**: 1.0.0
**Frontend Version**: 1.0.0