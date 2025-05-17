import { Router } from 'express';
import {
  createPortfolio,
  deletePortfolio,
  getAllPortfolios,
  getPortfolioById,
  updatePortfolio,
} from '../controllers/dashboard.controllers';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createPortfolio);
router.get('/', getAllPortfolios);
router.get('/:id', getPortfolioById);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);

export default router;
