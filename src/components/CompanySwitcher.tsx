import { useRef, useEffect } from 'react';
import { Company } from '../types/company.types';
import { Plus } from 'lucide-react';

interface CompanySwitcherProps {
    isOpen: boolean;
    onClose: () => void;
    companies: Company[];
    selectedCompanyId: string | null;
    onSelectCompany: (id: string) => void;
    onAddNew: () => void;
}

const CompanySwitcher = ({
    isOpen,
    onClose,
    companies,
    selectedCompanyId,
    onSelectCompany,
    onAddNew
}: CompanySwitcherProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
    const otherCompanies = companies.filter((c) => c.id !== selectedCompanyId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-12 left-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            {selectedCompany && (
                <div className="p-4 border-b border-gray-50 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold mb-3 text-lg">
                        {selectedCompany.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-gray-900">{selectedCompany.name}</h3>

                    <button className="mt-3 px-4 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                        Manage Your Account
                    </button>
                </div>
            )}

            <div className="p-2">
                <h4 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    More Account{otherCompanies.length !== 1 && 's'}
                </h4>

                <div className="space-y-1">
                    {otherCompanies.map((company) => (
                        <button
                            key={company.id}
                            onClick={() => {
                                onSelectCompany(company.id);
                                onClose();
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0 group-hover:bg-blue-200 transition-colors">
                                {company.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
                                {company.name}
                            </span>
                        </button>
                    ))}

                    {otherCompanies.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400 italic">
                            No other companies found
                        </div>
                    )}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-50">
                    <button
                        onClick={() => {
                            onAddNew();
                            onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-3 text-blue-600 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold">
                            Add new company
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanySwitcher;
