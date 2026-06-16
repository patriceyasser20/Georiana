'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, []);
  return null;
}