const express = require('express');
const { auth, requireEmailVerification } = require('../middleware/auth');
const { uploadDocuments } = require('../utils/upload');

const router = express.Router();

// @route   POST /api/uploads/documents
// @desc    Upload documents/files
// @access  Private
router.post('/documents', [
  auth,
  requireEmailVerification,
  uploadDocuments.array('files', 10) // Max 10 files
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: file.path,
      publicId: file.filename,
      size: file.size,
      mimeType: file.mimetype
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading files'
    });
  }
});

// @route   POST /api/uploads/images
// @desc    Upload images
// @access  Private
router.post('/images', [
  auth,
  requireEmailVerification,
  uploadDocuments.array('images', 5) // Max 5 images
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    // Filter only image files
    const imageFiles = req.files.filter(file => file.mimetype.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid image files found'
      });
    }

    const uploadedImages = imageFiles.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: file.path,
      publicId: file.filename,
      size: file.size,
      mimeType: file.mimetype
    }));

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages,
        count: uploadedImages.length
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading images'
    });
  }
});

module.exports = router;
