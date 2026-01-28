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
      setMemberships(userMemberships);

      // Check for platform_admin role in any membership
      const hasPlatformAdminMembership = userMemberships.some(m => m.role === 'platform_admin');
      if (hasPlatformAdminMembership) {
        setIsPlatformAdmin(true);
      }

      // Load workspaces for memberships (all statuses)
      if (userMemberships.length > 0) {
        const workspaceIds = [...new Set(userMemberships.map(m => m.workspaceId))];
        const allWorkspaces = await base44.entities.Workspace.filter({});
        const userWorkspaces = allWorkspaces.filter(w => workspaceIds.includes(w.id));
        setWorkspaces(userWorkspaces);

        // Restore active workspace from localStorage or use first
        const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const savedWorkspace = userWorkspaces.find(w => w.id === savedWorkspaceId);
        const defaultWorkspace = savedWorkspace || userWorkspaces[0];
        
        if (defaultWorkspace) {
          setActiveWorkspace(defaultWorkspace);
          const membership = userMemberships.find(m => m.workspaceId === defaultWorkspace.id);
          setUserRole(membership?.role || null);
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

  const switchWorkspace = useCallback((workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('activeWorkspaceId', workspace.id);
    const membership = memberships.find(m => m.workspaceId === workspace.id);
    setUserRole(membership?.role || null);
  }, [memberships]);

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
    switchWorkspace,
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