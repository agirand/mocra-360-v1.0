import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Shield, Building2, Users, Search, Plus, Edit, Trash2, UserPlus } from 'lucide-react';

export default function ControlCenter() {
  const { isPlatformAdmin, loading: workspaceLoading } = useWorkspace();
  const [workspaces, setWorkspaces] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('workspaces');
  
  // Dialogs
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [selectedWorkspaceForMember, setSelectedWorkspaceForMember] = useState(null);
  
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    type: 'consultant',
    status: 'active',
    subscriptionTier: 'free'
  });
  
  const [memberForm, setMemberForm] = useState({
    userEmail: '',
    role: 'workspace_user'
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin) {
      loadData();
    }
  }, [isPlatformAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workspacesData, membershipsData] = await Promise.all([
        base44.entities.Workspace.list(),
        base44.entities.WorkspaceMembership.list()
      ]);
      setWorkspaces(workspacesData.sort((a, b) => a.name.localeCompare(b.name)));
      setMemberships(membershipsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    setSaving(true);
    try {
      if (editingWorkspace) {
        await base44.entities.Workspace.update(editingWorkspace.id, workspaceForm);
      } else {
        const user = await base44.auth.me();
        await base44.entities.Workspace.create({
          ...workspaceForm,
          createdByUserId: user.id
        });
      }
      setShowWorkspaceDialog(false);
      setEditingWorkspace(null);
      setWorkspaceForm({ name: '', type: 'consultant', status: 'active', subscriptionTier: 'free' });
      loadData();
    } catch (error) {
      console.error('Error saving workspace:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedWorkspaceForMember || !memberForm.userEmail) return;
    setSaving(true);
    try {
      await base44.entities.WorkspaceMembership.create({
        workspaceId: selectedWorkspaceForMember.id,
        userId: '',
        userEmail: memberForm.userEmail,
        role: memberForm.role,
        status: 'invited'
      });
      setShowMemberDialog(false);
      setSelectedWorkspaceForMember(null);
      setMemberForm({ userEmail: '', role: 'workspace_user' });
      loadData();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEditWorkspace = (workspace) => {
    setEditingWorkspace(workspace);
    setWorkspaceForm({
      name: workspace.name,
      type: workspace.type,
      status: workspace.status,
      subscriptionTier: workspace.subscriptionTier || 'free'
    });
    setShowWorkspaceDialog(true);
  };

  const openAddMember = (workspace) => {
    setSelectedWorkspaceForMember(workspace);
    setShowMemberDialog(true);
  };

  const getWorkspaceMemberCount = (workspaceId) => {
    return memberships.filter(m => m.workspaceId === workspaceId).length;
  };

  const getWorkspaceMembers = (workspaceId) => {
    return memberships.filter(m => m.workspaceId === workspaceId);
  };

  // Access control
  if (!workspaceLoading && !isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Shield className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">This page is only accessible to platform administrators.</p>
      </div>
    );
  }

  if (loading || workspaceLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Center"
        description="Manage workspaces and platform users"
        actionLabel="New Workspace"
        onAction={() => {
          setEditingWorkspace(null);
          setWorkspaceForm({ name: '', type: 'consultant', status: 'active', subscriptionTier: 'free' });
          setShowWorkspaceDialog(true);
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces ({workspaces.length})</TabsTrigger>
          <TabsTrigger value="members">All Members ({memberships.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="mt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          <div className="grid gap-4">
            {filteredWorkspaces.map(workspace => (
              <Card key={workspace.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        workspace.type === 'consultant' ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}>
                        {workspace.type === 'consultant' 
                          ? <Users className="h-6 w-6 text-blue-600" />
                          : <Building2 className="h-6 w-6 text-emerald-600" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{workspace.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={workspace.type === 'consultant' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-emerald-100 text-emerald-700'
                            }
                          >
                            {workspace.type}
                          </Badge>
                          <StatusBadge status={workspace.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span>{getWorkspaceMemberCount(workspace.id)} members</span>
                          <span>Tier: {workspace.subscriptionTier || 'free'}</span>
                          <span>Created: {new Date(workspace.created_date).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Members preview */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getWorkspaceMembers(workspace.id).slice(0, 5).map(member => (
                            <div key={member.id} className="flex items-center gap-1.5 bg-slate-100 rounded-full px-2.5 py-1 text-xs">
                              <span>{member.userEmail}</span>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {member.role.replace('workspace_', '').replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                          {getWorkspaceMemberCount(workspace.id) > 5 && (
                            <span className="text-xs text-slate-500 py-1">
                              +{getWorkspaceMemberCount(workspace.id) - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openAddMember(workspace)}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditWorkspace(workspace)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="grid gap-3">
            {memberships.map(member => {
              const workspace = workspaces.find(w => w.id === member.workspaceId);
              return (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium text-slate-600">
                            {member.userEmail?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{member.userEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {member.role.replace('workspace_', '').replace('_', ' ')}
                            </Badge>
                            <StatusBadge status={member.status} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{workspace?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{workspace?.type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Workspace Dialog */}
      <Dialog open={showWorkspaceDialog} onOpenChange={setShowWorkspaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkspace ? 'Edit Workspace' : 'Create Workspace'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workspace Name *</Label>
              <Input
                value={workspaceForm.name}
                onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                placeholder="Enter workspace name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={workspaceForm.type}
                  onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={workspaceForm.status}
                  onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select
                value={workspaceForm.subscriptionTier}
                onValueChange={(value) => setWorkspaceForm({ ...workspaceForm, subscriptionTier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkspaceDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkspace} disabled={saving || !workspaceForm.name.trim()}>
              {saving ? 'Saving...' : (editingWorkspace ? 'Save Changes' : 'Create Workspace')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {selectedWorkspaceForMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={memberForm.userEmail}
                onChange={(e) => setMemberForm({ ...memberForm, userEmail: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={memberForm.role}
                onValueChange={(value) => setMemberForm({ ...memberForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                  <SelectItem value="workspace_admin">Workspace Admin</SelectItem>
                  <SelectItem value="workspace_user">Workspace User</SelectItem>
                  <SelectItem value="limited_user">Limited User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={saving || !memberForm.userEmail.trim()}>
              {saving ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}