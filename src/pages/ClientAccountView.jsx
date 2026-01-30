import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { Building2, Users, Factory, Tag, Mail, Phone, Globe, AlertCircle } from 'lucide-react';

export default function ClientAccountView() {
  const { activeAccountId, activeWorkspace, isClientUser } = useWorkspace();
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (activeAccountId && activeWorkspace) {
      loadAccountData();
    }
  }, [activeAccountId, activeWorkspace]);

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const [accountData, contactsData, facilitiesData, brandsData] = await Promise.all([
        base44.entities.Account.filter({ id: activeAccountId }),
        base44.entities.Contact.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id }),
        base44.entities.Facility.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id }),
        base44.entities.Brand.filter({ accountId: activeAccountId, workspaceId: activeWorkspace.id })
      ]);

      if (accountData.length > 0) {
        setAccount(accountData[0]);
      }
      setContacts(contactsData);
      setFacilities(facilitiesData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading account:', error);
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
            <p className="text-sm text-slate-500 mt-1">Please contact your consultant</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!account) {
    return <EmptyState icon={Building2} title="Account not found" />;
  }

  return (
    <div>
      <PageHeader
        title={account.name}
        description={`${account.accountType?.replace(/_/g, ' ')} ${account.industry ? `• ${account.industry}` : ''}`}
        showAction={false}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="facilities">Facilities ({facilities.length})</TabsTrigger>
          <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Compliance Status</span>
                  <StatusBadge status={account.complianceStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Type</span>
                  <span className="text-sm font-medium capitalize">{account.accountType?.replace(/_/g, ' ')}</span>
                </div>
                {account.industry && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Industry</span>
                    <span className="text-sm font-medium">{account.industry}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {account.primaryEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${account.primaryEmail}`} className="text-sm text-blue-600 hover:underline">
                      {account.primaryEmail}
                    </a>
                  </div>
                )}
                {account.primaryPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{account.primaryPhone}</span>
                  </div>
                )}
                {account.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {account.website}
                    </a>
                  </div>
                )}
                {!account.primaryEmail && !account.primaryPhone && !account.website && (
                  <p className="text-sm text-slate-500">No contact information available</p>
                )}
              </CardContent>
            </Card>

            {account.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{account.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          {contacts.length === 0 ? (
            <EmptyState icon={Users} title="No contacts" description="No contacts available for this account" />
          ) : (
            <div className="grid gap-3">
              {contacts.map(contact => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.name}</span>
                          {contact.isPrimary && <StatusBadge status="active" className="text-xs" />}
                        </div>
                        <p className="text-sm text-slate-500">{contact.title} {contact.department && `• ${contact.department}`}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          {contact.email && <span>{contact.email}</span>}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="facilities">
          {facilities.length === 0 ? (
            <EmptyState icon={Factory} title="No facilities" description="No facilities registered for this account" />
          ) : (
            <div className="grid gap-3">
              {facilities.map(facility => (
                <Card key={facility.id}>
                  <CardContent className="p-4">
                    <span className="font-medium">{facility.name}</span>
                    <p className="text-sm text-slate-500 capitalize">{facility.facilityType}</p>
                    {facility.city && (
                      <p className="text-sm text-slate-500">
                        {[facility.city, facility.state, facility.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="brands">
          {brands.length === 0 ? (
            <EmptyState icon={Tag} title="No brands" description="No brands registered for this account" />
          ) : (
            <div className="grid gap-3">
              {brands.map(brand => (
                <Card key={brand.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{brand.name}</span>
                      <StatusBadge status={brand.status} />
                    </div>
                    {brand.description && <p className="text-sm text-slate-500 mt-1">{brand.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}