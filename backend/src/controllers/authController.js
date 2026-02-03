import { AuthService } from '../services/AuthService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const authService = new AuthService();

/**
 * Registers a new user with their first tenant
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantName, subdomain, iban } = req.validatedData;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      tenantName,
      subdomain,
      iban: iban || null,
    });

    res.status(201).json(
      ApiResponse.created(
        {
          user: result.user,
          tenant: result.tenant,
          payment: result.payment,
          token: result.token,
        },
        'Registration successful'
      )
    );
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'Subdomain already taken') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Registration error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Authenticates a user and returns their info with JWT token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    const result = await authService.login({ email, password });

    res.json(
      ApiResponse.success(
        {
          user: result.user,
          tenants: result.tenants,
          token: result.token,
        },
        'Login successful'
      )
    );
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json(ApiResponse.error(error.message));
    }
    console.error('Login error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Gets current user info with all their tenants
 */
const me = async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);

    res.json(ApiResponse.success(result));
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    console.error('Get user error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Updates user's IBAN
 */
const updateIban = async (req, res) => {
  try {
    const { iban } = req.validatedData;
    const result = await authService.updateIban(req.user.id, iban);

    res.json(
      ApiResponse.updated(
        { user: result.user },
        'IBAN updated successfully'
      )
    );
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    console.error('Update IBAN error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Updates user's profile (firstName, lastName, email)
 */
const updateProfile = async (req, res) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.validatedData);

    res.json(
      ApiResponse.updated(
        { user: result.user },
        'Profile updated successfully'
      )
    );
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    if (error.message === 'Email already in use') {
      return res.status(400).json(ApiResponse.error('Email already in use'));
    }
    console.error('Update profile error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Verifies email confirmation code
 */
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.validatedData;
    const result = await authService.verifyEmail(req.user.id, code);

    res.json(
      ApiResponse.success(
        { user: result.user },
        'Email verified successfully'
      )
    );
  } catch (error) {
    if (error.message === 'Invalid or expired verification code') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    console.error('Verify email error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Resends email confirmation code
 */
const resendEmailConfirmation = async (req, res) => {
  try {
    const result = await authService.resendEmailConfirmation(req.user.id);

    res.json(ApiResponse.success(null, result.message));
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    if (error.message === 'Email already verified') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Resend email confirmation error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Requests password reset - sends code to email (public endpoint)
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.validatedData;
    const result = await authService.requestPasswordReset(email);

    res.json(ApiResponse.success(null, result.message));
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Resets password using verification code (public endpoint)
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.validatedData;
    const result = await authService.resetPassword(email, code, newPassword);

    res.json(ApiResponse.success(null, result.message));
  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Invalid or expired verification code') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Reset password error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Sends password reset code to authenticated user's email
 */
const sendPasswordResetCode = async (req, res) => {
  try {
    const result = await authService.sendPasswordResetCode(req.user.id);

    res.json(ApiResponse.success(null, result.message));
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    console.error('Send password reset code error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

/**
 * Changes password using verification code (authenticated)
 */
const changePassword = async (req, res) => {
  try {
    const { code, newPassword } = req.validatedData;
    const result = await authService.changePassword(req.user.id, code, newPassword);

    res.json(ApiResponse.success(null, result.message));
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json(ApiResponse.notFound('User'));
    }
    if (error.message === 'Invalid or expired verification code') {
      return res.status(400).json(ApiResponse.error(error.message));
    }
    console.error('Change password error:', error);
    res.status(500).json(ApiResponse.error('Internal server error'));
  }
};

export {
  register,
  login,
  me,
  updateIban,
  updateProfile,
  verifyEmail,
  resendEmailConfirmation,
  requestPasswordReset,
  resetPassword,
  sendPasswordResetCode,
  changePassword
};