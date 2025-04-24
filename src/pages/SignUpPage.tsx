import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {Link, useNavigate} from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Define the role type
type UserRole = 'agent' | 'agency' | 'developer';

// Base form data interface
interface BaseFormData {
    email: string;
    password: string;
    role: UserRole;
}

// Role-specific additional data interfaces
interface AgentFormData extends BaseFormData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    brokerNumber?: string;
    whatsapp?: string;
    referral1Name?: string;
    referral1Contact?: string;
    referral2Name?: string;
    referral2Contact?: string;
    referral3Name?: string;
    referral3Contact?: string;
}

interface AgencyFormData extends BaseFormData {
    companyName?: string;
    companyAddress?: string;
    companyRegNumber?: string;
    agencyPhone?: string;
    agencyWhatsapp?: string;
}

interface DeveloperFormData extends BaseFormData {
    developerCompanyName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

// Union type for form data
type SignupFormData = AgentFormData | AgencyFormData | DeveloperFormData;

// Field configuration type
interface FieldConfig {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    description?: string;
    col?: number;
}


const SignUpPage = () => {
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { control, handleSubmit, watch, formState: { errors }, reset } = useForm<SignupFormData>({
        defaultValues: {
            email: '',
            password: '',
            role: 'agent',
        }
    });

    const selectedRole = watch('role');

    // Define field configurations for each role
    const roleFields: Record<UserRole, FieldConfig[]> = {
        agent: [
            { name: 'firstName', label: 'First Name *', type: 'text', required: true, col: 1 },
            { name: 'lastName', label: 'Last Name *', type: 'text', required: true, col: 1 },
            { name: 'phone', label: 'Phone Number *', type: 'tel', required: true, placeholder: '+971' },
            { name: 'brokerNumber', label: 'Broker Registration Number *', type: 'text', required: true },
            { name: 'whatsapp', label: 'WhatsApp Number (if different from phone)', type: 'tel', required: false, placeholder: '+971' },

        ],
        agency: [
            { name: 'companyName', label: 'Company Name *', type: 'text', required: true },
            { name: 'companyAddress', label: 'Company Address *', type: 'text', required: true },
            { name: 'companyRegNumber', label: 'Company Registration Number *', type: 'text', required: true },
            { name: 'phone', label: 'Phone Number *', type: 'tel', required: true, placeholder: '+971' },
            { name: 'agencyWhatsapp', label: 'WhatsApp Number (if different from phone)', type: 'tel', required: false, placeholder: '+971' },
        ],
        developer: [
            { name: 'developerCompanyName', label: 'Company Name *', type: 'text', required: true },
            { name: 'phone', label: 'Phone Number *', type: 'tel', required: true, placeholder: '+971' },
        ],
    };

    // Common fields for all roles
    const commonFields: FieldConfig[] = [
        { name: 'email', label: 'Email address *', type: 'email', required: true },
        { name: 'password', label: 'Password *', type: 'password', required: true, description: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' },
    ];

    // Reset form when role changes
    React.useEffect(() => {
        reset({
            ...watch(),
            role: selectedRole
        });
    }, [selectedRole, reset, watch]);

    const onSubmit = async (data: SignupFormData) => {
        setError(null);
        setLoading(true);
        setSuccess(false);

        try {
            // Prepare metadata based on role
            const metadata = {
                data: Object.entries(data).reduce((acc: Record<string, any>, [key, value]) => {
                    if (!['email', 'password', 'role'].includes(key)) {
                        acc[key] = typeof value === 'string' ? value.trim() : value;
                    }
                    return acc;
                }, { role: data.role }),
            };

            // Create the user account
            const { error: signUpError } = await signUp(
                data.email,
                data.password,
                metadata
            );

            if (signUpError) {
                throw signUpError;
            }

            setSuccess(true);
            // navigate('/dashboard');
        } catch (err: any) {
            console.error('Error during sign up:', err);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            errorMessage = err instanceof Error ? err.message :
                (typeof err === 'object' && err.message) ? err.message :
                    'An unexpected error occurred';

            // Provide more user-friendly error messages
            if (errorMessage.includes('Database error')) {
                errorMessage = 'There was a problem creating your account. Please try again with a different email address.';
            } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (errorMessage.includes('password')) {
                errorMessage = 'Password must be at least 8 characters long and include uppercase, lowercase, and special characters.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Render a field based on configuration
    const renderField = (field: FieldConfig) => {
        return (
            <div key={field.name} className={field.col ? `col-span-${field.col}` : 'col-span-2'}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                    {field.label}
                </label>
                <Controller
                    name={field.name as any}
                    control={control}
                    rules={{ required: field.required }}
                    render={({ field: { onChange, value, name } }) => (
                        <input
                            id={name}
                            type={field.type}
                            value={value || ''}
                            onChange={onChange}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                        />
                    )}
                />
                {field.description && (
                    <p className="mt-1 text-sm text-gray-500">{field.description}</p>
                )}
                {errors[field.name as keyof SignupFormData] && (
                    <p className="mt-1 text-sm text-red-600">This field is required</p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <img
                        src="https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//png%20100%20x%20100%20(1).png"
                        alt="AgentVerify Logo"
                        className="h-20 w-20"
                    />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/signin" className="font-medium text-primary-300 hover:text-primary-400">
                        sign in to your account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">Account created successfully! You can now sign in.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Role selector */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                I am a... *
                            </label>
                            <Controller
                                name="role"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-300 focus:border-primary-300 sm:text-sm rounded-md"
                                    >
                                        <option value="agent">Agent</option>
                                        <option value="agency">Agency</option>
                                        <option value="developer">Developer</option>
                                    </select>
                                )}
                            />
                        </div>

                        {/* Common fields */}
                        {commonFields.map(renderField)}

                        {/* Role specific fields */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {selectedRole === 'agent' && 'Agent Information'}
                                {selectedRole === 'agency' && 'Agency Information'}
                                {selectedRole === 'developer' && 'Developer Information'}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {roleFields[selectedRole].map(renderField)}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-primary-300 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300 disabled:opacity-50 gradient-button"
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
