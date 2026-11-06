import multer from "multer";
import path from "path";
import env from "../config/env.js";
import AppError from "../utils/AppError.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: env.maxResumeSizeMb * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (
            file.mimetype !== "application/pdf" ||
            path.extname(file.originalname).toLowerCase() !== ".pdf"
        ) {
            callback(new AppError("Only PDF job descriptions are accepted.", 415));
            return;
        }
        callback(null, true);
    }
});

export const uploadJobDescriptionPdf = upload.single("jobDescriptionPdf");
