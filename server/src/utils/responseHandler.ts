import { Response } from 'express';

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  data: any,
  message = ''
) => {
  res.status(statusCode).json({ success, data, message });
};
