import { Router } from "express";
import {
    addVariant,
    updateVariant,
    deleteVariant,
    getAllVariants,
    getVariantsByProductId
} from "../controllers/variantController.js";
const variantRoutes = Router();
//API variant
// routes/variantRoutes.js
variantRoutes.get('/product/:productId', getVariantsByProductId);


variantRoutes.get("/", getAllVariants);
variantRoutes.post("/add", addVariant);
variantRoutes.put("/:id", updateVariant);
variantRoutes.delete("/:id", deleteVariant);
export default variantRoutes;