import express from 'express';
import { getAnalyticData, createAnalytic } from '../controllers/analyticController.js';

const router = express.Router();

router.get('/', getAnalyticData);
router.post('/', createAnalytic);

export default router;
