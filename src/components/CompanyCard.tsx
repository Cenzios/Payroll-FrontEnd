import { Company } from '../types/company.types';
import { Mail, Phone, MapPin, Edit2, Trash2 } from 'lucide-react';

interface CompanyCardProps {
    company: Company;
    onEdit?: (company: Company) => void;
    onDelete?: (companyId: number) => void;
}

const CompanyCard = ({ company, onEdit, onDelete }: CompanyCardProps) => {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                </div>
                <div className="flex gap-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(company)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit company"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(company.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete company"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{company.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{company.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{company.contactNumber}</span>
                </div>
            </div>

            {company.departments && company.departments.length > 0 && (
                <div>
                    <div className="text-xs text-gray-500 mb-2">Departments</div>
                    <div className="flex flex-wrap gap-2">
                        {company.departments.map((dept, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
                            >
                                {dept}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyCard;
