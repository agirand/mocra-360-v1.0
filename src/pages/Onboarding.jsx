import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check existing memberships
      const memberships = await base44.entities.WorkspaceMembership.filter({
        userEmail: currentUser.email,
        status: 'active'
      });

      if (memberships.length > 0) {
        // User already has workspaces, redirect to dashboard
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      // Check if this is the platform admin (first admin user)
      if (currentUser.role === 'admin') {
        // Auto-create platform workspace for admin
        await createPlatformWorkspace(currentUser);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking user status:', error);
      setLoading(false);
    }
  };

  const createPlatformWorkspace = async (currentUser) => {
    setCreating(true);
    try {
      // Create platform workspace
      const workspace = await base44.entities.Workspace.create({
        name: 'Platform',
        type: 'consultant',
        status: 'active',
        subscriptionTier: 'enterprise',
        createdByUserId: currentUser.id
      });

      // Create membership as platform_admin
      await base44.entities.WorkspaceMembership.create({
        workspaceId: workspace.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        role: 'platform_admin',
        status: 'active'
      });

      // Redirect to dashboard
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Error creating platform workspace:', error);
      setCreating(false);
      setLoading(false);
    }
  };

  if (loading || creating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">
            {creating ? 'Setting up your workspace...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to MOCRA 360</h1>
          <p className="text-slate-600">
            Get started by creating your first workspace
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Create a Workspace</CardTitle>
            <CardDescription>
              A workspace is where you'll manage your accounts, contacts, facilities, and compliance projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start text-left"
                onClick={() => window.location.href = createPageUrl('CreateWorkspace') + '?type=consultant'}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">Consultant Workspace</p>
                    <p className="text-sm text-slate-500 mt-1">
                      For consulting firms managing multiple client accounts
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 shrink-0 ml-auto" />
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start text-left"
                onClick={() => window.location.href = createPageUrl('CreateWorkspace') + '?type=client'}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">Client Workspace</p>
                    <p className="text-sm text-slate-500 mt-1">
                      For companies managing their own compliance
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 shrink-0 ml-auto" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Need help? Contact support@mocra360.com
        </p>
      </div>
    </div>
  );
}