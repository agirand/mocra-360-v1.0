import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [accountAssignments, setAccountAssignments] = useState([]);

  const loadUserContext = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if platform admin (stored in user role field)
      const isAdmin = currentUser?.role === 'admin';
      setIsPlatformAdmin(isAdmin);

      // Load memberships (all statuses to include invited)
      const userMemberships = await base44.entities.WorkspaceMembership.filter({
        userEmail: currentUser.email
      });

      // Auto-activate invited memberships when user logs in
      const invitedMemberships = userMemberships.filter(m => m.status === 'invited');
      if (invitedMemberships.length > 0) {
        await Promise.all(
          invitedMemberships.map(m => 
            base44.entities.WorkspaceMembership.update(m.id, { status: 'active' })
          )
        );
        // Reload memberships after activation
        const updatedMemberships = await base44.entities.WorkspaceMembership.filter({
          userEmail: currentUser.email
        });
        setMemberships(updatedMemberships);
      } else {
        setMemberships(userMemberships);
      }

      // Use updated memberships
      const currentMemberships = invitedMemberships.length > 0 
        ? await base44.entities.WorkspaceMembership.filter({ userEmail: currentUser.email })
        : userMemberships;

      // Check for platform_admin role in any membership
      const hasPlatformAdminMembership = currentMemberships.some(m => m.role === 'platform_admin');
      if (hasPlatformAdminMembership) {
        setIsPlatformAdmin(true);
      }

      // Load only active workspaces
      const activeMemberships = currentMemberships.filter(m => m.status === 'active');
      if (activeMemberships.length > 0) {
        const workspaceIds = [...new Set(activeMemberships.map(m => m.workspaceId))];
        const allWorkspaces = await base44.entities.Workspace.filter({});
        const userWorkspaces = allWorkspaces.filter(w => workspaceIds.includes(w.id));
        setWorkspaces(userWorkspaces);

        // Restore active workspace from localStorage or use first
        const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const savedWorkspace = userWorkspaces.find(w => w.id === savedWorkspaceId);
        const defaultWorkspace = savedWorkspace || userWorkspaces[0];
        
        if (defaultWorkspace) {
          setActiveWorkspace(defaultWorkspace);
          const membership = activeMemberships.find(m => m.workspaceId === defaultWorkspace.id);
          setUserRole(membership?.role || null);

          // Load account assignments for client users
          if (membership?.role === 'client_admin' || membership?.role === 'client_user') {
            const assignments = await base44.entities.AccountUserAssignment.filter({
              userId: currentUser.id,
              workspaceId: defaultWorkspace.id,
              status: 'active'
            });
            setAccountAssignments(assignments);

            if (assignments.length === 0) {
              // No assignments - will show error page
              setActiveAccountId(null);
            } else if (assignments.length === 1) {
              // Single assignment - auto-select
              setActiveAccountId(assignments[0].accountId);
              localStorage.setItem(`activeAccountId_${defaultWorkspace.id}`, assignments[0].accountId);
            } else {
              // Multiple assignments - restore or require selection
              const savedAccountId = localStorage.getItem(`activeAccountId_${defaultWorkspace.id}`);
              const savedAssignment = assignments.find(a => a.accountId === savedAccountId);
              if (savedAssignment) {
                setActiveAccountId(savedAccountId);
              } else {
                // Will show account picker
                setActiveAccountId(null);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserContext();
  }, [loadUserContext]);

  const switchWorkspace = useCallback(async (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('activeWorkspaceId', workspace.id);
    const membership = memberships.find(m => m.workspaceId === workspace.id);
    setUserRole(membership?.role || null);

    // Load account assignments for client users
    if (membership?.role === 'client_admin' || membership?.role === 'client_user') {
      const assignments = await base44.entities.AccountUserAssignment.filter({
        userId: user.id,
        workspaceId: workspace.id,
        status: 'active'
      });
      setAccountAssignments(assignments);

      const savedAccountId = localStorage.getItem(`activeAccountId_${workspace.id}`);
      const savedAssignment = assignments.find(a => a.accountId === savedAccountId);
      const defaultAccountId = savedAssignment?.accountId || assignments[0]?.accountId;
      setActiveAccountId(defaultAccountId);
    } else {
      setActiveAccountId(null);
      setAccountAssignments([]);
    }
  }, [memberships, user]);

  const refreshMemberships = useCallback(async () => {
    if (!user) return;
    const userMemberships = await base44.entities.WorkspaceMembership.filter({
      userEmail: user.email
    });
    setMemberships(userMemberships);
    
    const workspaceIds = [...new Set(userMemberships.map(m => m.workspaceId))];
    const allWorkspaces = await base44.entities.Workspace.filter({});
    const userWorkspaces = allWorkspaces.filter(w => workspaceIds.includes(w.id));
    setWorkspaces(userWorkspaces);
  }, [user]);

  const canEdit = userRole === 'platform_admin' || userRole === 'workspace_admin' || userRole === 'workspace_user';
  const canAdmin = userRole === 'platform_admin' || userRole === 'workspace_admin';
  const isLimitedUser = userRole === 'limited_user';
  const isClientUser = userRole === 'client_admin' || userRole === 'client_user';
  const isClientAdmin = userRole === 'client_admin';

  const switchAccount = useCallback((accountId) => {
    // Verify user has access to this account
    const hasAccess = accountAssignments.some(a => a.accountId === accountId);
    if (!hasAccess && isClientUser) {
      console.error('Access denied to account');
      return;
    }
    setActiveAccountId(accountId);
    localStorage.setItem(`activeAccountId_${activeWorkspace.id}`, accountId);
  }, [accountAssignments, isClientUser, activeWorkspace]);

  const value = {
    user,
    memberships,
    workspaces,
    activeWorkspace,
    userRole,
    loading,
    isPlatformAdmin,
    canEdit,
    canAdmin,
    isLimitedUser,
    isClientUser,
    isClientAdmin,
    activeAccountId,
    accountAssignments,
    switchWorkspace,
    switchAccount,
    refreshMemberships,
    loadUserContext
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}