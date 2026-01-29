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
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search, Mail, Phone, Building2, Filter } from 'lucide-react';

export default function Contacts() {
  const { activeWorkspace, canEdit, loading: workspaceLoading } = useWorkspace();
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    accountId: '',
    isPrimary: false
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
      const [contactsData, accountsData] = await Promise.all([
        base44.entities.Contact.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Account.filter({ workspaceId: activeWorkspace.id })
      ]);
      setContacts(contactsData.sort((a, b) => a.name.localeCompare(b.name)));
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.accountId || !canEdit) return;
    setSaving(true);
    try {
      await base44.entities.Contact.create({
        ...formData,
        workspaceId: activeWorkspace.id
      });
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', phone: '', title: '', department: '', accountId: '', isPrimary: false });
      loadData();
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact. You may not have permission.');
    } finally {
      setSaving(false);
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAccount = accountFilter === 'all' || contact.accountId === accountFilter;
    return matchesSearch && matchesAccount;
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
        title="Contacts"
        description="Manage contacts across all accounts"
        actionLabel={canEdit ? "New Contact" : null}
        onAction={() => setShowCreateDialog(true)}
        showAction={canEdit}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
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

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery || accountFilter !== 'all' ? "No contacts match your filters" : "No contacts yet"}
          description={searchQuery || accountFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Add contacts to track people at your client accounts"}
          actionLabel="Add Contact"
          onAction={() => setShowCreateDialog(true)}
          showAction={canEdit && !searchQuery && accountFilter === 'all'}
        />
      ) : (
        <div className="grid gap-3">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-slate-600">
                        {contact.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{contact.name}</span>
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {contact.title}{contact.department && ` • ${contact.department}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-blue-600">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={createPageUrl('AccountDetail') + `?id=${contact.accountId}`}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 shrink-0"
                  >
                    <Building2 className="h-3 w-3" />
                    {getAccountName(contact.accountId)}
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
            <DialogTitle>Add Contact</DialogTitle>
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
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Job title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Department name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreate} 
              disabled={saving || !formData.name.trim() || !formData.email.trim() || !formData.accountId}
            >
              {saving ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}