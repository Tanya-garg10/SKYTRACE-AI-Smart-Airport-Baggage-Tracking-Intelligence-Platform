import { Router } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest, HttpError, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const all = await db.getNotifications();
    const user = req.user!;

    const mine = all
      .filter((n) => {
        if (user.role === 'admin') return true;
        if (n.userId && n.userId === user.userId) return true;
        if (!n.userId && (n.targetRole === user.role || n.targetRole === 'all')) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((n) => ({
        ...n,
        read: n.readByUserIds.includes(user.userId),
      }));

    res.json({
      success: true,
      notifications: mine,
      unreadCount: mine.filter((n) => !n.read).length,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const existing = await db.findOne(
      'notifications',
      (n) => n.id === req.params.id,
      { id: req.params.id }
    );
    if (!existing) {
      throw new HttpError(404, 'Notification not found.');
    }

    const userId = req.user!.userId;
    if (!existing.readByUserIds.includes(userId)) {
      await db.updateById('notifications', existing.id, {
        readByUserIds: [...existing.readByUserIds, userId],
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const all = await db.getNotifications();
    const user = req.user!;
    for (const n of all) {
      const visible =
        user.role === 'admin' ||
        n.userId === user.userId ||
        (!n.userId && (n.targetRole === user.role || n.targetRole === 'all'));
      if (visible && !n.readByUserIds.includes(user.userId)) {
        await db.updateById('notifications', n.id, {
          readByUserIds: [...n.readByUserIds, user.userId],
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
