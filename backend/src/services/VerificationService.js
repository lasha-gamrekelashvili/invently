import prisma from '../repositories/BaseRepository.js';
import { EmailService } from './EmailService.js';
import crypto from 'crypto';

export class VerificationService {
  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generates a random 6-digit verification code
   */
  generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Creates a verification code and sends it via email
   */
  async createAndSendCode(userId, email, type) {
    // Delete any existing unused codes of the same type for this user
    await prisma.verificationCode.deleteMany({
      where: {
        userId,
        type,
        used: false,
      },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const verificationCode = await prisma.verificationCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    // Send email
    await this.emailService.sendVerificationCode(email, code, type);

    return verificationCode;
  }

  /**
   * Verifies a code and marks it as used
   */
  async verifyCode(userId, code, type) {
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type,
        used: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (!verificationCode) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return true;
  }

  /**
   * Cleans up expired codes (can be called by a cron job)
   */
  async cleanupExpiredCodes() {
    await prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
