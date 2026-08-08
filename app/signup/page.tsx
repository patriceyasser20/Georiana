'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { supabaseClient } from '../../lib/supabaseClient';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTranslation } from '../context/LanguageContext';

export default function Signup() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [fullName, setFullName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper to validate phone in real-time
  const isPhoneValid = phone.replace(/\D/g, '').length === 11;
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return t('signup.passwordMin');
    }

    if (!/^[A-Z]/.test(password)) {
      return t('signup.passwordCapital');
    }

    if (!/[A-Za-z]/.test(password)) {
      return t('signup.passwordLetter');
    }

    if (!/\d/.test(password)) {
      return t('signup.passwordNumber');
    }

    return '';
  };

  const passwordChecks = {
    length: password.length >= 6,
    capital: /^[A-Z]/.test(password),
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };
  const signInWithProvider = async (provider: 'google') => {
    setLoading(true);
    setError('');
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider:'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError(t('signup.fullNameRequired'));
      setLoading(false);
      return;
    }
    const passwordError = validatePassword(password);

    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    // Validate phone number (11 digits)
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 11) {
      setError(t('signup.phoneRequired'));
      setLoading(false);
      return;
    }

    // Check if phone or email already exists in profiles
    const { data: existingPhone } = await supabaseClient
      .from('profiles')
      .select('phone')
      .eq('phone', cleanedPhone)
      .maybeSingle();

    const { data: existingEmail } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    // Prepare error message
    const errors = [];
    if (existingPhone) errors.push(t('signup.phoneField'));
    if (existingEmail) errors.push(t('signup.emailField'));

    if (errors.length > 0) {
       setError(`${errors.join(` ${t('signup.and')} `)} ${errors.length > 1 ? t('signup.alreadyExistsPlural') : t('signup.alreadyExistsSingular')}`);
      setLoading(false);
      return;
    }

    // Sign up the user (phone saved in auth.users metadata)
    const { data, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { phone: cleanedPhone, full_name: trimmedName },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already exists')) {
        setError(t('signup.emailAlreadyExists'));
      } else {
        setError(authError.message);
      }
    } else if (data.user) {
      // Save phone to profiles table (using the returned user ID)
      await supabaseClient
        .from('profiles')
        .upsert({
          id: data.user.id,
          email,
          phone: cleanedPhone,
          full_name: trimmedName,
        });
        fetch('/api/set-user-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, phone: cleanedPhone }),
        }).catch((err) => console.error('Failed to set auth phone:', err));

        setSuccess(t('signup.success'));
        setTimeout(() => {
        router.push('/login');
      }, 3500);

      setSuccess(t('signup.success'));
      setTimeout(() => {
        router.push('/login');
      }, 3500);
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full">
          <div className="text-center mb-10">
            <img 
              src="/images/logo.svg" 
              alt="GEORIANA" 
              className="h-30 mx-auto" 
            />
             <p className="text-xl text-gray-500 mt-4">{t('signup.createAccount')}</p>
          </div>

          <div className="space-y-6">
            <input
              type="text"
              placeholder={t('signup.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />
            <input
              type="email"
              placeholder={t('signup.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
            />
            <div>
              <input
                type="tel"
                placeholder={t('signup.phone')}
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setPhone(value);
                }}
                dir="ltr"
                className={`border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black
                  ${language === 'ar'
                    ? 'text-right placeholder:text-right'
                    : 'text-left placeholder:text-left'
                  }`}
              />
              {phone && !isPhoneValid && (
                <p className="text-red-500 text-xs mt-1">{t('signup.phoneHint')}</p>
              )}
            </div>
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('signup.passwordHint')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`border rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black ${
                    language === 'ar' ? 'pr-6 pl-14' : 'pl-6 pr-14'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-black ${
                    language === 'ar' ? 'left-5' : 'right-5'
                  }`}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {password && (
                <div className="mt-3 text-sm space-y-1">
                  <p className={passwordChecks.length ? "text-green-600" : "text-red-500"}>
                    {passwordChecks.length ? "✓" : "✗"} {t('signup.passwordMin')}
                  </p>

                  <p className={passwordChecks.capital ? "text-green-600" : "text-red-500"}>
                    {passwordChecks.capital ? "✓" : "✗"} {t('signup.passwordCapital')}
                  </p>

                  <p className={passwordChecks.letter ? "text-green-600" : "text-red-500"}>
                    {passwordChecks.letter ? "✓" : "✗"} {t('signup.passwordLetter')}
                  </p>

                  <p className={passwordChecks.number ? "text-green-600" : "text-red-500"}>
                    {passwordChecks.number ? "✓" : "✗"} {t('signup.passwordNumber')}
                  </p>
                </div>
              )}
            </div>

            {error && <p className="text-red-600 text-center font-medium">{error}</p>}
            {success && <p className="text-green-600 text-center font-medium">{success}</p>}

            <button
              onClick={handleSignup}
              disabled={
                loading ||
                !fullName.trim() ||
                !email ||
                !phone ||
                !isPhoneValid ||
                !passwordChecks.length ||
                !passwordChecks.capital ||
                !passwordChecks.letter ||
                !passwordChecks.number
              }
              className="w-full bg-black text-white py-4 rounded-full text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70 transition"
            >
              {loading ? t('signup.creatingAccount') : t('signup.button')}
            </button>
          </div>

          {/* Social Signup */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">{t('signup.OR')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => signInWithProvider('google')}
              disabled={loading}
              className="w-full border border-gray-300 hover:bg-gray-50 py-4 rounded-2xl flex items-center justify-center gap-3 transition"
            >
              <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_24dp.png" alt="Google" className="w-5" />
              <span className="text-sm font-medium text-gray-700">{t('signup.continueWithGoogle')}</span>
            </button>
          </div>

          <div className="text-center mt-10 text-sm">
             {t('signup.haveAccount')}{' '}
            <span 
              onClick={() => router.push('/login')} 
              className="text-black underline cursor-pointer"
            >
              {t('signup.login')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}