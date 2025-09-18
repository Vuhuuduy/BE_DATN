import { Router } from "express";
import { getStats } from "../controllers/statsController.js";
import { getTopProducts } from "../controllers/statsController.js";
import { getRevenueByMonth } from "../controllers/statsController.js";
const statsRoutes = Router();

// GET /api/stats
statsRoutes.get("/", getStats);
statsRoutes.get("/top-products", getTopProducts);
statsRoutes.get("/revenue-by-month", getRevenueByMonth);
export default statsRoutes;
