// Validation utilities for forms
export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common validation rules
export const validationRules = {
  email: {
    required: 'Email là bắt buộc',
    invalid: 'Email không hợp lệ'
  },
  password: {
    required: 'Mật khẩu là bắt buộc',
    minLength: 'Mật khẩu phải có ít nhất 6 ký tự'
  },
  fullName: {
    required: 'Họ tên là bắt buộc',
    minLength: 'Họ tên phải có ít nhất 2 ký tự'
  },
  confirmPassword: {
    required: 'Xác nhận mật khẩu là bắt buộc',
    notMatch: 'Mật khẩu xác nhận không khớp'
  },
  terms: {
    required: 'Vui lòng đồng ý với điều khoản sử dụng'
  }
};

// Validate email
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return validationRules.email.required;
  }
  if (!EMAIL_REGEX.test(email)) {
    return validationRules.email.invalid;
  }
  return null;
};

// Validate password
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return validationRules.password.required;
  }
  if (password.length < 6) {
    return validationRules.password.minLength;
  }
  return null;
};

// Validate full name
export const validateFullName = (fullName: string): string | null => {
  if (!fullName) {
    return validationRules.fullName.required;
  }
  if (fullName.trim().length < 2) {
    return validationRules.fullName.minLength;
  }
  return null;
};

// Validate confirm password
export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return validationRules.confirmPassword.required;
  }
  if (password !== confirmPassword) {
    return validationRules.confirmPassword.notMatch;
  }
  return null;
};

// Validate login form
export const validateLoginForm = (formData: LoginFormData): string | null => {
  const emailError = validateEmail(formData.email);
  if (emailError) return emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) return passwordError;

  return null;
};

// Validate register form
export const validateRegisterForm = (
  formData: RegisterFormData, 
  acceptTerms: boolean
): string | null => {
  const fullNameError = validateFullName(formData.fullName);
  if (fullNameError) return fullNameError;

  const emailError = validateEmail(formData.email);
  if (emailError) return emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) return passwordError;

  const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (confirmPasswordError) return confirmPasswordError;

  if (!acceptTerms) {
    return validationRules.terms.required;
  }

  return null;
};

// Validate individual field (for real-time validation)
export const validateField = (
  fieldName: string, 
  value: string, 
  additionalData?: { password?: string; acceptTerms?: boolean }
): string | null => {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'fullName':
      return validateFullName(value);
    case 'confirmPassword':
      return additionalData?.password 
        ? validateConfirmPassword(additionalData.password, value)
        : validateConfirmPassword('', value);
    default:
      return null;
  }
};

// Get all validation errors for a form
export const getFormErrors = (
  formData: LoginFormData | RegisterFormData,
  formType: 'login' | 'register',
  additionalData?: { acceptTerms?: boolean }
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (formType === 'login') {
    const loginData = formData as LoginFormData;
    
    const emailError = validateEmail(loginData.email);
    if (emailError) errors.push({ field: 'email', message: emailError });

    const passwordError = validatePassword(loginData.password);
    if (passwordError) errors.push({ field: 'password', message: passwordError });
    
  } else if (formType === 'register') {
    const registerData = formData as RegisterFormData;
    
    const fullNameError = validateFullName(registerData.fullName);
    if (fullNameError) errors.push({ field: 'fullName', message: fullNameError });

    const emailError = validateEmail(registerData.email);
    if (emailError) errors.push({ field: 'email', message: emailError });

    const passwordError = validatePassword(registerData.password);
    if (passwordError) errors.push({ field: 'password', message: passwordError });

    const confirmPasswordError = validateConfirmPassword(registerData.password, registerData.confirmPassword);
    if (confirmPasswordError) errors.push({ field: 'confirmPassword', message: confirmPasswordError });

    if (additionalData?.acceptTerms === false) {
      errors.push({ field: 'terms', message: validationRules.terms.required });
    }
  }

  return errors;
};