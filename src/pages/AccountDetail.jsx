import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { 
  Building2, Users, Factory, Tag, FolderKanban, 
  Mail, Phone, Globe, Edit, Plus, ArrowRight, Trash2
} from 'lucide-react';

export default function AccountDetail() {
  const { activeWorkspace, canEdit, loading: workspaceLoading } = useWorkspace();
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [brands, setBrands] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Create dialogs
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showFacilityDialog, setShowFacilityDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const accountId = urlParams.get('id');

  useEffect(() => {
    if (accountId && activeWorkspace) {
      loadAccount();
    }
  }, [accountId, activeWorkspace]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const [accountData, contactsData, facilitiesData, brandsData, projectsData] = await Promise.all([
        base44.entities.Account.filter({ id: accountId }),
        base44.entities.Contact.filter({ accountId }),
        base44.entities.Facility.filter({ accountId }),
        base44.entities.Brand.filter({ accountId }),
        base44.entities.Project.filter({ accountId })
      ]);
      
      if (accountData.length > 0) {
        setAccount(accountData[0]);
        setEditData(accountData[0]);
      }
      setContacts(contactsData);
      setFacilities(facilitiesData);
      setBrands(brandsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Account.update(account.id, editData);
      setAccount(editData);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating account:', error);
    } finally {
      setSaving(false);
    }
  };

  if (workspaceLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <EmptyState
        icon={Building2}
        title="Account not found"
        description="This account may have been deleted or you don't have access to it."
        actionLabel="Back to Accounts"
        onAction={() => window.location.href = createPageUrl('Accounts')}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={account.name}
        description={`${account.accountType?.replace(/_/g, ' ')} ${account.industry ? `• ${account.industry}` : ''}`}
        backTo="Accounts"
        backLabel="Back to Accounts"
        showAction={false}
      >
        {canEdit && (
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="facilities">Facilities ({facilities.length})</TabsTrigger>
          <TabsTrigger value="brands">Brands ({brands.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
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
          <ContactsTab 
            contacts={contacts} 
            accountId={account.id}
            workspaceId={activeWorkspace.id}
            canEdit={canEdit}
            onRefresh={loadAccount}
          />
        </TabsContent>

        <TabsContent value="facilities">
          <FacilitiesTab 
            facilities={facilities} 
            accountId={account.id}
            workspaceId={activeWorkspace.id}
            canEdit={canEdit}
            onRefresh={loadAccount}
          />
        </TabsContent>

        <TabsContent value="brands">
          <BrandsTab 
            brands={brands} 
            accountId={account.id}
            workspaceId={activeWorkspace.id}
            canEdit={canEdit}
            onRefresh={loadAccount}
          />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsTab 
            projects={projects} 
            accountId={account.id}
            workspaceId={activeWorkspace.id}
            canEdit={canEdit}
            onRefresh={loadAccount}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={editData.accountType}
                  onValueChange={(value) => setEditData({ ...editData, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="packager">Packager</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compliance Status</Label>
                <Select
                  value={editData.complianceStatus}
                  onValueChange={(value) => setEditData({ ...editData, complianceStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                value={editData.industry || ''}
                onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Email</Label>
                <Input
                  value={editData.primaryEmail || ''}
                  onChange={(e) => setEditData({ ...editData, primaryEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Phone</Label>
                <Input
                  value={editData.primaryPhone || ''}
                  onChange={(e) => setEditData({ ...editData, primaryPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={editData.website || ''}
                onChange={(e) => setEditData({ ...editData, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components for tabs
function ContactsTab({ contacts, accountId, workspaceId, canEdit, onRefresh }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', title: '', department: '', isPrimary: false });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await base44.entities.Contact.create({
        ...formData,
        accountId,
        workspaceId
      });
      setShowDialog(false);
      setFormData({ name: '', email: '', phone: '', title: '', department: '', isPrimary: false });
      onRefresh();
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setSaving(false);
    }
  };

  if (contacts.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add contacts associated with this account"
          actionLabel="Add Contact"
          onAction={() => setShowDialog(true)}
          showAction={canEdit}
        />
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.name || !formData.email}>
                {saving ? 'Adding...' : 'Add Contact'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      )}
      <div className="grid gap-3">
        {contacts.map(contact => (
          <Card key={contact.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.name}</span>
                    {contact.isPrimary && (
                      <StatusBadge status="active" className="text-xs" />
                    )}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name || !formData.email}>
              {saving ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FacilitiesTab({ facilities, accountId, workspaceId, canEdit, onRefresh }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', facilityType: 'manufacturing', address1: '', city: '', state: '', postalCode: '', country: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await base44.entities.Facility.create({
        ...formData,
        accountId,
        workspaceId
      });
      setShowDialog(false);
      setFormData({ name: '', facilityType: 'manufacturing', address1: '', city: '', state: '', postalCode: '', country: '' });
      onRefresh();
    } catch (error) {
      console.error('Error creating facility:', error);
    } finally {
      setSaving(false);
    }
  };

  if (facilities.length === 0) {
    return (
      <>
        <EmptyState
          icon={Factory}
          title="No facilities yet"
          description="Add facilities for this account"
          actionLabel="Add Facility"
          onAction={() => setShowDialog(true)}
          showAction={canEdit}
        />
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Facility</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Facility Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Facility Type</Label>
                <Select value={formData.facilityType} onValueChange={(value) => setFormData({ ...formData, facilityType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Street address" value={formData.address1} onChange={(e) => setFormData({ ...formData, address1: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State/Province</Label>
                  <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.name}>
                {saving ? 'Adding...' : 'Add Facility'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Facility
          </Button>
        </div>
      )}
      <div className="grid gap-3">
        {facilities.map(facility => (
          <Card key={facility.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{facility.name}</span>
                  <p className="text-sm text-slate-500 capitalize">{facility.facilityType}</p>
                  {facility.city && (
                    <p className="text-sm text-slate-500">
                      {[facility.city, facility.state, facility.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Facility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Facility Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Facility Type</Label>
              <Select value={formData.facilityType} onValueChange={(value) => setFormData({ ...formData, facilityType: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Street address" value={formData.address1} onChange={(e) => setFormData({ ...formData, address1: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name}>
              {saving ? 'Adding...' : 'Add Facility'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandsTab({ brands, accountId, workspaceId, canEdit, onRefresh }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', status: 'active', description: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await base44.entities.Brand.create({
        ...formData,
        accountId,
        workspaceId
      });
      setShowDialog(false);
      setFormData({ name: '', status: 'active', description: '' });
      onRefresh();
    } catch (error) {
      console.error('Error creating brand:', error);
    } finally {
      setSaving(false);
    }
  };

  if (brands.length === 0) {
    return (
      <>
        <EmptyState
          icon={Tag}
          title="No brands yet"
          description="Add brands for this account"
          actionLabel="Add Brand"
          onAction={() => setShowDialog(true)}
          showAction={canEdit}
        />
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Brand Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.name}>
                {saving ? 'Adding...' : 'Add Brand'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      )}
      <div className="grid gap-3">
        {brands.map(brand => (
          <Card key={brand.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{brand.name}</span>
                    <StatusBadge status={brand.status} />
                  </div>
                  {brand.description && (
                    <p className="text-sm text-slate-500 mt-1">{brand.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Brand Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name}>
              {saving ? 'Adding...' : 'Add Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectsTab({ projects, accountId, workspaceId, canEdit, onRefresh }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ title: '', projectType: 'other', status: 'not_started', priority: 'medium', description: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await base44.entities.Project.create({
        ...formData,
        accountId,
        workspaceId
      });
      setShowDialog(false);
      setFormData({ title: '', projectType: 'other', status: 'not_started', priority: 'medium', description: '' });
      onRefresh();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setSaving(false);
    }
  };

  if (projects.length === 0) {
    return (
      <>
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create compliance projects for this account"
          actionLabel="Create Project"
          onAction={() => setShowDialog(true)}
          showAction={canEdit}
        />
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select value={formData.projectType} onValueChange={(value) => setFormData({ ...formData, projectType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health_check_remediation">Health Check Remediation</SelectItem>
                      <SelectItem value="sop_rollout">SOP Rollout</SelectItem>
                      <SelectItem value="training_rollout">Training Rollout</SelectItem>
                      <SelectItem value="adverse_event_investigation">Adverse Event Investigation</SelectItem>
                      <SelectItem value="equipment_program">Equipment Program</SelectItem>
                      <SelectItem value="audit_prep">Audit Prep</SelectItem>
                      <SelectItem value="supplier_qualification">Supplier Qualification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.title}>
                {saving ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      )}
      <div className="grid gap-3">
        {projects.map(project => (
          <Card key={project.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-medium">{project.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={project.status} />
                    <StatusBadge status={project.priority} />
                  </div>
                  <p className="text-sm text-slate-500 mt-1 capitalize">{project.projectType?.replace(/_/g, ' ')}</p>
                </div>
                {project.dueDate && (
                  <span className="text-sm text-slate-500">
                    Due: {new Date(project.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => setFormData({ ...formData, projectType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_check_remediation">Health Check Remediation</SelectItem>
                    <SelectItem value="sop_rollout">SOP Rollout</SelectItem>
                    <SelectItem value="training_rollout">Training Rollout</SelectItem>
                    <SelectItem value="adverse_event_investigation">Adverse Event Investigation</SelectItem>
                    <SelectItem value="equipment_program">Equipment Program</SelectItem>
                    <SelectItem value="audit_prep">Audit Prep</SelectItem>
                    <SelectItem value="supplier_qualification">Supplier Qualification</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.title}>
              {saving ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}