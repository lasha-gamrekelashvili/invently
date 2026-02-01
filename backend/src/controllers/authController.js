import { AuthService } from '../services/AuthService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const authService = new AuthService();

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

const updateIban = async (req, res) => {
  try {
    const { iban } = req.validatedData;
    const result = await authService.updateIban(req.user.id, iban);

    res.json(
      ApiResponse.updated(
        result.user,
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

export {
  register,
  login,
  me,
  updateIban
};