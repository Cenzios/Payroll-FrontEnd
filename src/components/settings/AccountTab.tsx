import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateUser } from '../../store/slices/authSlice';
import { updateProfile, changePassword } from '../../api/authApi';
import { companyApi } from '../../api/companyApi';
import { User, Shield, Building2, Save, Edit2, Loader2, Mail, Phone, MapPin, Lock, Eye, EyeOff } from 'lucide-react';

const AccountTab = () => {
    const dispatch = useAppDispatch();
    const { user, selectedCompanyId } = useAppSelector((state) => state.auth);
    const [companies, setCompanies] = useState<any[]>([]);

    // Personal Info State
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [personalData, setPersonalData] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
    const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);

    // Company Info State
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [companyData, setCompanyData] = useState({
        name: '',
        email: '',
        contactNumber: '',
        address: ''
    });
    const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});
    const [isSavingCompany, setIsSavingCompany] = useState(false);

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    // Derived State
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const data = await companyApi.getCompanies();
                setCompanies(data);
            } catch (err) {
                console.error('Failed to fetch companies');
            }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (user) setPersonalData({ fullName: user.fullName, email: user.email });
    }, [user]);

    useEffect(() => {
        if (selectedCompany) {
            setCompanyData({
                name: selectedCompany.name,
                email: selectedCompany.email,
                contactNumber: selectedCompany.contactNumber,
                address: selectedCompany.address
            });
        }
    }, [selectedCompany]);

    // Validation Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+94\d{9}$/;

    const validatePersonal = (field: string, value: string) => {
        let error = '';
        if (field === 'fullName') {
            if (!value.trim()) error = 'Full name is required';
            else if (value.trim().length < 2) error = 'Name too short';
        }
        return error;
    };

    const validateCompany = (field: string, value: string) => {
        let error = '';
        switch (field) {
            case 'name': if (!value.trim()) error = 'Company name is required'; break;
            case 'email':
                if (!value.trim()) error = 'Email is required';
                else if (!emailRegex.test(value)) error = 'Invalid email format';
                break;
            case 'contactNumber':
                if (!value.trim()) error = 'Contact number is required';
                else if (!phoneRegex.test(value)) error = 'Must be +94 format';
                break;
            case 'address': if (!value.trim()) error = 'Address is required'; break;
        }
        return error;
    };

    const handleSavePersonal = async () => {
        const error = validatePersonal('fullName', personalData.fullName);
        if (error) {
            setPersonalErrors({ fullName: error });
            return;
        }
        setIsSavingPersonal(true);
        try {
            const response = await updateProfile({ fullName: personalData.fullName });
            // response.data should contain the updated user since sendResponse(res, 200, true, '...', result)
            // result is the updated user object
            if (response.data) {
                dispatch(updateUser(response.data));
            }
            setIsEditingPersonal(false);
        } catch (err: any) {
            setPersonalErrors({ fullName: err.message || 'Failed to update' });
        } finally {
            setIsSavingPersonal(false);
        }
    };

    const handleSaveCompany = async () => {
        if (!selectedCompany?.id) return;
        const errors: any = {};
        Object.keys(companyData).forEach(key => {
            const err = validateCompany(key, (companyData as any)[key]);
            if (err) errors[key] = err;
        });
        if (Object.keys(errors).length > 0) {
            setCompanyErrors(errors);
            return;
        }
        setIsSavingCompany(true);
        try {
            await companyApi.updateCompanyProfile(selectedCompany.id, companyData);
            setIsEditingCompany(false);
        } catch (err: any) {
            setCompanyErrors({ name: err.message || 'Failed to update' });
        } finally {
            setIsSavingCompany(false);
        }
    };

    const handleSavePassword = async () => {
        const errors: any = {};
        if (!passwordData.currentPassword) errors.currentPassword = 'Required';
        if (passwordData.newPassword.length < 6) errors.newPassword = 'At least 6 characters';
        if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        setIsSavingPassword(true);
        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Password changed successfully');
        } catch (err: any) {
            setPasswordErrors({ currentPassword: err.message || 'Failed to change password' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Personal Info */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Personal Info
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Manage your basic account details</p>
                    </div>
                    {!isEditingPersonal ? (
                        <button
                            onClick={() => setIsEditingPersonal(true)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
                        >
                            <Edit2 className="h-4 w-4" /> Edit Details
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditingPersonal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePersonal}
                                disabled={isSavingPersonal}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {isSavingPersonal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <User className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                value={personalData.fullName}
                                disabled={!isEditingPersonal}
                                onChange={(e) => {
                                    setPersonalData({ ...personalData, fullName: e.target.value });
                                    setPersonalErrors({ ...personalErrors, fullName: validatePersonal('fullName', e.target.value) });
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all border outline-none ${personalErrors.fullName ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                                    } ${!isEditingPersonal ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white'}`}
                            />
                        </div>
                        {personalErrors.fullName && <p className="text-xs text-red-500 mt-1">{personalErrors.fullName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail className="h-4 w-4" />
                            </span>
                            <input
                                type="email"
                                value={personalData.email}
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-transparent bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed currently</p>
                    </div>
                </div>
            </section>

            {/* Company Info */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Company Info
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Details for {selectedCompany?.name || 'Selected Company'}</p>
                    </div>
                    {!isEditingCompany ? (
                        <button
                            onClick={() => setIsEditingCompany(true)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
                        >
                            <Edit2 className="h-4 w-4" /> Edit Details
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditingCompany(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCompany}
                                disabled={isSavingCompany}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {isSavingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Building2 className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                value={companyData.name}
                                disabled={!isEditingCompany}
                                onChange={(e) => {
                                    setCompanyData({ ...companyData, name: e.target.value });
                                    setCompanyErrors({ ...companyErrors, name: validateCompany('name', e.target.value) });
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all border outline-none ${companyErrors.name ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                                    } ${!isEditingCompany ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white'}`}
                            />
                        </div>
                        {companyErrors.name && <p className="text-xs text-red-500 mt-1">{companyErrors.name}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail className="h-4 w-4" />
                            </span>
                            <input
                                type="email"
                                value={companyData.email}
                                disabled={!isEditingCompany}
                                onChange={(e) => {
                                    setCompanyData({ ...companyData, email: e.target.value });
                                    setCompanyErrors({ ...companyErrors, email: validateCompany('email', e.target.value) });
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all border outline-none ${companyErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                                    } ${!isEditingCompany ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white'}`}
                            />
                        </div>
                        {companyErrors.email && <p className="text-xs text-red-500 mt-1">{companyErrors.email}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Phone className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                value={companyData.contactNumber}
                                disabled={!isEditingCompany}
                                onChange={(e) => {
                                    setCompanyData({ ...companyData, contactNumber: e.target.value });
                                    setCompanyErrors({ ...companyErrors, contactNumber: validateCompany('contactNumber', e.target.value) });
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all border outline-none ${companyErrors.contactNumber ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                                    } ${!isEditingCompany ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white'}`}
                            />
                        </div>
                        {companyErrors.contactNumber && <p className="text-xs text-red-500 mt-1">{companyErrors.contactNumber}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <MapPin className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                value={companyData.address}
                                disabled={!isEditingCompany}
                                onChange={(e) => {
                                    setCompanyData({ ...companyData, address: e.target.value });
                                    setCompanyErrors({ ...companyErrors, address: validateCompany('address', e.target.value) });
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all border outline-none ${companyErrors.address ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
                                    } ${!isEditingCompany ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-transparent' : 'bg-white'}`}
                            />
                        </div>
                        {companyErrors.address && <p className="text-xs text-red-500 mt-1">{companyErrors.address}</p>}
                    </div>
                </div>
            </section>

            {/* Change Password */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Security
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock className="h-4 w-4" />
                            </span>
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all ${passwordErrors.currentPassword ? 'border-red-500' : ''
                                    }`}
                            />
                            <button
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock className="h-4 w-4" />
                            </span>
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all ${passwordErrors.newPassword ? 'border-red-500' : ''
                                    }`}
                            />
                            <button
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock className="h-4 w-4" />
                            </span>
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all ${passwordErrors.confirmPassword ? 'border-red-500' : ''
                                    }`}
                            />
                            <button
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSavePassword}
                        disabled={isSavingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default AccountTab;
