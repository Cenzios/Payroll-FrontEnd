import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, Image as ImageIcon, File, ExternalLink, ArrowLeft, ArrowRight } from 'lucide-react';
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
    docs: {
        id: string;
        fileName: string;
        fileUrl: string;
        fileType: string;
        docTitle?: string;
    }[] | null;
    initialIndex?: number;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, docs, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
    const { handleTrialAction } = useTrialStatus();
    const [activeIndex, setActiveIndex] = useState(0);

    if (!isOpen) return null;

    const allDocs: DocItem[] = docs && docs.length > 0 ? docs : doc ? [doc] : [];
    if (allDocs.length === 0) return null;

    const currentDoc = allDocs[activeIndex] ?? allDocs[0];
    const isImage = currentDoc.fileType?.startsWith('image/');
    const isPDF = currentDoc.fileType === 'application/pdf';
    const hasMultiple = allDocs.length > 1;

    React.useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    if (!isOpen || !docs || docs.length === 0) return null;

    const doc = docs[currentIndex];

    const isImage = doc.fileType?.startsWith('image/') ?? false;
    const isPDF = doc.fileType === 'application/pdf';

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

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % docs.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + docs.length) % docs.length);
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
                                {/* {doc.docTitle || 'Loan Document'} */}
                                {currentDoc.docTitle || 'Loan Document'}
                            </h2>
                            <p className="text-sm font-medium text-gray-500 truncate max-w-[300px]">
                                {/* {doc.fileName} */}
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
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                                    disabled={activeIndex === 0}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => setActiveIndex(i => Math.min(allDocs.length - 1, i + 1))}
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

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[400px] relative group/viewer">
                    {/* Navigation Buttons - Only show if multiple docs */}
                    {docs.length > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-4 z-10 p-4 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg border border-gray-100 transition-all active:scale-90 opacity-0 group-hover/viewer:opacity-100"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 z-10 p-4 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg border border-gray-100 transition-all active:scale-90 opacity-0 group-hover/viewer:opacity-100"
                            >
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {isImage ? (
                        <div className="relative group">
                            <img
                                src={doc.fileUrl}
                                alt={doc.fileName}
                                className="max-w-full h-auto rounded-xl shadow-lg border border-gray-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-bold">
                                    Document {currentIndex + 1} of {docs.length}
                                </div>
                            </div>
                        </div>
                    ) : isPDF ? (
                        <div className="w-full h-full flex flex-col gap-4">
                            <iframe
                                src={`${doc.fileUrl}#toolbar=0`}
                                className="w-full h-[600px] rounded-xl border border-gray-200 shadow-md bg-white"
                                title="PDF Viewer"
                            />
                            {docs.length > 1 && (
                                <div className="text-center text-sm font-bold text-gray-500">
                                    Document {currentIndex + 1} of {docs.length}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 px-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <File className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Preview Not Available</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                {doc.fileName}
                            </p>
                            <p className="text-gray-400 text-xs mb-8">
                                Document {currentIndex + 1} of {docs.length}
                            </p>
                            <button
                                onClick={(e) => handleTrialAction(e, handleDownload)}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open File
                            </button>
                        </div>
                    )}
                </div> */}

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {hasMultiple && (
                        <div className="w-56 shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto py-3 px-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                                Documents ({allDocs.length})
                            </p>
                            {allDocs.map((d, i) => (
                                <button
                                    key={d.id}
                                    onClick={() => setActiveIndex(i)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5
                        ${i === activeIndex
                                            ? 'bg-white shadow-sm border border-gray-100 text-gray-900'
                                            : 'hover:bg-white/70 text-gray-500'}`}
                                >
                                    <div className={`p-1.5 rounded-lg shrink-0 ${getIconColors(d.fileType)}`}>
                                        {getFileIcon(d.fileType)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-semibold truncate">{d.docTitle || `Document ${i + 1}`}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{d.fileName}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-auto bg-gray-50 p-6 flex items-center justify-center min-h-[400px]">
                        {isImage ? (
                            <div className="relative group">
                                <img
                                    src={currentDoc.fileUrl}
                                    alt={currentDoc.fileName}
                                    className="max-w-full h-auto rounded-xl shadow-lg border border-gray-200"
                                />
                            </div>
                        ) : isPDF ? (
                            <iframe
                                src={`${currentDoc.fileUrl}#toolbar=0`}
                                className="w-full h-full min-h-[400px] rounded-xl border border-gray-200 shadow-md bg-white"
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
                                    onClick={(e) => handleTrialAction(e, handleDownload)}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open File
                                </button>
                            </div>
                        )}
                    </div>
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
