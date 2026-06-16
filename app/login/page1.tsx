// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import { supabaseClient } from '../../lib/supabaseClient';
// import { useTranslation } from '../context/LanguageContext';
// import { Mail, Apple, Twitter } from 'lucide-react';

// export default function Login() {
//   const router = useRouter();
//   const { t } = useTranslation();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Social Login
//   const signInWithProvider = async (provider: 'google' | 'apple' | 'twitter') => {
//     setLoading(true);
//     const { error } = await supabaseClient.auth.signInWithOAuth({
//       provider,
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`,
//       },
//     });
//     if (error) setError(error.message);
//     setLoading(false);
//   };

//   // Email Login
//   const handleLogin = async () => {
//     setLoading(true);
//     setError('');

//     // ADMIN LOGIN
//     if (email.toLowerCase() === 'admin@zara.com' && password === 'admin2026') {
//       localStorage.setItem('isAdmin', 'true');
//       router.push('/admin');
//       setLoading(false);
//       return;
//     }

//     const { error: authError } = await supabaseClient.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (authError) {
//       setError(t('login.invalidCredentials'));
//     } else {
//       router.push('/');
//     }

//     setLoading(false);
//   };

//   return (
//     <>
//       <Header />
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">
//         <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full">
          
//           {/* Logo */}
//           <div className="text-center mb-8">
//             <img 
//               src="/images/logo.svg" 
//               alt="GEORIANA" 
//               className="h-16 mx-auto" 
//             />
//           </div>

//           <h1 className="text-3xl font-light text-center mb-8">Log in</h1>

//           {/* Email & Password Form */}
//           <div className="space-y-5">
//             <input
//               type="email"
//               placeholder="Email address"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="border border-gray-300 rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
//             />
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="border border-gray-300 rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-black"
//             />

//             {error && <p className="text-red-600 text-center text-sm">{error}</p>}

//             <button
//               onClick={handleLogin}
//               disabled={loading}
//               className="w-full bg-black text-white py-4 rounded-2xl text-sm tracking-widest hover:bg-gray-800 disabled:opacity-70 transition"
//             >
//               {loading ? 'Signing in...' : 'LOG IN'}
//             </button>
//           </div>

//           {/* Divider */}
//           <div className="flex items-center gap-4 my-8">
//             <div className="flex-1 h-px bg-gray-200"></div>
//             <span className="text-gray-400 text-sm">OR</span>
//             <div className="flex-1 h-px bg-gray-200"></div>
//           </div>

//           {/* Social Login Buttons */}
//           <div className="space-y-3">
//             <button
//               onClick={() => signInWithProvider('google')}
//               className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 rounded-2xl hover:bg-gray-50 transition"
//             >
//               <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_24dp.png" alt="Google" className="w-5" />
//               <span className="font-medium">Continue with Google</span>
//             </button>

//             <button
//               onClick={() => signInWithProvider('apple')}
//               className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 rounded-2xl hover:bg-gray-50 transition"
//             >
//               <Apple size={22} />
//               <span className="font-medium">Continue with Apple</span>
//             </button>

//             <button
//               onClick={() => signInWithProvider('twitter')}
//               className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 rounded-2xl hover:bg-gray-50 transition"
//             >
//               <Twitter size={22} />
//               <span className="font-medium">Continue with X</span>
//             </button>
//           </div>

//           {/* Sign up link */}
//           <div className="text-center mt-8 text-sm text-gray-600">
//             Don’t have an account?{' '}
//             <span 
//               onClick={() => router.push('/signup')} 
//               className="text-black underline cursor-pointer hover:text-gray-800"
//             >
//               Sign up
//             </span>
//           </div>

//           {/* Admin hint */}
//           <div className="text-center mt-6 text-xs text-gray-500">
//             Admin Login: admin@zara.com / admin2026
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// }