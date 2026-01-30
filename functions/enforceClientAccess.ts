import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Server-side enforcement of client isolation.
 * Client users can only access records for their assigned account(s).
 * 
 * Usage in backend functions:
 * const { user, canAccess, accountId } = await enforceClientAccess(req);
 * Then filter queries by: { workspaceId, accountId }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, accountId, operation, entityName } = await req.json();

    // Platform admins have global access
    if (user.role === 'admin') {
      return Response.json({ 
        allowed: true, 
        accountId: accountId || null,
        scope: 'global'
      });
    }

    // Get user's workspace membership
    const memberships = await base44.entities.WorkspaceMembership.filter({
      userId: user.id,
      workspaceId,
      status: 'active'
    });

    if (memberships.length === 0) {
      return Response.json({ 
        allowed: false, 
        error: 'Not a member of this workspace' 
      }, { status: 403 });
    }

    const membership = memberships[0];
    const role = membership.role;

    // Workspace admins and users have full workspace access
    if (role === 'workspace_admin' || role === 'workspace_user' || role === 'platform_admin') {
      return Response.json({ 
        allowed: true, 
        accountId: accountId || null,
        scope: 'workspace',
        role
      });
    }

    // Client users: must have account assignment
    if (role === 'client_admin' || role === 'client_user') {
      const assignments = await base44.entities.AccountUserAssignment.filter({
        userId: user.id,
        workspaceId,
        status: 'active'
      });

      if (assignments.length === 0) {
        return Response.json({ 
          allowed: false, 
          error: 'No account assigned. Contact your consultant.' 
        }, { status: 403 });
      }

      // Check if accessing their assigned account
      const allowedAccountIds = assignments.map(a => a.accountId);
      
      if (!accountId) {
        return Response.json({ 
          allowed: false, 
          error: 'Account ID required for client users' 
        }, { status: 400 });
      }

      if (!allowedAccountIds.includes(accountId)) {
        return Response.json({ 
          allowed: false, 
          error: 'Access denied to this account' 
        }, { status: 403 });
      }

      return Response.json({ 
        allowed: true, 
        accountId,
        allowedAccountIds,
        scope: 'account',
        role
      });
    }

    // Limited users - view only, no specific account restrictions yet
    if (role === 'limited_user') {
      return Response.json({ 
        allowed: operation === 'read', 
        accountId: accountId || null,
        scope: 'workspace',
        role
      });
    }

    return Response.json({ 
      allowed: false, 
      error: 'Invalid role' 
    }, { status: 403 });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});