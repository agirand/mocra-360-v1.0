import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Factory, Search, MapPin, Building2, Filter } from 'lucide-react';

const FACILITY_TYPES = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'lab', label: 'Lab' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
];

export default function Facilities() {
  const { activeWorkspace, canEdit, loading: workspaceLoading } = useWorkspace();
  const [facilities, setFacilities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    facilityType: 'manufacturing',
    accountId: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadData();
    }
  }, [activeWorkspace]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facilitiesData, accountsData] = await Promise.all([
        base44.entities.Facility.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Account.filter({ workspaceId: activeWorkspace.id })
      ]);
      setFacilities(facilitiesData.sort((a, b) => a.name.localeCompare(b.name)));
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.accountId || !canEdit) return;
    setSaving(true);
    try {
      await base44.entities.Facility.create({
        ...formData,
        workspaceId: activeWorkspace.id
      });
      setShowCreateDialog(false);
      setFormData({
        name: '',
        facilityType: 'manufacturing',
        accountId: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating facility:', error);
      alert('Failed to create facility. You may not have permission.');
    } finally {
      setSaving(false);
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const formatAddress = (facility) => {
    const parts = [facility.city, facility.state, facility.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || facility.facilityType === typeFilter;
    const matchesAccount = accountFilter === 'all' || facility.accountId === accountFilter;
    return matchesSearch && matchesType && matchesAccount;
  });

  if (workspaceLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Facilities"
        description="Manage manufacturing and operational facilities"
        actionLabel={canEdit ? "New Facility" : null}
        onAction={() => setShowCreateDialog(true)}
        showAction={canEdit}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {FACILITY_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Facilities List */}
      {filteredFacilities.length === 0 ? (
        <EmptyState
          icon={Factory}
          title={searchQuery || typeFilter !== 'all' || accountFilter !== 'all' 
            ? "No facilities match your filters" 
            : "No facilities yet"}
          description={searchQuery || typeFilter !== 'all' || accountFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Add facilities to track manufacturing and operational locations"}
          actionLabel="Add Facility"
          onAction={() => setShowCreateDialog(true)}
          showAction={canEdit && !searchQuery && typeFilter === 'all' && accountFilter === 'all'}
        />
      ) : (
        <div className="grid gap-3">
          {filteredFacilities.map(facility => (
            <Card key={facility.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Factory className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900">{facility.name}</span>
                      <p className="text-sm text-slate-500 capitalize">
                        {facility.facilityType?.replace(/_/g, ' ')}
                      </p>
                      {formatAddress(facility) && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {formatAddress(facility)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link 
                    to={createPageUrl('AccountDetail') + `?id=${facility.accountId}`}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 shrink-0"
                  >
                    <Building2 className="h-3 w-3" />
                    {getAccountName(facility.accountId)}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Facility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Account *</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Facility Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Manufacturing Plant"
              />
            </div>
            <div className="space-y-2">
              <Label>Facility Type</Label>
              <Select
                value={formData.facilityType}
                onValueChange={(value) => setFormData({ ...formData, facilityType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                placeholder="123 Industrial Way"
              />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                placeholder="Suite, Unit, Building, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this facility..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreate} 
              disabled={saving || !formData.name.trim() || !formData.accountId}
            >
              {saving ? 'Adding...' : 'Add Facility'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}