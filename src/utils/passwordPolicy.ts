/** Same rule the API enforces (set / reset / change password). */
export const PASSWORD_POLICY_HINT =
  'At least 6 characters, including an uppercase letter, a lowercase letter, a number and a special character.';

/** Returns an error message, or '' when the password meets the policy. */
export function passwordPolicyError(value: string): string {
  if (!value) return 'Password is required';
  const meetsPolicy =
    value.length >= 6 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
  return meetsPolicy ? '' : PASSWORD_POLICY_HINT;
}
