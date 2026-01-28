import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, ArrowLeft, Loader2, Plus, X, Mail } from 'lucide-react';

export default function CreateWorkspace() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type') || 'consultant';
  
  const [formData, setFormData] = useState({
    name: '',
    type: initialType,
    brandingName: '',
  });
  
  const [invites, setInvites] = useState([]);
  const [newInvite, setNewInvite] = useState({ email: '', role: 'workspace_user' });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const addInvite = () => {
    if (newInvite.email && !invites.find(i => i.email === newInvite.email)) {
      setInvites([...invites, { ...newInvite }]);
      setNewInvite({ email: '', role: 'workspace_user' });
    }
  };

  const removeInvite = (email) => {
    setInvites(invites.filter(i => i.email !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      // Create workspace
      const workspace = await base44.entities.Workspace.create({
        name: formData.name,
        type: formData.type,
        brandingName: formData.brandingName || null,
        status: 'active',
        subscriptionTier: 'free',
        createdByUserId: user.id
      });

      // Create membership for current user as workspace_admin
      await base44.entities.WorkspaceMembership.create({
        workspaceId: workspace.id,
        userId: user.id,
        userEmail: user.email,
        role: 'workspace_admin',
        status: 'active'
      });

      // If company workspace, create default Account for immediate CRM use
      if (formData.type === 'client') {
        await base44.entities.Account.create({
          workspaceId: workspace.id,
          name: formData.name,
          accountType: 'other',
          complianceStatus: 'unknown'
        });
      }

      // Create invited memberships
      for (const invite of invites) {
        await base44.entities.WorkspaceMembership.create({
          workspaceId: workspace.id,
          userId: '', // Will be filled when user accepts
          userEmail: invite.email,
          role: invite.role,
          status: 'invited'
        });
        
        // Send invitation email
        await base44.functions.invoke('sendInviteEmail', {
          recipientEmail: invite.email,
          workspaceName: formData.name,
          role: invite.role,
          inviterName: user.full_name || user.email
        });
      }

      // Set as active workspace and redirect
      localStorage.setItem('activeWorkspaceId', workspace.id);
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Error creating workspace:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-xl mx-auto pt-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => window.location.href = createPageUrl('Onboarding')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                formData.type === 'consultant' ? 'bg-blue-100' : 'bg-emerald-100'
              }`}>
                {formData.type === 'consultant' 
                  ? <Users className="h-5 w-5 text-blue-600" />
                  : <Building2 className="h-5 w-5 text-emerald-600" />
                }
              </div>
              <div>
                <CardTitle>Create Workspace</CardTitle>
                <CardDescription>
                  Set up your {formData.type === 'consultant' ? 'consulting' : 'company'} workspace
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Consulting or Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Workspace Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultant">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Consultant
                      </div>
                    </SelectItem>
                    <SelectItem value="client">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        Company
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandingName">Custom Branding Name (Optional)</Label>
                <Input
                  id="brandingName"
                  placeholder="Display name for branding"
                  value={formData.brandingName}
                  onChange={(e) => setFormData({ ...formData, brandingName: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <Label>Invite Team Members (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value={newInvite.role}
                    onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workspace_admin">Admin</SelectItem>
                      <SelectItem value="workspace_user">User</SelectItem>
                      <SelectItem value="limited_user">Limited</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={addInvite}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {invites.length > 0 && (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div 
                        key={invite.email} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">{invite.email}</span>
                          <Badge variant="secondary" className="text-xs">
                            {invite.role.replace('workspace_', '').replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeInvite(invite.email)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || !formData.name.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}