import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateUser } from '../../store/slices/authSlice';
import { updateProfile, changePassword } from '../../api/authApi';
import { companyApi } from '../../api/companyApi';
import { useGetSubscriptionQuery } from '../../store/apiSlice';
import { User, Building2, Loader2, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight, Edit2 } from 'lucide-react';

const AccountTab = () => {
    const dispatch = useAppDispatch();
    const { user, selectedCompanyId } = useAppSelector((state) => state.auth);
    const [companies, setCompanies] = useState<any[]>([]);

    // Subscription for employee usage
    const { data: subscription } = useGetSubscriptionQuery();

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

    // Validation
    const phoneRegex = /^\+94\d{9}$/;

    const validatePersonal = (field: string, value: string) => {
        if (field === 'fullName') {
            if (!value.trim()) return 'Full name is required';
            if (value.trim().length < 3 || value.trim().length > 20) return 'Name must be between 3 and 20 characters';
        }
        return '';
    };

    const validateCompany = (field: string, value: string) => {
        switch (field) {
            case 'name':
                if (!value.trim()) return 'Company name is required';
                if (value.trim().length < 3 || value.trim().length > 30) return 'Name must be between 3 and 30 characters';
                break;
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!/^(?!.*\.\.)[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}$/.test(value)) return 'Invalid email format';
                break;
            case 'contactNumber':
                if (!value.trim()) return 'Contact number is required';
                if (!phoneRegex.test(value)) return 'Must be +94 format';
                break;
            case 'address': if (!value.trim()) return 'Address is required'; break;
        }
        return '';
    };

    const handleSavePersonal = async () => {
        const error = validatePersonal('fullName', personalData.fullName);
        if (error) { setPersonalErrors({ fullName: error }); return; }
        setIsSavingPersonal(true);
        try {
            const response = await updateProfile({ fullName: personalData.fullName });
            if (response.data) dispatch(updateUser(response.data));
            setIsEditingPersonal(false);
        } catch (err: any) {
            setPersonalErrors({ fullName: err.message || 'Failed to update' });
        } finally { setIsSavingPersonal(false); }
    };

    const handleSaveCompany = async () => {
        if (!selectedCompany?.id) return;
        const errors: Record<string, string> = {};
        Object.keys(companyData).forEach(key => {
            const err = validateCompany(key, (companyData as any)[key]);
            if (err) errors[key] = err;
        });
        if (Object.keys(errors).length > 0) { setCompanyErrors(errors); return; }
        setIsSavingCompany(true);
        try {
            await companyApi.updateCompanyProfile(selectedCompany.id, companyData);
            setIsEditingCompany(false);
        } catch (err: any) {
            setCompanyErrors({ name: err.message || 'Failed to update' });
        } finally { setIsSavingCompany(false); }
    };

    const handleSavePassword = async () => {
        const errors: Record<string, string> = {};
        if (!passwordData.currentPassword) errors.currentPassword = 'Required';
        if (passwordData.newPassword.length < 6) errors.newPassword = 'At least 6 characters';
        if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
        if (Object.keys(errors).length > 0) { setPasswordErrors(errors); return; }
        setIsSavingPassword(true);
        try {
            await changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Password changed successfully');
        } catch (err: any) {
            setPasswordErrors({ currentPassword: err.message || 'Failed to change password' });
        } finally { setIsSavingPassword(false); }
    };

    // Input field style helper
    const inputClasses = (hasError: boolean, isDisabled: boolean) =>
        `w-full pl-10 pr-4 py-2.5 rounded-full transition-all border outline-none text-[13px] ${hasError ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'
        } ${isDisabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white'}`;

    return (
        <div className="space-y-0">
            {/* Employee Usage Section */}
            <section className="py-6 border-b border-gray-200">
                <div className="px-2">
                    <h3 className="text-[14px] font-semibold text-gray-900 mb-2">Employee Usage</h3>
                    <p className="text-[13px] text-gray-600">
                        {subscription
                            ? `${subscription.usedEmployees} of ${subscription.totalAllowedEmployees} employees used`
                            : '0 of 0 employees used'}
                    </p>
                    <p className="text-[13px] text-gray-500 mb-3">
                        {subscription
                            ? `${subscription.totalAllowedEmployees - subscription.usedEmployees} slots remaining`
                            : '0 slots remaining'}
                    </p>
                    <button className="text-blue-600 text-[13px] font-medium flex items-center gap-1 hover:text-blue-700 transition-colors">
                        Upgrade plan <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Personal Info Section */}
            <section className="py-8 border-b border-gray-200">
                <div className="flex gap-8">
                    {/* Left Description */}
                    <div className="w-[200px] shrink-0 px-2">
                        <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Personal Info</h3>
                        <p className="text-[12px] text-gray-500 leading-relaxed">You can change your personal information settings here.</p>
                    </div>
                    {/* Right Content */}
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Full Name</label>
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
                                        placeholder="Alex Morgan"
                                        className={inputClasses(!!personalErrors.fullName, !isEditingPersonal)}
                                    />
                                </div>
                                {personalErrors.fullName && <p className="text-xs text-red-500 mt-1">{personalErrors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="email"
                                        value={personalData.email}
                                        disabled
                                        placeholder="alexmorgan@gmail.com"
                                        className={inputClasses(false, true)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            {!isEditingPersonal ? (
                                <button
                                    onClick={() => setIsEditingPersonal(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white text-[12px] font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                                >
                                    Edit Details <Edit2 className="h-3.5 w-3.5" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingPersonal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 text-[12px] rounded-lg font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePersonal}
                                        disabled={isSavingPersonal}
                                        className="flex items-center gap-2 bg-blue-600 text-white text-[12px] px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                                    >
                                        {isSavingPersonal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Company Info Section */}
            <section className="py-8 border-b border-gray-200">
                <div className="flex gap-8">
                    {/* Left Description */}
                    <div className="w-[200px] shrink-0 px-2">
                        <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Company Info</h3>
                        <p className="text-[12px] text-gray-500 leading-relaxed">You can change your company details here.</p>
                    </div>
                    {/* Right Content */}
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Company Name</label>
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
                                        placeholder="ABC Solutions"
                                        className={inputClasses(!!companyErrors.name, !isEditingCompany)}
                                    />
                                </div>
                                {companyErrors.name && <p className="text-xs text-red-500 mt-1">{companyErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Company Email Address</label>
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
                                        placeholder="abcsolutions@yahoo.com"
                                        className={inputClasses(!!companyErrors.email, !isEditingCompany)}
                                    />
                                </div>
                                {companyErrors.email && <p className="text-xs text-red-500 mt-1">{companyErrors.email}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Company Phone Number</label>
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
                                        placeholder="+94 771457855"
                                        className={inputClasses(!!companyErrors.contactNumber, !isEditingCompany)}
                                    />
                                </div>
                                {companyErrors.contactNumber && <p className="text-xs text-red-500 mt-1">{companyErrors.contactNumber}</p>}
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Company Address</label>
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
                                        placeholder="No. 9/2, Beach Road, Negombo"
                                        className={inputClasses(!!companyErrors.address, !isEditingCompany)}
                                    />
                                </div>
                                {companyErrors.address && <p className="text-xs text-red-500 mt-1">{companyErrors.address}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            {!isEditingCompany ? (
                                <button
                                    onClick={() => setIsEditingCompany(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white text-[12px] font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                                >
                                    Edit Details <Edit2 className="h-3.5 w-3.5" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditingCompany(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 text-[12px] rounded-lg font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveCompany}
                                        disabled={isSavingCompany}
                                        className="flex items-center gap-2 bg-blue-600 text-white text-[12px] px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                                    >
                                        {isSavingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Change Password Section */}
            <section className="py-8">
                <div className="flex gap-8">
                    {/* Left Description */}
                    <div className="w-[200px] shrink-0 px-2">
                        <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Change Password</h3>
                        <p className="text-[12px] text-gray-500 leading-relaxed">Update your password to keep your account secure.</p>
                    </div>
                    {/* Right Content */}
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Current Password</label>
                                <div className="relative max-w-sm">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock className="h-4 w-4" />
                                    </span>
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="Enter Current Password"
                                        className={`w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all text-[13px] ${passwordErrors.currentPassword ? 'border-red-400' : ''
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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">New Password</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock className="h-4 w-4" />
                                    </span>
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="Enter New Password"
                                        className={`w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all text-[13px] ${passwordErrors.newPassword ? 'border-red-400' : ''
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
                                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock className="h-4 w-4" />
                                    </span>
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Confirm New Password"
                                        className={`w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all text-[13px] ${passwordErrors.confirmPassword ? 'border-red-400' : ''
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
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-[12px] font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isSavingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AccountTab;
