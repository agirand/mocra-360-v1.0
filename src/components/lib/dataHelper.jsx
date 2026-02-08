import { base44 } from '@/api/base44Client';

/**
 * Centralized data access helper with automatic workspace and account filtering
 * Ensures client users can only access their assigned account data
 */

export class DataHelper {
  constructor(workspaceId, accountId = null, isClientUser = false) {
    this.workspaceId = workspaceId;
    this.accountId = accountId;
    this.isClientUser = isClientUser;
  }

  /**
   * Build filter with automatic workspace/account isolation
   */
  buildFilter(entityName, customFilter = {}) {
    const filter = { ...customFilter };

    // Always include workspaceId
    if (this.workspaceId) {
      filter.workspaceId = this.workspaceId;
    }

    // For client users, enforce accountId on account-scoped entities
    const accountScopedEntities = [
      'Contact', 'Facility', 'Brand', 'Project', 
      'Equipment', 'MaintenanceTask', 'Evidence', 'SignOff'
    ];

    if (this.isClientUser && this.accountId && accountScopedEntities.includes(entityName)) {
      filter.accountId = this.accountId;
    }

    return filter;
  }

  /**
   * List entities with automatic filtering
   */
  async list(entityName, customFilter = {}) {
    const filter = this.buildFilter(entityName, customFilter);
    return await base44.entities[entityName].filter(filter);
  }

  /**
   * Get single entity with validation
   */
  async get(entityName, id) {
    const results = await base44.entities[entityName].filter({ id });
    if (results.length === 0) return null;
    
    const record = results[0];

    // Validate access for client users
    if (this.isClientUser) {
      if (record.workspaceId !== this.workspaceId) {
        throw new Error('Access denied: wrong workspace');
      }
      if (this.accountId && record.accountId && record.accountId !== this.accountId) {
        throw new Error('Access denied: wrong account');
      }
    }

    return record;
  }

  /**
   * Create entity with automatic workspace/account injection
   */
  async create(entityName, data) {
    const payload = { ...data };

    // Always inject workspaceId
    if (this.workspaceId && !payload.workspaceId) {
      payload.workspaceId = this.workspaceId;
    }

    // For client users, inject accountId on account-scoped entities
    const accountScopedEntities = [
      'Contact', 'Facility', 'Brand', 'Project',
      'Equipment', 'MaintenanceTask', 'Evidence', 'SignOff'
    ];

    if (this.isClientUser && this.accountId && accountScopedEntities.includes(entityName) && !payload.accountId) {
      payload.accountId = this.accountId;
    }

    return await base44.entities[entityName].create(payload);
  }

  /**
   * Update entity with validation
   */
  async update(entityName, id, data) {
    // Validate access first
    await this.get(entityName, id);
    return await base44.entities[entityName].update(id, data);
  }

  /**
   * Delete entity with validation
   */
  async delete(entityName, id) {
    // Validate access first
    await this.get(entityName, id);
    return await base44.entities[entityName].delete(id);
  }

  /**
   * Create audit event
   */
  async logAudit(entityName, entityId, action, beforeData = null, afterData = null) {
    const user = await base44.auth.me();
    return await this.create('AuditEvent', {
      entityName,
      entityId,
      action,
      actor: user.email,
      actorId: user.id,
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * React hook for data access
 */
export function useDataHelper(activeWorkspace, activeAccountId = null, isClientUser = false) {
  if (!activeWorkspace) return null;
  return new DataHelper(activeWorkspace.id, activeAccountId, isClientUser);
}