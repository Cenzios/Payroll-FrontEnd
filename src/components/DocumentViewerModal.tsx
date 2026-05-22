import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, Image as ImageIcon, File, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrialStatus } from '../hooks/useTrialStatus';

interface DocItem {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    docTitle?: string;
}

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    docs: DocItem[] | null;
    initialIndex?: number;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, docs, initialIndex = 0 }) => {
    const { handleTrialAction } = useTrialStatus();
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setActiveIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    if (!isOpen) return null;

    const allDocs: DocItem[] = docs && docs.length > 0 ? docs : [];
    if (allDocs.length === 0) return null;

    const currentDoc = allDocs[activeIndex] ?? allDocs[0];
    const isImage = currentDoc.fileType?.startsWith('image/') ?? false;
    const isPDF = currentDoc.fileType === 'application/pdf';
    const hasMultiple = allDocs.length > 1;

    const getFileIcon = (fileType: string) => {
        if (fileType?.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
        if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const getIconColors = (fileType: string) => {
        if (fileType?.startsWith('image/')) return 'bg-blue-50 text-blue-500';
        if (fileType === 'application/pdf') return 'bg-red-50 text-red-500';
        return 'bg-gray-50 text-gray-500';
    };

    const handleDownload = () => {
        window.open(currentDoc.fileUrl, '_blank');
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % allDocs.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + allDocs.length) % allDocs.length);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[900px] animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isImage ? 'bg-blue-50 text-blue-500' : isPDF ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
                            {isImage ? <ImageIcon className="w-6 h-6" /> : isPDF ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                {currentDoc.docTitle || 'Loan Document'}
                            </h2>
                            <p className="text-sm font-medium text-gray-500 truncate max-w-[300px]">
                                {currentDoc.fileName}
                            </p>
                        </div>
                        {hasMultiple && (
                            <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                                {activeIndex + 1} / {allDocs.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {hasMultiple && (
                            <div className="flex items-center gap-1 mr-2">
                                <button
                                    onClick={handlePrev}
                                    disabled={activeIndex === 0}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={activeIndex === allDocs.length - 1}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        )}
                        <button
                            onClick={(e) => handleTrialAction(e, handleDownload)}
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

                {/* Main View Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    {hasMultiple && (
                        <div className="w-64 shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto py-4 px-2">
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-3 mb-3">
                                DOCUMENTS ({allDocs.length})
                            </p>
                            <div className="space-y-1">
                                {allDocs.map((d, i) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setActiveIndex(i)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all
                                            ${i === activeIndex
                                                ? 'bg-white shadow-md border border-gray-100 text-gray-900'
                                                : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-700'}`}
                                    >
                                        <div className={`p-2 rounded-xl shrink-0 ${getIconColors(d.fileType)}`}>
                                            {getFileIcon(d.fileType)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold truncate leading-tight">{d.docTitle || `Document ${i + 1}`}</p>
                                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{d.fileName}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Display */}
                    <div className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center relative min-h-0">
                        {isImage ? (
                            <img
                                src={currentDoc.fileUrl}
                                alt={currentDoc.fileName}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white"
                            />
                        ) : isPDF ? (
                            <iframe
                                src={`${currentDoc.fileUrl}#toolbar=0`}
                                className="w-full h-full rounded-xl border border-gray-200 shadow-xl bg-white"
                                title="PDF Viewer"
                            />
                        ) : (
                            <div className="text-center py-20 px-10 bg-white rounded-[32px] shadow-xl border border-gray-100 max-w-md w-full">
                                <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <File className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Preview Unavailable</h3>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    This file type ({currentDoc.fileType}) cannot be previewed.
                                    Please download it to view the content.
                                </p>
                                <button
                                    onClick={(e) => handleTrialAction(e, handleDownload)}
                                    className="inline-flex items-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Download & Open
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all active:scale-95"
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
