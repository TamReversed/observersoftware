const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Magic numbers for image validation (file signatures)
const IMAGE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF header, WebP has more checks needed
};

// Validate file by magic number
async function validateFileSignature(filePath, expectedMime) {
  try {
    const buffer = await fs.readFile(filePath);
    const signature = Array.from(buffer.slice(0, 12));
    const expectedSig = IMAGE_SIGNATURES[expectedMime];
    
    if (!expectedSig) return false;
    
    // Check if buffer starts with expected signature
    return expectedSig.every((byte, index) => signature[index] === byte);
  } catch (error) {
    return false;
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'assets', 'products');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images with stricter validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (reduced from 10MB)
    files: 1
  },
  fileFilter: fileFilter
});

async function uploadScreenshot(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file signature (magic number) to prevent file type spoofing
    const isValid = await validateFileSignature(req.file.path, req.file.mimetype);
    if (!isValid) {
      // Delete the uploaded file if validation fails
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Invalid file type. File signature does not match declared type.' });
    }

    // Additional validation: check file dimensions if possible (would require image processing library)
    // For now, we rely on magic number validation

    // Return the public URL path
    const publicPath = `/assets/products/${req.file.filename}`;
    res.json({ 
      url: publicPath,
      filename: req.file.filename
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
}

module.exports = {
  upload,
  uploadScreenshot
};

