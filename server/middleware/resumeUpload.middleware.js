
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import env from "../config/env.js";

const uploadDirectory = path.resolve("private", "resumes");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        cb(null, `${randomUUID()}.pdf`);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: env.maxResumeSizeMb * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, cb) => {
        if (
            file.mimetype !== "application/pdf" ||
            path.extname(file.originalname).toLowerCase() !== ".pdf"
        ) {
            return cb(new Error("Only PDF files are accepted."));
        }

        cb(null, true);
    }
});

export const uploadResume = upload.single("resume");
