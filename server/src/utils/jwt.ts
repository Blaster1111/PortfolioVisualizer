// src/utils/jwt.ts

import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET: Secret = process.env.JWT_SECRET || '';

if (!JWT_SECRET) throw new Error('JWT_SECRET not set in environment variables');

export function generateToken(payload: object, expiresIn: string | number = '7d'): string {
  const options: SignOptions = { 
    expiresIn: expiresIn as any 
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): string | JwtPayload {
  return jwt.verify(token, JWT_SECRET);
}