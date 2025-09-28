# Invently Frontend

Modern React TypeScript frontend for the Invently multi-tenant shop platform.

## Features

- 🔐 **Authentication**: Login/Register with JWT
- 🏪 **Multi-Tenant Support**: Each shop has its own subdomain
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🛍️ **Admin Dashboard**: Complete shop management interface
- 🛒 **Public Storefront**: Customer-facing shop interface
- 👑 **Platform Admin**: System-wide administration panel
- 🎨 **Modern UI**: Clean, professional interface with Heroicons

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Heroicons** for icons
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 3001

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── LoadingSpinner.tsx
│   └── PrivateRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── pages/             # Route components
│   ├── Login.tsx      # Authentication
│   ├── Register.tsx
│   ├── Dashboard.tsx  # Admin dashboard
│   ├── Categories.tsx # Category management
│   ├── Products.tsx   # Product management
│   ├── Storefront.tsx # Public store
│   ├── ProductDetail.tsx
│   └── PlatformAdmin.tsx
├── types/             # TypeScript definitions
│   └── index.ts
├── utils/             # Utilities and API
│   └── api.ts         # API client with all endpoints
├── App.tsx            # Main app component
└── main.tsx           # Application entry point
```

## Available Routes

### Public Routes
- `/login` - User login
- `/register` - User registration and shop creation
- `/store` - Public storefront
- `/store/products/:slug` - Product detail page

### Protected Routes (Admin)
- `/dashboard` - Shop dashboard with stats
- `/categories` - Category management
- `/products` - Product management
- `/admin` - Platform admin (PLATFORM_ADMIN only)

## API Integration

The frontend communicates with the backend API through a centralized API client (`utils/api.ts`) that includes:

- **Automatic JWT token handling**
- **Request/response interceptors**
- **Error handling and redirects**
- **Type-safe API methods**

### API Modules

- `authAPI` - Authentication endpoints
- `categoriesAPI` - Category CRUD operations
- `productsAPI` - Product CRUD operations
- `mediaAPI` - Image upload and management
- `storefrontAPI` - Public storefront data
- `adminAPI` - Platform administration

## Features in Detail

### Authentication
- JWT-based authentication with automatic token refresh
- User registration creates both user and shop
- Role-based access control (Store Owner, Platform Admin)
- Automatic logout on token expiration

### Multi-Tenant Support
- Each shop operates under its own subdomain
- Data isolation between tenants
- Automatic tenant resolution from URL
- Shop-specific branding and content

### Shop Management
- **Dashboard**: Overview with key metrics and quick actions
- **Categories**: Hierarchical category management
- **Products**: Full product lifecycle management
- **Media**: Image upload and management for products

### Public Storefront
- Clean, responsive design for customers
- Category-based product browsing
- Product search and filtering
- Detailed product pages

### Platform Administration
- System-wide statistics and metrics
- Tenant management and monitoring
- User management across all shops
- Audit log viewing

## Styling

The application uses Tailwind CSS with custom utility classes:

```css
/* Custom component classes */
.btn-primary     /* Blue primary button */
.btn-secondary   /* Gray secondary button */
.btn-outline     /* Outlined button */
.input-field     /* Styled form input */
.card           /* White card with shadow */
```

## State Management

- **Auth State**: Managed by AuthContext with localStorage persistence
- **Server State**: Managed by TanStack Query with caching and background updates
- **URL State**: Managed by React Router for navigation

## Error Handling

- Global error boundaries for React errors
- API error interceptors with user-friendly messages
- Form validation with real-time feedback
- Loading states for all async operations

## Performance

- **Code splitting** by route for smaller bundles
- **Image optimization** with proper loading states
- **Query caching** to minimize API calls
- **Memoization** of expensive computations

## Deployment

### Environment Variables

```bash
# Create .env.production
VITE_API_URL=https://your-api-domain.com
```

### Build Commands

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Docker

```dockerfile
# Multi-stage build for optimal size
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Demo Credentials

For testing the application:

**Store Owner:**
- Email: `john@example.com`
- Password: `password123`

**Platform Admin:**
- Create a user with role `PLATFORM_ADMIN` via API

## Contributing

1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Write meaningful component and function names
4. Add loading and error states for all async operations
5. Follow the existing file structure and naming conventions

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure backend is running on port 3001
   - Check CORS configuration in backend

2. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript errors

3. **Authentication Issues**
   - Clear localStorage and cookies
   - Verify JWT secret matches backend

### Development Tips

- Use React DevTools for component debugging
- Use Network tab to debug API calls
- Check console for any JavaScript errors
- Use the TanStack Query DevTools for server state debugging

## License

MIT License - see root LICENSE file for details