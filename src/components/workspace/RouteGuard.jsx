import { useEffect } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export function useRouteGuard(allowedRoles = []) {
  const { userRole, isClientUser, loading } = useWorkspace();

  useEffect(() => {
    if (loading) return;

    // Client users cannot access consultant CRM pages
    if (isClientUser && !allowedRoles.includes('client')) {
      toast.error('Access restricted to this page');
      window.location.href = createPageUrl('ClientDashboard');
    }

    // Check specific role requirements
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole) && !allowedRoles.includes('all')) {
      toast.error('Access restricted');
      window.location.href = createPageUrl('Dashboard');
    }
  }, [userRole, isClientUser, loading, allowedRoles]);

  return { loading };
}