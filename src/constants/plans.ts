// ✅ Single Source of Truth for All Plans
export const PLAN_IDS = {
    BASIC: "0f022c11-2a3c-49f5-9d11-30082882a8e9",
    PROFESSIONAL: "3a9f7d42-5b6a-4d6b-b3d2-9b4d6d5a1c21",
    ENTERPRISE: "9e1c4b2a-8d7f-4b9a-a5c2-2c3f4d6e7b88",
};

export interface Plan {
    id: string;
    name: string;
    price: number; // For compatibility (mapped from employeePrice in API)
    employeePrice: number;
    registrationFee: number;
    description: string;
    features: string[];
}

export const PLANS: Record<string, Plan> = {
    BASIC: {
        id: PLAN_IDS.BASIC,
        name: "BASIC",
        price: 200,
        employeePrice: 200,
        registrationFee: 2500,
        description: "",
        features: [
            'Payroll processing for up to 0-29 employees',
            'Automatic salary & deduction calculations',
            'Monthly payslip generation (PDF / CSV / Excel)',
            'Employee profile management',
            'Manage multiple company',
            'Payroll report generations',
            'Secure dashboard for administrators',
        ],
    },
    PROFESSIONAL: {
        id: PLAN_IDS.PROFESSIONAL,
        name: "Professional",
        price: 175,
        employeePrice: 175,
        registrationFee: 5000,
        description: "Get essential payroll features with basic plan. Pay only a one-time Rs. 5,000 registration fee in the first month. From the second month, your subscription is based on the number of employees—simple, flexible, and affordable.",
        features: [
            'Payroll processing for 30-99 employees',
            'Automatic salary & deduction calculations',
            'Monthly payslip generation (PDF / CSV / Excel)',
            'Employee profile management',
            'Manage multiple company',
            'Payroll report generations',
            'Secure dashboard for administrators',
        ],
    },
    ENTERPRISE: {
        id: PLAN_IDS.ENTERPRISE,
        name: "Enterprise",
        price: 250,
        employeePrice: 250,
        registrationFee: 7500,
        description: "Get essential payroll features with basic plan. Pay only a one-time Rs. 7,500 registration fee in the first month. From the second month, your subscription is based on the number of employees—simple, flexible, and affordable.",
        features: [
            'Payroll processing for 100 or more employees',
            'Automatic salary & deduction calculations',
            'Monthly payslip generation (PDF / CSV / Excel)',
            'Employee profile management',
            'Manage multiple company',
            'Payroll report generations',
            'Secure dashboard for administrators',
        ],
    },
};

// Helper function to get plan by ID
export const getPlanById = (planId: string): Plan | undefined => {
    return Object.values(PLANS).find(plan => plan.id === planId);
};

// Helper function to get all plans as array
export const getAllPlans = (): Plan[] => {
    return Object.values(PLANS);
};
