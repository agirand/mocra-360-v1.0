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
import StatusBadge from '@/components/ui/StatusBadge';
import { Building2, Search, Filter, ArrowRight, Globe, Mail, Phone } from 'lucide-react';

const ACCOUNT_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'brand', label: 'Brand' },
  { value: 'packager', label: 'Packager' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'lab', label: 'Lab' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'other', label: 'Other' },
];

const COMPLIANCE_STATUSES = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'non_compliant', label: 'Non-Compliant' },
];

export default function Accounts() {
  const { activeWorkspace, canEdit, loading: workspaceLoading } = useWorkspace();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    accountType: 'manufacturer',
    industry: '',
    complianceStatus: 'unknown',
    primaryEmail: '',
    primaryPhone: '',
    website: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadAccounts();
    }
  }, [activeWorkspace]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Account.filter({ workspaceId: activeWorkspace.id });
      setAccounts(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Account.create({
        ...formData,
        workspaceId: activeWorkspace.id
      });
      setShowCreateDialog(false);
      setFormData({
        name: '',
        accountType: 'manufacturer',
        industry: '',
        complianceStatus: 'unknown',
        primaryEmail: '',
        primaryPhone: '',
        website: '',
        notes: ''
      });
      loadAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || account.accountType === typeFilter;
    const matchesStatus = statusFilter === 'all' || account.complianceStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (workspaceLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your client accounts and companies"
        actionLabel={canEdit ? "New Account" : null}
        onAction={() => setShowCreateDialog(true)}
        showAction={canEdit}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search accounts..."
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
            {ACCOUNT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {COMPLIANCE_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
            ? "No accounts match your filters" 
            : "No accounts yet"}
          description={searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Create your first account to start managing client relationships"}
          actionLabel="Create Account"
          onAction={() => setShowCreateDialog(true)}
          showAction={canEdit && !searchQuery && typeFilter === 'all' && statusFilter === 'all'}
        />
      ) : (
        <div className="grid gap-4">
          {filteredAccounts.map(account => (
            <Link key={account.id} to={createPageUrl('AccountDetail') + `?id=${account.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{account.name}</h3>
                          <StatusBadge status={account.complianceStatus} />
                        </div>
                        <p className="text-sm text-slate-500 mt-1 capitalize">
                          {account.accountType?.replace(/_/g, ' ')}
                          {account.industry && ` • ${account.industry}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          {account.primaryEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {account.primaryEmail}
                            </span>
                          )}
                          {account.website && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {account.website}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="Enter company name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compliance Status</Label>
                <Select
                  value={formData.complianceStatus}
                  onValueChange={(value) => setFormData({ ...formData, complianceStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLIANCE_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Cosmetics, Personal Care"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryEmail">Primary Email</Label>
                <Input
                  id="primaryEmail"
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.primaryEmail}
                  onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryPhone">Primary Phone</Label>
                <Input
                  id="primaryPhone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.primaryPhone}
                  onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://www.company.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this account..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name.trim()}>
              {saving ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}