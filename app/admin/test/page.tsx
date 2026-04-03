'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('Testing Supabase client import...');
  const [error, setError] = useState('');

  useEffect(() => {
    // We use a dynamic import here to catch the resolution error itself.
    import('@/utils/supabase/client')
      .then(module => {
        if (typeof module.createClient === 'function') {
          setMessage('SUCCESS: The module was imported and createClient is a function.');
        } else {
          setMessage('FAIL: The module was imported, but createClient is NOT a function.');
        }
      })
      .catch(err => {
        console.error(err);
        setMessage('FAIL: The module could not be imported.');
        setError(`Error message: ${err.message}`);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Supabase Client Import Test</h1>
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{message}</p>
      {error && <pre style={{ color: 'red', backgroundColor: '#fdd', padding: '1rem' }}>{error}</pre>}
      <p>This page is a diagnostic tool. Its result will tell us exactly why the 'Module Not Found' error is occurring.</p>
    </div>
  );
}
