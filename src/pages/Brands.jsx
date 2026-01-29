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
import { Tag, Search, Building2, Filter } from 'lucide-react';

export default function Brands() {
  const { activeWorkspace, canEdit, loading: workspaceLoading } = useWorkspace();
  const [brands, setBrands] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    accountId: '',
    description: '',
    logoUrl: ''
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
      const [brandsData, accountsData] = await Promise.all([
        base44.entities.Brand.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Account.filter({ workspaceId: activeWorkspace.id })
      ]);
      setBrands(brandsData.sort((a, b) => a.name.localeCompare(b.name)));
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
      await base44.entities.Brand.create({
        ...formData,
        workspaceId: activeWorkspace.id
      });
      setShowCreateDialog(false);
      setFormData({ name: '', status: 'active', accountId: '', description: '', logoUrl: '' });
      loadData();
    } catch (error) {
      console.error('Error creating brand:', error);
      alert('Failed to create brand. You may not have permission.');
    } finally {
      setSaving(false);
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || brand.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || brand.accountId === accountFilter;
    return matchesSearch && matchesStatus && matchesAccount;
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
        title="Brands"
        description="Manage product brands and labels"
        actionLabel={canEdit ? "New Brand" : null}
        onAction={() => setShowCreateDialog(true)}
        showAction={canEdit}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Brands List */}
      {filteredBrands.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={searchQuery || statusFilter !== 'all' || accountFilter !== 'all' 
            ? "No brands match your filters" 
            : "No brands yet"}
          description={searchQuery || statusFilter !== 'all' || accountFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Add brands to track product lines and labels"}
          actionLabel="Add Brand"
          onAction={() => setShowCreateDialog(true)}
          showAction={canEdit && !searchQuery && statusFilter === 'all' && accountFilter === 'all'}
        />
      ) : (
        <div className="grid gap-3">
          {filteredBrands.map(brand => (
            <Card key={brand.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <Tag className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{brand.name}</span>
                        <StatusBadge status={brand.status} />
                      </div>
                      {brand.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{brand.description}</p>
                      )}
                    </div>
                  </div>
                  <Link 
                    to={createPageUrl('AccountDetail') + `?id=${brand.accountId}`}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 shrink-0"
                  >
                    <Building2 className="h-3 w-3" />
                    {getAccountName(brand.accountId)}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label>Brand Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Brand name"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
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
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the brand..."
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
              {saving ? 'Adding...' : 'Add Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}