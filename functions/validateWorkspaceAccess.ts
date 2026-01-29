import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, operation } = await req.json();

    if (!workspaceId) {
      return Response.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Get user's membership in this workspace
    const memberships = await base44.asServiceRole.entities.WorkspaceMembership.filter({
      workspaceId: workspaceId,
      userEmail: user.email,
      status: 'active'
    });

    if (memberships.length === 0) {
      return Response.json({ 
        allowed: false, 
        reason: 'No active membership in workspace' 
      }, { status: 403 });
    }

    const membership = memberships[0];
    const role = membership.role;

    // Define role permissions
    const canEdit = ['platform_admin', 'workspace_admin', 'workspace_user'].includes(role);
    const canAdmin = ['platform_admin', 'workspace_admin'].includes(role);
    const canView = ['platform_admin', 'workspace_admin', 'workspace_user', 'limited_user'].includes(role);

    // Check permissions based on operation
    let allowed = false;
    switch (operation) {
      case 'view':
        allowed = canView;
        break;
      case 'create':
      case 'update':
      case 'delete':
        allowed = canEdit;
        break;
      case 'admin':
        allowed = canAdmin;
        break;
      default:
        allowed = false;
    }

    return Response.json({ 
      allowed,
      role,
      canEdit,
      canAdmin,
      canView
    });

  } catch (error) {
    console.error('Error validating workspace access:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});