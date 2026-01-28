import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/ui/PageHeader';
import { Building2, Users, TrendingUp, Activity, FolderKanban, Shield } from 'lucide-react';

export default function SaaSDashboard() {
  const { isPlatformAdmin, loading: workspaceLoading } = useWorkspace();
  const [stats, setStats] = useState({
    totalWorkspaces: 0,
    consultantWorkspaces: 0,
    clientWorkspaces: 0,
    totalUsers: 0,
    totalAccounts: 0,
    totalProjects: 0,
    totalOpportunities: 0
  });
  const [recentWorkspaces, setRecentWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPlatformAdmin) {
      loadStats();
    }
  }, [isPlatformAdmin]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [workspaces, memberships, accounts, projects, opportunities] = await Promise.all([
        base44.entities.Workspace.list(),
        base44.entities.WorkspaceMembership.list(),
        base44.entities.Account.list(),
        base44.entities.Project.list(),
        base44.entities.Opportunity.list()
      ]);

      setStats({
        totalWorkspaces: workspaces.length,
        consultantWorkspaces: workspaces.filter(w => w.type === 'consultant').length,
        clientWorkspaces: workspaces.filter(w => w.type === 'client').length,
        totalUsers: [...new Set(memberships.map(m => m.userEmail))].length,
        totalAccounts: accounts.length,
        totalProjects: projects.length,
        totalOpportunities: opportunities.length
      });

      setRecentWorkspaces(
        workspaces
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Workspaces', value: stats.totalWorkspaces, icon: Building2, color: 'bg-blue-500' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-indigo-500' },
    { label: 'Total Accounts', value: stats.totalAccounts, icon: Activity, color: 'bg-emerald-500' },
    { label: 'Opportunities', value: stats.totalOpportunities, icon: TrendingUp, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="SaaS Dashboard"
        description="Platform-wide metrics and analytics"
        showAction={false}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workspace Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workspace Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium">Consultant Workspaces</span>
                </div>
                <span className="text-2xl font-bold">{stats.consultantWorkspaces}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="font-medium">Client Workspaces</span>
                </div>
                <span className="text-2xl font-bold">{stats.clientWorkspaces}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Workspaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWorkspaces.map(workspace => (
                <div key={workspace.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium">{workspace.name}</span>
                    <p className="text-sm text-slate-500">
                      Created {new Date(workspace.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={workspace.type === 'consultant' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                    }
                  >
                    {workspace.type}
                  </Badge>
                </div>
              ))}
              {recentWorkspaces.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No workspaces yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{stats.totalProjects}</p>
              <p className="text-sm text-slate-500">Total Projects</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{stats.totalAccounts}</p>
              <p className="text-sm text-slate-500">Client Accounts</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{stats.totalWorkspaces}</p>
              <p className="text-sm text-slate-500">Active Workspaces</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
              <p className="text-sm text-slate-500">Platform Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}