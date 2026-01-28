import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from '@/components/ui/StatusBadge';
import { 
  Building2, 
  Users, 
  Factory, 
  Tag, 
  FolderKanban,
  ArrowRight,
  Plus,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const { activeWorkspace, loading: workspaceLoading, canEdit } = useWorkspace();
  const [stats, setStats] = useState({
    accounts: 0,
    contacts: 0,
    facilities: 0,
    brands: 0,
    projects: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeWorkspace) {
      loadDashboardData();
    }
  }, [activeWorkspace]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [accounts, contacts, facilities, brands, projects] = await Promise.all([
        base44.entities.Account.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Contact.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Facility.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Brand.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Project.filter({ workspaceId: activeWorkspace.id })
      ]);

      setStats({
        accounts: accounts.length,
        contacts: contacts.length,
        facilities: facilities.length,
        brands: brands.length,
        projects: projects.length
      });

      // Get recent projects (not done)
      const activeProjects = projects
        .filter(p => p.status !== 'done')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
      setRecentProjects(activeProjects);

      // Get recent accounts
      const sortedAccounts = accounts
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
      setRecentAccounts(sortedAccounts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (workspaceLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Accounts', value: stats.accounts, icon: Building2, page: 'Accounts', color: 'bg-blue-500' },
    { label: 'Contacts', value: stats.contacts, icon: Users, page: 'Contacts', color: 'bg-indigo-500' },
    { label: 'Facilities', value: stats.facilities, icon: Factory, page: 'Facilities', color: 'bg-emerald-500' },
    { label: 'Brands', value: stats.brands, icon: Tag, page: 'Brands', color: 'bg-purple-500' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, page: 'Projects', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome to {activeWorkspace?.brandingName || activeWorkspace?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} to={createPageUrl(stat.page)}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Active Projects</CardTitle>
            <Link to={createPageUrl('Projects')}>
              <Button variant="ghost" size="sm" className="text-slate-500">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No active projects yet</p>
                {canEdit && (
                  <Link to={createPageUrl('Projects')}>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link 
                    key={project.id} 
                    to={createPageUrl('Projects') + `?id=${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{project.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={project.status} />
                        <StatusBadge status={project.priority} />
                      </div>
                    </div>
                    {project.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0 ml-4">
                        <Clock className="h-3 w-3" />
                        {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Accounts</CardTitle>
            <Link to={createPageUrl('Accounts')}>
              <Button variant="ghost" size="sm" className="text-slate-500">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No accounts yet</p>
                {canEdit && (
                  <Link to={createPageUrl('Accounts')}>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Account
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentAccounts.map((account) => (
                  <Link 
                    key={account.id} 
                    to={createPageUrl('AccountDetail') + `?id=${account.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{account.name}</p>
                      <p className="text-sm text-slate-500 capitalize">
                        {account.accountType?.replace(/_/g, ' ') || 'Account'}
                      </p>
                    </div>
                    <StatusBadge status={account.complianceStatus} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}