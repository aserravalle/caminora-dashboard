import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';

interface SignUpFormData {
  organisationName: string;
  locationName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: SignUpFormData = {
      organisationName: formData.get('organisationName') as string,
      locationName: formData.get('locationName') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
    };

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user account');

      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: transactionError } = await supabase.rpc('create_user_with_org_and_location', {
        p_user_id: authData.user.id,
        p_first_name: data.firstName,
        p_last_name: data.lastName,
        p_email: data.email,
        p_phone: data.phone || '',
        p_org_name: data.organisationName,
        p_location_name: data.locationName
      });

      if (transactionError) throw transactionError;
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-blue-600">Caminora</h1>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Organisation Name"
              name="organisationName"
              type="text"
              required
            />

            <Input
              label="Location Name"
              name="locationName"
              type="text"
              placeholder="e.g., Main Office, Headquarters"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                type="text"
                required
              />

              <Input
                label="Last Name"
                name="lastName"
                type="text"
                required
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              required
            />

            <Input
              label="Phone (optional)"
              name="phone"
              type="tel"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in to your existing account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}