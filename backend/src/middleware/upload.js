import multer from "multer";

const ALLOWED = [
  /^image\//,
  /^text\//, // logs, csv, plain text
  /^application\/pdf$/,
  /^application\/json$/,
  /^video\/(mp4|webm|quicktime)$/,
];

export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter(req, file, cb) {
    const type = file.mimetype || "";
    // .log files often arrive as application/octet-stream
    const isLog = /\.(log|txt|csv|json)$/i.test(file.originalname);
    if (!ALLOWED.some((rx) => rx.test(type)) && !isLog) {
      return cb(new Error(`${file.originalname}: only images, text/log, PDF and video files are allowed`));
    }
    cb(null, true);
  },
});
