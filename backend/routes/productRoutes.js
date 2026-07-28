import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
  getCategories,
  autoPullProduct,
} from '../controllers/productController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/categories', getCategories);
router.get('/:id/auto-pull', autoPullProduct);
router.post('/bulk', checkPermission('products'), bulkUploadProducts);

router
  .route('/')
  .get(getProducts)
  .post(checkPermission('products'), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(checkPermission('products'), updateProduct)
  .delete(checkPermission('products'), deleteProduct);

export default router;
