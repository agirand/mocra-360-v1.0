import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from '@/components/ui/PageHeader';
import { Building2, Users, Factory, Tag, FolderKanban, AlertCircle } from 'lucide-react';

export default function ClientDashboard() {
  const { activeAccountId, activeWorkspace, isClientUser } = useWorkspace();
  const [account, setAccount] = useState(null);
  const [stats, setStats] = useState({
    contacts: 0,
    facilities: 0,
    brands: 0,
    projects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeAccountId && activeWorkspace) {
      loadDashboardData();
    }
  }, [activeAccountId, activeWorkspace]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [accountData, contacts, facilities, brands, projects] = await Promise.all([
        base44.entities.Account.filter({ id: activeAccountId }),
        base44.entities.Contact.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id }),
        base44.entities.Facility.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id }),
        base44.entities.Brand.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id }),
        base44.entities.Project.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id })
      ]);

      if (accountData.length > 0) {
        setAccount(accountData[0]);
      }

      setStats({
        contacts: contacts.length,
        facilities: facilities.length,
        brands: brands.length,
        projects: projects.length
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isClientUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Access Restricted</p>
            <p className="text-sm text-slate-500 mt-1">This page is for client users only</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeAccountId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No Account Assigned</p>
            <p className="text-sm text-slate-500 mt-1">Please contact your consultant to assign you to an account</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${account?.name || 'Client Portal'}`}
        description="Your company's compliance dashboard"
        showAction={false}
      />

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Contacts</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacts}</div>
            <p className="text-xs text-slate-500 mt-1">Active contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Facilities</CardTitle>
            <Factory className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facilities}</div>
            <p className="text-xs text-slate-500 mt-1">Registered facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Brands</CardTitle>
            <Tag className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.brands}</div>
            <p className="text-xs text-slate-500 mt-1">Active brands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-slate-500 mt-1">Active projects</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Company Type</p>
              <p className="font-medium capitalize">{account?.accountType?.replace(/_/g, ' ')}</p>
            </div>
            {account?.industry && (
              <div>
                <p className="text-sm text-slate-500">Industry</p>
                <p className="font-medium">{account.industry}</p>
              </div>
            )}
          </div>
          {account?.notes && (
            <div>
              <p className="text-sm text-slate-500 mb-1">Notes</p>
              <p className="text-sm">{account.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}