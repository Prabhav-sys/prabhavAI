
import { useRef, useState } from "react";
import Button from "../../../components/ui/Button";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function ResumeUpload() {
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [error, setError] = useState("");

    const handleFile = (selectedFile) => {
        setError("");

        if (!selectedFile) return;

        const isPDF =
            selectedFile.type === "application/pdf" ||
            selectedFile.name.toLowerCase().endsWith(".pdf");

        if (!isPDF) {
            setError("Only PDF files are supported.");
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError("File size must not exceed 5 MB.");
            return;
        }

        if (selectedFile.size === 0) {
            setError("The selected file is empty.");
            return;
        }

        setFile(selectedFile);
    };

    const handleDrop = (event) => {
        event.preventDefault();

        const selectedFile = event.dataTransfer.files[0];
        handleFile(selectedFile);
    };

    const formatFileSize = (bytes) => {
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const removeFile = () => {
        setFile(null);
        setError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="resume-upload-container">

            <div
                className={`resume-dropzone ${file ? "has-file" : ""}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    hidden
                    onChange={(event) =>
                        handleFile(event.target.files[0])
                    }
                />

                {!file ? (
                    <>
                        <div className="upload-icon">↑</div>

                        <h3>Upload your resume</h3>

                        <p>
                            Drag and drop your PDF here, or
                            <span> browse files</span>
                        </p>

                        <small>PDF format · Maximum 5 MB</small>
                    </>
                ) : (
                    <div className="selected-file">
                        <div className="file-icon">PDF</div>

                        <div className="file-information">
                            <h3>{file.name}</h3>
                            <p>{formatFileSize(file.size)}</p>
                        </div>

                        <button
                            type="button"
                            className="remove-file"
                            onClick={(event) => {
                                event.stopPropagation();
                                removeFile();
                            }}
                            aria-label="Remove selected file"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <p className="resume-error">{error}</p>
            )}

            {file && (
                <div className="resume-upload-actions">
                    <Button
                        variant="secondary"
                        onClick={removeFile}
                    >
                        Remove File
                    </Button>

                    <Button
                        onClick={() =>
                            alert("File selected successfully. Backend upload will be implemented later.")
                        }
                    >
                        Continue
                    </Button>
                </div>
            )}

        </div>
    );
}

export default ResumeUpload;
