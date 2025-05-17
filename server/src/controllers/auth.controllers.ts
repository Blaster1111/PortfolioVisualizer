import { Request, Response } from 'express';
import { generateToken } from '../utils/jwt';
import { PrismaClient } from '../../generated/prisma';

export const prisma = new PrismaClient();


export const handleGoogleAuth = async (req: Request, res: Response) => {
  try {
    const { email, name, image } = req.body;

    if (!email){
      res.status(400).json({ error: 'Email is required' });
      return;
    } 

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name, image },
      });
    }

    const accessToken = generateToken({ id: user.id, email: user.email });

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
