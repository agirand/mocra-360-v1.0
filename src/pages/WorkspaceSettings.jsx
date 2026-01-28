import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Settings, Users, Building2, UserPlus, Trash2, Shield, Save } from 'lucide-react';

export default function WorkspaceSettings() {
  const { activeWorkspace, canAdmin, userRole, loadUserContext, refreshMemberships } = useWorkspace();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Edit states
  const [formData, setFormData] = useState({
    name: '',
    brandingName: '',
    brandingLogoUrl: ''
  });
  
  // Invite dialog
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'workspace_user'
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadWorkspaceData();
    }
  }, [activeWorkspace]);

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const [workspaces, memberships] = await Promise.all([
        base44.entities.Workspace.filter({ id: activeWorkspace.id }),
        base44.entities.WorkspaceMembership.filter({ workspaceId: activeWorkspace.id })
      ]);
      
      if (workspaces.length > 0) {
        setWorkspace(workspaces[0]);
        setFormData({
          name: workspaces[0].name || '',
          brandingName: workspaces[0].brandingName || '',
          brandingLogoUrl: workspaces[0].brandingLogoUrl || ''
        });
      }
      setMembers(memberships);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Workspace.update(workspace.id, formData);
      setWorkspace({ ...workspace, ...formData });
      await loadUserContext();
    } catch (error) {
      console.error('Error saving workspace:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) return;
    setInviting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.WorkspaceMembership.create({
        workspaceId: activeWorkspace.id,
        userId: '',
        userEmail: inviteForm.email,
        role: inviteForm.role,
        status: 'invited'
      });
      setShowInviteDialog(false);
      setInviteForm({ email: '', role: 'workspace_user' });
      loadWorkspaceData();
      refreshMemberships();
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await base44.entities.WorkspaceMembership.delete(memberId);
      loadWorkspaceData();
      refreshMemberships();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      await base44.entities.WorkspaceMembership.update(memberId, { role: newRole });
      loadWorkspaceData();
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Settings"
        description={`Manage settings for ${workspace.name}`}
        showAction={false}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic workspace configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Workspace name"
                  disabled={!canAdmin}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Workspace Type</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Badge 
                      variant="secondary" 
                      className={workspace.type === 'consultant' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-emerald-100 text-emerald-700'
                      }
                    >
                      {workspace.type === 'consultant' ? 'Consultant' : 'Client'}
                    </Badge>
                    <span className="text-sm text-slate-500">(cannot be changed)</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Subscription Tier</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Badge variant="secondary" className="bg-slate-100">
                      {workspace.subscriptionTier || 'free'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>Customize how your workspace appears</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={formData.brandingName}
                  onChange={(e) => setFormData({ ...formData, brandingName: e.target.value })}
                  placeholder="Custom display name"
                  disabled={!canAdmin}
                />
                <p className="text-xs text-slate-500">This name will be shown instead of the workspace name</p>
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={formData.brandingLogoUrl}
                  onChange={(e) => setFormData({ ...formData, brandingLogoUrl: e.target.value })}
                  placeholder="https://..."
                  disabled={!canAdmin}
                />
              </div>
              {canAdmin && (
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>Manage who has access to this workspace</CardDescription>
              </div>
              {canAdmin && (
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map(member => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
                        <span className="text-sm font-medium text-slate-600">
                          {member.userEmail?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{member.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={member.status} />
                          {member.role === 'platform_admin' && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Platform Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {canAdmin && member.role !== 'platform_admin' ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workspace_admin">Admin</SelectItem>
                            <SelectItem value="workspace_user">User</SelectItem>
                            <SelectItem value="limited_user">Limited</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {member.role.replace('workspace_', '').replace('_', ' ')}
                        </Badge>
                      )}
                      {canAdmin && member.role !== 'platform_admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No members yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="colleague@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace_admin">
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-xs text-slate-500">Full access to workspace settings</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="workspace_user">
                    <div>
                      <p className="font-medium">User</p>
                      <p className="text-xs text-slate-500">Can create and edit records</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="limited_user">
                    <div>
                      <p className="font-medium">Limited</p>
                      <p className="text-xs text-slate-500">View-only access with limited actions</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteForm.email.trim()}>
              {inviting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}