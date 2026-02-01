import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { PaymentService } from './PaymentService.js';

export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
    this.tenantRepository = new TenantRepository();
    this.paymentService = new PaymentService();
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async register(userData) {
    const { email, password, firstName, lastName, tenantName, subdomain, iban } = userData;

    // Check if user already exists
    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if subdomain is already taken
    const existingTenant = await this.tenantRepository.findBySubdomain(subdomain);
    if (existingTenant) {
      throw new Error('Subdomain already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and tenant in a transaction
    // Tenant is created as inactive until payment is successful
    const result = await this.authRepository.createUserWithTenant(
      {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'STORE_OWNER',
        iban: iban || null,
      },
      {
        name: tenantName,
        subdomain,
        isActive: false, // Tenant is inactive until payment succeeds
      }
    );

    // Create setup fee payment record
    const payment = await this.paymentService.createPayment(
      result.user.id,
      result.tenant.id,
      'SETUP_FEE',
      1.0 // 1 GEL setup fee
    );

    // Generate token
    const token = this.generateToken(result.user.id);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        iban: result.user.iban,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        type: payment.type,
      },
      token,
    };
  }

  async login(credentials) {
    const { email, password } = credentials;

    // Find user with tenants
    const user = await this.authRepository.findByEmailWithTenants(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenants: user.ownedTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.isActive, // Include status so frontend can check
      })),
      token,
    };
  }

  async getCurrentUser(userId) {
    const user = await this.authRepository.findByIdWithTenants(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Return ALL tenants (including inactive ones) so frontend can check status
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        iban: user.iban,
      },
      tenants: user.ownedTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.isActive, // Include inactive tenants so frontend can check
      })),
    };
  }

  async updateIban(userId, iban) {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.authRepository.update(userId, {
      iban,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        iban: updatedUser.iban,
      },
    };
  }
}
