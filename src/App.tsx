import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AppLayout } from './components/app-layout';
import { LoginPage } from './pages/login';
import { SignUpPage } from './pages/signup';
import { OperativesTable } from './components/operatives-table';
import { ManageOperativePage } from './components/operative/ManageOperativePage';
import { ProfilePage } from './components/profile/profile-page';

function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="*" element={<LoginPage />} />
          </>
        ) : (
          <Route element={<AppLayout />}>
            <Route path="/" element={<OperativesTable />} />
            <Route path="/operatives" element={<OperativesTable />} />
            <Route path="/operatives/:id" element={<ManageOperativePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;