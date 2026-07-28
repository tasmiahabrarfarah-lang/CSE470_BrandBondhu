import Product from '../models/Product.js';
import { logAuditAction } from '../utils/auditLogger.js';

// @desc    Get all products for current business (supports search, category filter)
// @route   GET /api/products
// @access  Private (Seller/Collaborator with 'products' permission, Admin view-only)
export const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;

    const query = { businessId: req.businessId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Seller/Collaborator with 'products' permission)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, images } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide name and price' });
    }

    const product = await Product.create({
      businessId: req.businessId,
      name,
      description: description || '',
      price: Number(price),
      category: category || 'General',
      images: Array.isArray(images) ? images : (images ? [images] : []),
      createdBy: req.user._id,
    });

    // Log audit action
    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'CREATE_PRODUCT',
      details: `Created product "${product.name}" ($${product.price})`,
      targetResource: `Product:${product._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Seller/Collaborator with 'products' permission)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, price, category, images } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (images !== undefined) product.images = Array.isArray(images) ? images : [images];

    const updatedProduct = await product.save();

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'UPDATE_PRODUCT',
      details: `Updated product "${updatedProduct.name}"`,
      targetResource: `Product:${updatedProduct._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller/Collaborator with 'products' permission)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'DELETE_PRODUCT',
      details: `Deleted product "${product.name}"`,
      targetResource: `Product:${product._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk upload products via CSV/JSON array (FR-13.5)
// @route   POST /api/products/bulk
// @access  Private (Seller/Collaborator with 'products' permission)
export const bulkUploadProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of products' });
    }

    const formattedProducts = products.map((p) => ({
      businessId: req.businessId,
      name: p.name || 'Untitled Product',
      description: p.description || '',
      price: Number(p.price) || 0,
      category: p.category || 'General',
      images: Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
      createdBy: req.user._id,
    }));

    const inserted = await Product.insertMany(formattedProducts);

    await logAuditAction({
      businessId: req.businessId,
      user: req.user,
      action: 'BULK_UPLOAD_PRODUCTS',
      details: `Bulk uploaded ${inserted.length} products`,
      targetResource: 'ProductCatalog',
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} products`,
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get custom categories/collections for business (FR-13.3)
// @route   GET /api/products/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { businessId: req.businessId });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-pull product details into caption/content generation input (FR-13.4)
// @route   GET /api/products/:id/auto-pull
// @access  Private
export const autoPullProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      businessId: req.businessId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const autoPullData = {
      productId: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      formattedCaptionInput: `Product Name: ${product.name}\nCategory: ${product.category}\nPrice: ৳${product.price}\nDescription: ${product.description}`,
    };

    res.status(200).json({ success: true, data: autoPullData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
