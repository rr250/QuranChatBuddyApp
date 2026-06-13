const EMAIL_REGEX = /\S+@\S+\.\S+/;

export const validateEmail = (email) => {
    if (!email?.trim()) return "Email is required";
    if (!EMAIL_REGEX.test(email)) return "Invalid email format";
    return null;
};

export const validatePassword = (password, { minLength = 6 } = {}) => {
    if (!password) return "Password is required";
    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters`;
    }
    return null;
};

export const validateDisplayName = (name) => {
    if (!name?.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
};

export const validateStrongPassword = (password) => {
    const baseError = validatePassword(password);
    if (baseError) return baseError;
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
        return "Password must contain uppercase and lowercase letters";
    }
    return null;
};

export const hasValidationErrors = (errors) =>
    Object.values(errors).some(Boolean);
