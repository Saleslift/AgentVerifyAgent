import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { useInvitation } from '../hooks/useInvitation';

type UserRole = 'agency';

interface FormData {
  email: string;
  password: string;
  role: UserRole | '';
  companyName?: string;
  companyAddress?: string;
  companyRegNumber?: string;
  agencyPhone?: string;
  agencyWhatsapp?: string;
}

export default function SignUpAgencyPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { invitation, loading: invitationLoading, acceptInvitation } = useInvitation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    role: 'agency'
  });

  useEffect(() => {
    // Pre-fill email if invitation is valid
    if (invitation?.valid && invitation.email) {
      setFormData(prev => ({
        ...prev,
        email: invitation.email || '',
        role: 'agency'
      }));
    }
  }, [invitation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    console.log('Starting signup form submission...');

    try {
      // Basic validation
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.password.trim()) throw new Error('Password is required');
      if (!formData.role) throw new Error('Please select your role');

      // Validate password strength
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Prepare metadata based on role
      const metadata: any = {
        data: {
          role: formData.role,
        },
        ...Object.fromEntries(
          Object.entries(formData)
            .filter(([key]) => key !== 'email' && key !== 'password' && key !== 'role')
            .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        ),
      };

      // Log the metadata being sent
      console.log('Submitting signup with metadata:', metadata);

      // Create the user account using Supabase Auth with the updated signUp function
      const { error: signUpError, user } = await signUp(
        formData.email,
        formData.password,
        metadata
      );

      console.log('Signup response received', signUpError);

      if (signUpError) {
        throw signUpError;
      }

      setSuccess(true);

      // If this was an invitation signup, process the acceptance
      if (invitation?.valid && user) {
        const { success: acceptSuccess, message: acceptMessage } = await acceptInvitation(user.id);

        if (!acceptSuccess) {
          console.warn('Invitation acceptance had issues:', acceptMessage);
          // Continue with signup process even if invitation acceptance failed
        }
      }

      if (user) {
        console.log('User created successfully:', user.id);
        console.log('User metadata assigned:', metadata.data.role);

        // Wait a moment before redirecting to allow profile creation to complete
        setTimeout(() => {
          console.log(`Redirecting to agency dashboard after successful signup`);
          navigate('/agency-dashboard');
        }, 2000);
      }
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
        errorMessage = 'Password must be at least 6 characters long and include uppercase, lowercase, and special characters.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-primary-300" />
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
          {invitation?.valid && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    You've been invited by <strong>{invitation.inviter_name}</strong> to join Agentverify!
                  </p>
                </div>
              </div>
            </div>
          )}

          {invitationLoading && (
            <div className="mb-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
            </div>
          )}

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

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I am a... *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                disabled={true}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-300 focus:border-primary-300 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="agency">Agency</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                disabled={!!invitation?.email}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
              </p>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                required
                value={formData.companyName || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                Company Address *
              </label>
              <input
                type="text"
                id="companyAddress"
                name="companyAddress"
                required
                value={formData.companyAddress || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="companyRegNumber" className="block text-sm font-medium text-gray-700">
                Company Registration Number *
              </label>
              <input
                type="text"
                id="companyRegNumber"
                name="companyRegNumber"
                required
                value={formData.companyRegNumber || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="agencyPhone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="agencyPhone"
                name="agencyPhone"
                required
                placeholder="+971"
                value={formData.agencyPhone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="agencyWhatsapp" className="block text-sm font-medium text-gray-700">
                WhatsApp Number (if different from phone)
              </label>
              <input
                type="tel"
                id="agencyWhatsapp"
                name="agencyWhatsapp"
                placeholder="+971"
                value={formData.agencyWhatsapp || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-primary-300 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
