import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CompanyCard from '../components/CompanyCard';
import UniversalDrawer from '../components/UniversalDrawer';
import Toast from '../components/Toast';
import { Company, CreateCompanyRequest } from '../types/company.types';
import { useGetCompaniesQuery, useCreateCompanyMutation, useUpdateCompanyMutation } from '../store/apiSlice';
import TableSkeleton from '../components/skeletons/TableSkeleton';

const Companies = () => {
    const navigate = useNavigate();
    const { data: companies = [], isLoading, isError, error } = useGetCompaniesQuery();
    const [createCompany] = useCreateCompanyMutation();
    const [updateCompany] = useUpdateCompanyMutation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    // null → the drawer adds a company; a company → the drawer edits it
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Redirect on 401 error
    useEffect(() => {
        if (isError && error) {
            const err = error as any;
            if (err?.status === 401 || err?.data?.message?.includes('unauthorized')) {
                navigate('/login');
            } else {
                setToast({ message: err?.data?.message || 'Failed to fetch companies', type: 'error' });
            }
        }
    }, [isError, error, navigate]);

    const openAddDrawer = (): void => {
        setEditingCompany(null);
        setIsDrawerOpen(true);
    };

    const closeDrawer = (): void => {
        setIsDrawerOpen(false);
        setEditingCompany(null);
    };

    const handleSubmitCompany = async (data: CreateCompanyRequest): Promise<void> => {
        const isEdit = editingCompany !== null;
        try {
            if (editingCompany) {
                await updateCompany({ id: editingCompany.id, data }).unwrap();
            } else {
                await createCompany(data).unwrap();
            }
            setToast({ message: isEdit ? 'Company updated successfully!' : 'Company created successfully!', type: 'success' });
            closeDrawer();
            // Cache invalidation handles refresh
        } catch (error: any) {
            const fallback = isEdit ? 'Failed to update company' : 'Failed to create company';
            setToast({ message: error?.data?.message || fallback, type: 'error' });
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
                            <h1 className="text-[28px] font-semibold text-gray-900 leading-tight">Companies</h1>
                            <p className="text-[15px] font-normal text-gray-500 mt-0.5 leading-[1.7]">
                                Manage your registered companies
                            </p>
                        </div>
                        <button
                            onClick={openAddDrawer}
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
                        <TableSkeleton rows={3} />
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
                                onClick={openAddDrawer}
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
                                    onEdit={(selected) => {
                                        setEditingCompany(selected);
                                        setIsDrawerOpen(true);
                                    }}
                                    // No company delete endpoint exists in the API, so no Delete action is offered
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Company Drawer */}
            <UniversalDrawer
                isOpen={isDrawerOpen}
                onClose={closeDrawer}
                onSubmit={handleSubmitCompany}
                mode="company"
                initialData={editingCompany ?? undefined}
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
