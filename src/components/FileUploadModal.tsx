import React, { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { UploadCloud, FileText, FileImage, File, Trash2, Loader2 } from "lucide-react";

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: File[];
    onFilesChange: (files: File[]) => void;
    fileTitles?: Record<number, string>;
    onTitlesChange?: (titles: Record<number, string>) => void;
    onUpload?: () => void;
    isUploading?: boolean;
    maxFiles?: number;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    files,
    onFilesChange,
    fileTitles = {},
    onTitlesChange,
    onUpload,
    isUploading = false,
    maxFiles = 3,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ Centralized submit logic
    const handleSubmit = () => {
        const allTitlesEntered = files.length > 0 && files.every((_, idx) => fileTitles[idx] && fileTitles[idx].trim() !== "");
        if (!isUploading && allTitlesEntered) {
            onUpload?.();
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFiles = (newFiles: File[]) => {
        const remaining = maxFiles - files.length;
        if (remaining <= 0) {
            alert(`You can only upload a maximum of ${maxFiles} documents per employee.`);
            return [];
        }

        let acceptedCount = 0;
        const valid = newFiles.filter(file => {
            if (acceptedCount >= remaining) return false;

            const isValidType = ['image/png', 'image/jpeg', 'application/pdf'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024;

            if (!isValidType) alert(`File ${file.name} is not a supported format.`);
            if (!isValidSize) alert(`File ${file.name} exceeds 5MB limit.`);

            if (isValidType && isValidSize) {
                acceptedCount++;
                return true;
            }
            return false;
        });

        if (newFiles.length > remaining) {
            alert(`Only the first ${remaining} valid file(s) were added. The limit is ${maxFiles} total.`);
        }

        return valid;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = validateFiles(droppedFiles);
        if (validFiles.length > 0) {
            onFilesChange([...files, ...validFiles]);
        }
    }, [files, onFilesChange, maxFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const validFiles = validateFiles(selectedFiles);
            if (validFiles.length > 0) {
                onFilesChange([...files, ...validFiles]);
            }
        }
    };

    const removeFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index));
        if (onTitlesChange) {
            const newTitles = { ...fileTitles };
            delete newTitles[index];
            const reindexedTitles: Record<number, string> = {};
            let newIdx = 0;
            for (let i = 0; i < files.length; i++) {
                if (i !== index) {
                    if (newTitles[i]) reindexedTitles[newIdx] = newTitles[i];
                    newIdx++;
                }
            }
            onTitlesChange(reindexedTitles);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
        if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
            onClick={onClose}
        >
            {/* ✅ onSubmit + onKeyDown both call handleSubmit */}
            <form
                className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 outline-none"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                }}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-center items-center bg-white border-b border-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Supporting Documents</h2>
                </div>

                <div className="p-8 space-y-6 bg-white">
                    {/* Dropzone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'}`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".png,.jpg,.jpeg,.pdf"
                            multiple
                            className="hidden"
                        />
                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center shadow-sm">
                            <UploadCloud className="w-7 h-7 text-blue-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-[15px] font-semibold text-gray-900">Click to upload or drag and drop</p>
                            <p className="text-[13px] text-gray-400 mt-1">Total Limit: {maxFiles} documents (PDF, JPG, PNG)</p>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                        {files.length > 0 ? (
                            files.map((file, idx) => (
                                <div key={idx} className="group flex items-center gap-4 p-4 border border-gray-100 rounded-[20px] bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                        {getFileIcon(file.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Document Title</p>
                                                <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{file.name}</p>
                                            </div>
                                            <input
                                                type="text"
                                                value={fileTitles[idx] || ""}
                                                onChange={(e) => {
                                                    if (onTitlesChange) {
                                                        onTitlesChange({
                                                            ...fileTitles,
                                                            [idx]: e.target.value
                                                        });
                                                    }
                                                }}
                                                placeholder="e.g. NIC Front, Contract, etc."
                                                className="w-full text-sm font-semibold text-gray-900 bg-gray-50 hover:bg-blue-50/50 focus:bg-blue-50 border border-gray-100 focus:border-blue-200 rounded-xl px-3 py-2 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Remove file"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-4 text-center text-sm text-gray-400 italic">No files selected</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 flex gap-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 text-[14px] font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isUploading || files.length === 0 || !files.every((_, idx) => fileTitles[idx] && fileTitles[idx].trim() !== "")}
                        title={!files.every((_, idx) => fileTitles[idx] && fileTitles[idx].trim() !== "") ? 'Please enter a title for all documents' : ''}
                        className="flex-[1.5] py-3.5 px-8 text-[14px] font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:grayscale-[0.5] flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload Documents'
                        )}
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
};

export default FileUploadModal;