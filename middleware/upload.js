import path from "path";
import multer from "multer";

const tempDir = path.resolve("tmp");

const multerConfig = multer.diskStorage({
  destination: tempDir,
});

const upload = multer({ storage: multerConfig });

export default upload;