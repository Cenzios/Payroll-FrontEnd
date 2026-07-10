import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, Image as ImageIcon, File, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { useAppSelector } from '../store/hooks';

// Point react-pdf at the local pdfjs worker bundled via pdfjs-dist (avoids CDN/CORS issues)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

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
    const { token } = useAppSelector((state) => state.auth);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setActiveIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    useEffect(() => {
        let objectUrl: string | null = null;
        let isMounted = true;

        const activeDoc = docs && docs.length > 0 ? (docs[activeIndex] ?? docs[0]) : null;

        // Reset page/error state whenever the active document changes
        setNumPages(null);
        setPageNumber(1);
        setPdfError(null);

        if (isOpen && activeDoc && activeDoc.fileType === 'application/pdf') {
            const loadPdf = async () => {
                setPdfLoading(true);
                try {
                    const isExternal = activeDoc.fileUrl.includes('cloudinary.com');
                    const headers: Record<string, string> = {};
                    if (!isExternal && token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const response = await fetch(activeDoc.fileUrl, { headers });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const contentType = response.headers.get('content-type') || '';
                    const blob = await response.blob();

                    // Guard against the backend/dev-proxy returning HTML (e.g. index.html fallback)
                    // instead of the actual PDF bytes - this is a common cause of silent failures.
                    if (contentType.includes('text/html') || blob.type.includes('text/html')) {
                        throw new Error('Server returned HTML instead of a PDF file (check the file URL/route).');
                    }

                    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                    objectUrl = URL.createObjectURL(pdfBlob);
                    if (isMounted) {
                        setPdfBlobUrl(objectUrl);
                    }
                } catch (error: any) {
                    console.error('Failed to load PDF as blob', error);
                    if (isMounted) {
                        setPdfError(error?.message || 'Failed to load PDF.');
                    }
                } finally {
                    if (isMounted) {
                        setPdfLoading(false);
                    }
                }
            };
            loadPdf();
        } else {
            setPdfBlobUrl(null);
        }

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            setPdfBlobUrl(null);
        };
    }, [isOpen, activeIndex, docs, token]);

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

    const handleDownload = async () => {
        try {
            const isExternal = currentDoc.fileUrl.includes('cloudinary.com');
            const headers: Record<string, string> = {};
            if (!isExternal && token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(currentDoc.fileUrl, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = currentDoc.fileName || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error('Download failed, falling back to open in new tab', error);
            window.open(currentDoc.fileUrl, '_blank');
        }
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % allDocs.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + allDocs.length) % allDocs.length);
    };

    const handlePdfLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setPdfError(null);
    };

    const handlePdfLoadError = (error: Error) => {
        console.error('react-pdf failed to render document', error);
        setPdfError(error.message || 'Failed to render PDF.');
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
                        {isPDF && numPages && numPages > 1 && (
                            <div className="flex items-center gap-2 mr-2 bg-gray-50 rounded-xl px-3 py-2">
                                <button
                                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                                    disabled={pageNumber <= 1}
                                    className="p-1 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="text-xs font-bold text-gray-600 whitespace-nowrap">
                                    Page {pageNumber} / {numPages}
                                </span>
                                <button
                                    onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                                    disabled={pageNumber >= numPages}
                                    className="p-1 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        )}
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
                            pdfLoading ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                    <p className="text-gray-500 font-medium">Loading PDF...</p>
                                </div>
                            ) : pdfError ? (
                                <div className="flex flex-col items-center justify-center h-full text-red-500 font-medium bg-white w-full rounded-xl shadow-xl p-8 text-center">
                                    <p className="mb-1">Failed to load PDF.</p>
                                    <p className="text-xs text-gray-400 font-normal max-w-md">{pdfError}</p>
                                    <button
                                        onClick={(e) => handleTrialAction(e, handleDownload)}
                                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        Download Instead
                                    </button>
                                </div>
                            ) : pdfBlobUrl ? (
                                <div className="w-full h-full flex items-start justify-center overflow-auto rounded-xl border border-gray-200 shadow-xl bg-white">
                                    <Document
                                        file={pdfBlobUrl}
                                        onLoadSuccess={handlePdfLoadSuccess}
                                        onLoadError={handlePdfLoadError}
                                        loading={
                                            <div className="flex flex-col items-center justify-center h-full py-20">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                                                <p className="text-gray-500 text-sm">Rendering PDF...</p>
                                            </div>
                                        }
                                        error={
                                            <div className="flex flex-col items-center justify-center h-full py-20 text-red-500 font-medium">
                                                <p>Could not render this PDF.</p>
                                            </div>
                                        }
                                    >
                                        <Page
                                            pageNumber={pageNumber}
                                            renderAnnotationLayer={true}
                                            renderTextLayer={true}
                                            className="max-w-full"
                                        />
                                    </Document>
                                </div>
                            ) : null
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