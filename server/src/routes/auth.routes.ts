import { Router, Request, Response, NextFunction } from 'express';
import { handleGoogleAuth } from '../controllers/auth.controllers';
import { authenticate } from '../middleware/auth.middleware';
import { PrismaClient } from '../../generated/prisma';


export const prisma = new PrismaClient();

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const router = Router();

router.post('/google', handleGoogleAuth);

router.get('/user', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId){
        res.status(401).json({ error: 'Unauthorized' });
        return; 
    } 

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user){
        res.status(404).json({ error: 'User not found' });
        return;
    } 

    res.json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
