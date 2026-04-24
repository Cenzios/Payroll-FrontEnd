import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, Image as ImageIcon, File, ExternalLink } from 'lucide-react';

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    doc: {
        id: string;
        fileName: string;
        fileUrl: string;
        fileType: string;
        docTitle?: string;
    } | null;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, doc }) => {
    if (!isOpen || !doc) return null;

    const isImage = doc.fileType.startsWith('image/');
    const isPDF = doc.fileType === 'application/pdf';

    const handleDownload = () => {
        window.open(doc.fileUrl, '_blank');
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isImage ? 'bg-blue-50 text-blue-500' : isPDF ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
                            {isImage ? <ImageIcon className="w-6 h-6" /> : isPDF ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                {doc.docTitle || 'Loan Document'}
                            </h2>
                            <p className="text-sm font-medium text-gray-500 truncate max-w-[300px]">
                                {doc.fileName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6 flex items-center justify-center min-h-[400px]">
                    {isImage ? (
                        <div className="relative group">
                            <img
                                src={doc.fileUrl}
                                alt={doc.fileName}
                                className="max-w-full h-auto rounded-xl shadow-lg border border-gray-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-bold">
                                    Document Preview
                                </div>
                            </div>
                        </div>
                    ) : isPDF ? (
                        <iframe
                            src={`${doc.fileUrl}#toolbar=0`}
                            className="w-full h-[600px] rounded-xl border border-gray-200 shadow-md bg-white"
                            title="PDF Viewer"
                        />
                    ) : (
                        <div className="text-center py-20 px-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <File className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Preview Not Available</h3>
                            <p className="text-gray-500 text-sm mb-8">
                                This file type cannot be previewed directly. Please download the file to view its content.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open File
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DocumentViewerModal;
