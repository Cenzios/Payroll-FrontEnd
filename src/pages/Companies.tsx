import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CompanyCard from '../components/CompanyCard';
import UniversalDrawer from '../components/UniversalDrawer';
import Toast from '../components/Toast';
import { companyApi } from '../api/companyApi';
import { Company, CreateCompanyRequest } from '../types/company.types';

const Companies = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchCompanies = async () => {
        try {
            setIsLoading(true);
            const data = await companyApi.getCompanies();
            setCompanies(data);
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to fetch companies', type: 'error' });
            // If unauthorized, redirect to login
            if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleAddCompany = async (data: CreateCompanyRequest) => {
        try {
            await companyApi.createCompany(data);
            setToast({ message: 'Company created successfully!', type: 'success' });
            setIsDrawerOpen(false);
            // Refresh company list
            fetchCompanies();
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to create company', type: 'error' });
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-64">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-8 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage your registered companies
                            </p>
                        </div>
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Company
                        </button>
                    </div>
                </header>

                {/* Companies Content */}
                <main className="p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <Building2 className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No companies yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Get started by adding your first company
                            </p>
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Add Your First Company
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {companies.map((company) => (
                                <CompanyCard
                                    key={company.id}
                                    company={company}
                                    onEdit={(company) => {
                                        // TODO: Implement edit functionality
                                        console.log('Edit company:', company);
                                    }}
                                    onDelete={(companyId) => {
                                        // TODO: Implement delete functionality
                                        console.log('Delete company:', companyId);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Company Drawer */}
            <UniversalDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSubmit={handleAddCompany}
                mode="company"
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default Companies;
