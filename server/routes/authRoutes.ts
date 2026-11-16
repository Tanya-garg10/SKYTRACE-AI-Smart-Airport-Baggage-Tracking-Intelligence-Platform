import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/database.js';
import {
  AuthenticatedRequest,
  HttpError,
  requireAuth,
  signAuthToken,
  toSafeUser,
} from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body ?? {};
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new HttpError(400, 'Full name must be at least 2 characters.');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new HttpError(400, 'Please provide a valid email address.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new HttpError(400, 'Password must be at least 6 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.findOne(
      'users',
      (u) => u.email.toLowerCase() === normalizedEmail,
      { email: normalizedEmail }
    );
    if (existing) {
      throw new HttpError(409, 'An account with this email already exists.');
    }

    const now = new Date().toISOString();
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.insert('users', {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      role: 'passenger', // Public registration always creates passenger role
      active: true,
      createdAt: now,
    });

    await db.insert('passengers', {
      id: `pas-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : '',
      passportLast4: '',
      frequentFlyerTier: 'SkyMiles Member',
      createdAt: now,
    });

    const token = signAuthToken(newUser);
    res.cookie('skytrace_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      token,
      user: toSafeUser(newUser),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new HttpError(400, 'Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.findOne(
      'users',
      (u) => u.email.toLowerCase() === normalizedEmail,
      { email: normalizedEmail }
    );
    if (!user) {
      throw new HttpError(401, 'Invalid email or password.');
    }
    if (!user.active) {
      throw new HttpError(403, 'This account has been deactivated by an administrator.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, 'Invalid email or password.');
    }

    const token = signAuthToken(user);
    res.cookie('skytrace_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('skytrace_token');
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await db.findOne(
      'users',
      (u) => u.id === req.user!.userId,
      { id: req.user!.userId }
    );
    if (!user) {
      throw new HttpError(404, 'User profile not found.');
    }
    res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
