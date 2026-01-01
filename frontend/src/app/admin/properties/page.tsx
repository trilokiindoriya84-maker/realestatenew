'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPropertiesPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/properties/pending');
  }, [router]);

  return null;
}