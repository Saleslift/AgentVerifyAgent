import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

interface FormData {
  email: string;
  password: string;
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
  invitationToken?: string;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteToken = params.get('invite');
    
    if (inviteToken) {
      setFormData(prev => ({
        ...prev,
        invitationToken: inviteToken
      }));
      
      verifyInvitationToken(inviteToken);
    }
  }, [location]);

  const verifyInvitationToken = async (token: string) => {
    try {
      setInvitationLoading(true);
      setInvitationError(null);
      
      const { data, error } = await supabase.functions.invoke('verify-invitation', {
        body: { token }
      });
      
      if (error) throw error;
      
      if (!data.valid) {
        setInvitationError(data.message || 'Invalid invitation');
        return;
      }
      
      setInvitationDetails(data);
      
      setFormData(prev => ({
        ...prev,
        email: data.email || prev.email,
        whatsapp: data.phone || prev.whatsapp,
        role: 'agent'
      }));
    } catch (err) {
      console.error('Error verifying invitation:', err);
      setInvitationError('Failed to verify invitation');
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      // Basic validation
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.password.trim()) throw new Error('Password is required');
      if (!formData.firstName?.trim()) throw new Error('First name is required');
      if (!formData.lastName?.trim()) throw new Error('Last name is required');

      // Validate password strength
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Prepare metadata
      const metadata: any = {
        data: {
          role: 'agent',
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          brokerNumber: formData.brokerNumber,
          whatsapp: formData.whatsapp,
          referral1Name: formData.referral1Name,
          referral1Contact: formData.referral1Contact,
          referral2Name: formData.referral2Name,
          referral2Contact: formData.referral2Contact,
          referral3Name: formData.referral3Name,
          referral3Contact: formData.referral3Contact
        }
      };

      // Create the user account
      const { error: signUpError, user } = await signUp(
        formData.email,
        formData.password,
        metadata
      );
      
      if (signUpError) {
        throw signUpError;
      }
      
      setSuccess(true);
      
      if (user) {
        // Wait a moment before redirecting to allow profile creation to complete
        setTimeout(() => {
          console.log('Redirecting to agent dashboard after successful signup');
          navigate('/agent-dashboard');
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
          {invitationDetails && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    You've been invited to join Agentverify!
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

          {invitationError && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{invitationError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Account created successfully! You can now sign in.</p>
                  </div>
                </div>
              </div>
            )}

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
                disabled={!!invitationDetails?.email}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="+971"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="brokerNumber" className="block text-sm font-medium text-gray-700">
                Broker Registration Number *
              </label>
              <input
                type="text"
                id="brokerNumber"
                name="brokerNumber"
                required
                value={formData.brokerNumber || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                WhatsApp Number (if different from phone)
              </label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                placeholder="+971"
                value={formData.whatsapp || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
              />
            </div>

            {!formData.invitationToken && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🎁 Support Agentverify — Invite 3 Agents
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Agentverify is 100% free to use. To support our mission, please refer 3 UAE real estate agents. We'll contact them on your behalf — they don't need to register to complete your signup.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="referral1Name" className="block text-sm font-medium text-gray-700">
                        Referral 1 - Full Name *
                      </label>
                      <input
                        type="text"
                        id="referral1Name"
                        name="referral1Name"
                        required
                        value={formData.referral1Name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="referral1Contact" className="block text-sm font-medium text-gray-700">
                        Referral 1 - Phone or Email *
                      </label>
                      <input
                        type="text"
                        id="referral1Contact"
                        name="referral1Contact"
                        required
                        placeholder="+971 or email"
                        value={formData.referral1Contact || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="referral2Name" className="block text-sm font-medium text-gray-700">
                        Referral 2 - Full Name *
                      </label>
                      <input
                        type="text"
                        id="referral2Name"
                        name="referral2Name"
                        required
                        value={formData.referral2Name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="referral2Contact" className="block text-sm font-medium text-gray-700">
                        Referral 2 - Phone or Email *
                      </label>
                      <input
                        type="text"
                        id="referral2Contact"
                        name="referral2Contact"
                        required
                        placeholder="+971 or email"
                        value={formData.referral2Contact || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="referral3Name" className="block text-sm font-medium text-gray-700">
                        Referral 3 - Full Name *
                      </label>
                      <input
                        type="text"
                        id="referral3Name"
                        name="referral3Name"
                        required
                        value={formData.referral3Name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="referral3Contact" className="block text-sm font-medium text-gray-700">
                        Referral 3 - Phone or Email *
                      </label>
                      <input
                        type="text"
                        id="referral3Contact"
                        name="referral3Contact"
                        required
                        placeholder="+971 or email"
                        value={formData.referral3Contact || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-300 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

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