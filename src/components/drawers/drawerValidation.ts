// Validation logic extracted from UniversalDrawer for both company and employee forms

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+94\s?\d{9}$/;
const employeePhoneRegex = /^(\+94\d{9}|0\d{9})$/;

export const validateCompanyField = (field: string, value: any): string => {
    let error = "";
    switch (field) {
        case "name":
            if (!value || value.trim().length < 3 || value.trim().length > 30)
                error = "Name must be between 3 and 30 characters";
            break;
        case "email": {
            const email = value?.trim();
            if (!value)
                error = "Email is required";
            else if (email.length > 100)
                error = "Email must be less than 100 characters";
            else if (value && value.trim() && !emailRegex.test(value.trim()))
                error = "Invalid email format";
            else if (email.includes(".."))
                error = "Email cannot contain consecutive dots";
            else if (email.startsWith(".") || email.endsWith("."))
                error = "Email cannot start or end with a dot";
            else if (email.split("@")[1]?.startsWith("-") || email.split("@")[1]?.endsWith("-"))
                error = "Invalid domain format";
            break;
        }
        case "contactNumber":
            if (!value) error = "Contact number is required";
            else if (!phoneRegex.test(value))
                error = "Must be +94 followed by 9 digits";
            break;
        case "address":
            if (!value || !value.trim()) error = "Address is required";
            break;
    }
    return error;
};

export const validateEmployeeField = (
    field: string,
    value: any,
    context?: { epfEnabled?: boolean; epfEtf?: string; basicSalary?: number; salaryType?: string }
): string => {
    let error = "";
    const { epfEnabled, epfEtf, basicSalary, salaryType } = context || {};

    switch (field) {
        case "fullName":
            if (!value || value.trim().length < 3 || value.trim().length > 50)
                error = "Name must be between 3 and 50 characters";
            else if (/[^a-zA-Z\s.-]/.test(value))
                error = "Full name can only contain letters, spaces, dots, and hyphens";
            break;
        case "employeeId":
            if (!value || !value.trim()) error = "Employee ID is required";
            break;
        case "email": {
            const email = value?.trim();
            if (!email) break;
            if (email.length > 100)
                error = "Email must be less than 100 characters";
            else if (!emailRegex.test(email))
                error = "Invalid email format";
            else if (email.includes(".."))
                error = "Email cannot contain consecutive dots";
            else if (email.startsWith(".") || email.endsWith("."))
                error = "Email cannot start or end with a dot";
            else if (email.split("@")[1]?.startsWith("-") || email.split("@")[1]?.endsWith("-"))
                error = "Invalid domain format";
            break;
        }
        case "contactNumber":
            if (!value) error = "Contact number is required";
            else if (!employeePhoneRegex.test(value))
                error = "Must be +94XXXXXXXXX or 0XXXXXXXXX (10 digits)";
            break;
        case "designation": {
            const designationRegex = /^[A-Za-z\s\-&.()\\/]+$/;
            if (value && !designationRegex.test(value))
                error = "Designation can contain letters, spaces, /, \\, dots, hyphens, &, and parentheses";
            break;
        }
        case "basicSalary":
            if (value === undefined || value === null || value === "" || isNaN(Number(value)) || Number(value) === 0)
                error = "Basic salary is required";
            else if (Number(value) < 0) error = "Basic salary cannot be negative";
            break;
        case "paidLeave":
            if (value !== undefined && value !== null && value !== "" && Number(value) < 0)
                error = "Paid leave cannot be negative";
            break;
        case "otRate":
            if (value !== undefined && value !== null && value !== "" && isNaN(Number(value)))
                error = "OT rate must be a number";
            else if (Number(value) < 0) error = "OT rate cannot be negative";
            break;
        case "epfEtf":
            if (epfEnabled) {
                if (value === undefined || value === null || value === "") {
                    error = "EPF/ETF amount is required";
                } else {
                    const amount = Number(value);
                    const basic = Number(basicSalary) || 0;
                    const limit = salaryType === "MONTHLY" ? basic : basic * 20;
                    if (amount > limit)
                        error = `Cannot exceed ${salaryType === "MONTHLY" ? "monthly salary" : "20x daily rate"} (Rs. ${limit.toLocaleString()})`;
                }
            }
            break;
        case "joinedDate":
            if (!value) error = "Joined date is required";
            else if (new Date(value) > new Date())
                error = "Joined date cannot be in the future";
            break;
        case "bankName":
            if (!value || !value.trim()) error = "Bank name is required";
            break;
        case "accountNumber":
            if (!value || !value.trim()) error = "Account number is required";
            else if (!/^\d+$/.test(value.trim()))
                error = "Account number must contain only digits";
            else if (value.trim().length < 6)
                error = "Account number must be at least 6 digits";
            break;
        case "branchName":
            if (!value || !value.trim()) error = "Branch name is required";
            break;
        case "accountHolderName":
            if (!value || value.trim().length < 2)
                error = "Account holder name must be at least 2 characters";
            else if (/[^a-zA-Z\s.-]/.test(value))
                error = "Account holder name can only contain letters, spaces, dots, and hyphens";
            break;
        case "employeeNIC":
            if (!value || !value.trim()) {
                error = "NIC is required";
            } else {
                const nic = value.trim();
                const oldNicRegex = /^\d{9}[vVxX]$/;
                const newNicRegex = /^\d{12}$/;
                if (!oldNicRegex.test(nic) && !newNicRegex.test(nic))
                    error = "Invalid NIC format (Old: 9 digits + V/X, New: 12 digits)";
            }
            break;
        case "epfNumber":
            if (!value || !value.trim()) {
                error = "EPF Number is required";
            } else {
                const epf = value.trim();
                if (epf.length > 10)
                    error = "EPF Number cannot exceed 10 characters";
                else if (/[^a-zA-Z0-9-]/.test(epf))
                    error = "EPF Number can only contain letters, numbers, and dashes";
            }
            break;
    }
    return error;
};
