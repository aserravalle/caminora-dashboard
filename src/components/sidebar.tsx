import { CalendarDays, LayoutDashboard, Users, LogOut, Clock, Building2, Briefcase } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  first_name: string;
  last_name: string;
  is_admin: boolean;
  organisation: {
    name: string;
  };
}

interface NavigationSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
  }[];
}

const navigation: NavigationSection[] = [
  {
    title: "Operate",
    items: [
      { name: 'Quick Roster', href: '/quick-roster', icon: Clock },
    ]
  },
  {
    title: "Manage",
    items: [
      { name: 'Operatives', href: '/operatives', icon: Users },
      { name: 'Clients', href: '/clients', icon: Building2 },
      { name: 'Jobs', href: '/jobs', icon: Briefcase },
    ]
  }
];

export function Sidebar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name, is_admin, organisation:organisations(name)')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    }

    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col gap-y-5 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-2xl font-bold text-blue-600">Caminora</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {navigation.map((section) => (
            <li key={section.title}>
              <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </div>
              <ul role="list" className="-mx-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                        location.pathname === item.href
                          ? 'bg-gray-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-6 w-6 shrink-0',
                          location.pathname === item.href
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-blue-600'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="mt-auto space-y-2">
            <Link
              to="/profile"
              className="flex items-center gap-x-4 py-3 text-sm hover:bg-gray-50 rounded-md px-2"
            >
              <span className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-sm font-medium text-gray-700">
                {profile?.first_name?.[0]}
                {profile?.last_name?.[0]}
              </span>
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="truncate text-xs leading-5 text-gray-500">
                  {profile?.organisation?.name}
                </p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              <LogOut className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              Sign out
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}