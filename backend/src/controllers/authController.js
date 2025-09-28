const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantName, subdomain } = req.validatedData;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'STORE_OWNER'
        }
      });

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          ownerId: user.id
        }
      });

      return { user, tenant };
    });


    const token = generateToken(result.user.id);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    const user = await prisma.user.findUnique({
      where: {
        email,
        deletedAt: null
      },
      include: {
        ownedTenants: {
          where: {
            isActive: true,
            deletedAt: null
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);


    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tenants: user.ownedTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      })),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
        deletedAt: null
      },
      include: {
        ownedTenants: {
          where: {
            isActive: true,
            deletedAt: null
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tenants: user.ownedTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      }))
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  me
};