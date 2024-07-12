import multer from "multer";

// Multer simplifies the process of handling file uploads. It parses the incoming multipart/form-data requests and makes the files and other form fields available in the req.file and req.body objects, respectively.
// In multer we can define how and where files should be stored, like disk or cloud services.
// Multer offers -- Storage Configuration, file validation, error handling, ease of integration.

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
