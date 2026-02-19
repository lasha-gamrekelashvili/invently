import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { PaymentService } from './PaymentService.js';
import { VerificationService } from './VerificationService.js';
import prisma from '../repositories/BaseRepository.js';

export class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
    this.tenantRepository = new TenantRepository();
    this.paymentService = new PaymentService();
    this.verificationService = new VerificationService();
  }

  /**
   * Generates a JWT token for a user
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Registers a new user with their first tenant.
   * Creates user, tenant (inactive), and setup fee payment.
   */
  async register(userData) {
    const { email, password, tenantName, subdomain } = userData;

    const existingUser = await this.authRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingTenant = await this.tenantRepository.findBySubdomain(subdomain);
    if (existingTenant) {
      throw new Error('Subdomain already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await this.authRepository.createUserWithTenant(
      {
        email,
        password: hashedPassword,
        role: 'STORE_OWNER',
      },
      {
        name: tenantName,
        subdomain,
        isActive: false,
      }
    );

    const payment = await this.paymentService.createPayment(
      result.user.id,
      result.tenant.id,
      'SETUP_FEE'
    );

    // Send email confirmation code
    await this.verificationService.createAndSendCode(
      result.user.id,
      email,
      'EMAIL_CONFIRMATION'
    );

    const token = this.generateToken(result.user.id);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        iban: result.user.iban,
        emailVerified: result.user.emailVerified,
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

  /**
   * Authenticates a user and returns their info with JWT token
   */
  async login(credentials) {
    const { email, password } = credentials;

    const user = await this.authRepository.findByEmailWithTenants(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tenants: user.ownedTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
        isActive: tenant.isActive,
      })),
      token,
    };
  }

  /**
   * Gets current user info with all their tenants
   */
  async getCurrentUser(userId) {
    const user = await this.authRepository.findByIdWithTenants(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        iban: user.iban,
        emailVerified: user.emailVerified,
      },
      tenants: user.ownedTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
        isActive: tenant.isActive,
      })),
    };
  }

  /**
   * Updates user's IBAN
   */
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
        role: updatedUser.role,
        iban: updatedUser.iban,
      },
    };
  }

  /**
   * Updates user's profile (email)
   */
  async updateProfile(userId, profileData) {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (profileData.email && profileData.email !== user.email) {
      const existingUser = await this.authRepository.findByEmail(profileData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use');
      }
    }

    const updateData = {};
    if (profileData.email !== undefined) updateData.email = profileData.email;

    const updatedUser = await this.authRepository.update(userId, updateData);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        iban: updatedUser.iban,
        emailVerified: updatedUser.emailVerified,
      },
    };
  }

  /**
   * Verifies email confirmation code
   */
  async verifyEmail(userId, code) {
    await this.verificationService.verifyCode(userId, code, 'EMAIL_CONFIRMATION');

    // Mark email as verified
    const updatedUser = await this.authRepository.update(userId, {
      emailVerified: true,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        iban: updatedUser.iban,
        emailVerified: updatedUser.emailVerified,
      },
    };
  }

  /**
   * Resends email confirmation code
   */
  async resendEmailConfirmation(userId) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    await this.verificationService.createAndSendCode(
      userId,
      user.email,
      'EMAIL_CONFIRMATION'
    );

    return { message: 'Verification code sent successfully' };
  }

  /**
   * Requests password reset - sends code to email
   */
  async requestPasswordReset(email) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If the email exists, a password reset code has been sent' };
    }

    await this.verificationService.createAndSendCode(
      user.id,
      email,
      'PASSWORD_RESET'
    );

    return { message: 'If the email exists, a password reset code has been sent' };
  }

  /**
   * Resets password using verification code
   */
  async resetPassword(email, code, newPassword) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify the code
    await this.verificationService.verifyCode(user.id, code, 'PASSWORD_RESET');

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.authRepository.update(user.id, {
      password: hashedPassword,
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Changes password (for authenticated users)
   */
  async changePassword(userId, code, newPassword) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify the code
    await this.verificationService.verifyCode(user.id, code, 'PASSWORD_RESET');

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.authRepository.update(user.id, {
      password: hashedPassword,
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Sends password reset code to authenticated user's email
   */
  async sendPasswordResetCode(userId) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.verificationService.createAndSendCode(
      userId,
      user.email,
      'PASSWORD_RESET'
    );

    return { message: 'Password reset code sent successfully' };
  }
}
