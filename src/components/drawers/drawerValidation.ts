// Validation logic extracted from UniversalDrawer for both company and employee forms
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+94\s?\d{9}$/;
const employeePhoneRegex = /^(?:\+94|0)(11|7[0125678])\d{7}$/;

export const validateCompanyField = (field: string, value: any): string => {
    let error = "";
    switch (field) {
        case "name":
            if (!value)
                return 'Company name is required';
            else if (!value || value.trim().length < 3 || value.trim().length > 50)
                error = "Name must be between 3 and 50 characters";
            // name validation
            // else if (!/[a-zA-Z0-9]/.test(value.trim()))
            //     error = "Name must contain letters or numbers";
             else if (/[^a-zA-Z0-9]{6,}/.test(value.trim()))
                error = "Name must not contain more than 5 consecutive special characters";
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
            if (!value || !value.trim())
                error = "Address is required";
            else if (!/[a-zA-Z0-9]/.test(value.trim()))
                // address validation
                error = "Address must contain letters or numbers";
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
            else if (/[^a-zA-Z\s]/.test(value))
                error = "Full name can only contain letters.";
            break;
        case "employeeId":
            if (!value || !value.trim())
                error = "Employee ID is required";
            else if (!/^[a-zA-Z0-9\-\/,\.#()\s]+$/.test(value.trim()))
                error = "Employee ID may only contain letters, numbers, and - / , . # ( )";
            else if (/[\-\/,\.#()]{4,}/.test(value.trim()))
                error = "Employee ID must not contain more than 3 consecutive special characters";
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
            else if (value.replace(/^(\+94|0)/, "").length > 9)
                error = "Must be followed by 9 digits";
            else if (!employeePhoneRegex.test(value))
                error = "Enter a valid Sri Lankan number (e.g. 0771234567 or +94771234567)";
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
            else if (value !== undefined && value !== null && value !== "" && Number(value) > 50)
                error = "Paid leave days cannot exceed 50";
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
            else if (value.trim().length < 6 || value.trim().length > 20)
                error = "Account number must be between 6 and 20 digits";
            break;
        case "branchName":
            if (!value || !value.trim()) 
                error = "Branch name is required";
            else if (/[^a-zA-Z0-9\s]/.test(value.trim()))
                error = "Branch name can only contain letters, numbers, and spaces";
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
            if (value && value.trim()) {
                const epf = value.trim();
                if (epf.length > 10)
                    error = "EPF Number cannot exceed 10 characters";
                else if (/[^0-9/]/.test(epf))
                    error = "EPF Number can only contain numbers and slashes";
            }
            break;
    }
    return error;
};
