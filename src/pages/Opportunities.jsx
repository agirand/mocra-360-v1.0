import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
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
import { TrendingUp, Search, Filter, Shield, DollarSign, Mail, User } from 'lucide-react';

const STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export default function Opportunities() {
  const { isPlatformAdmin, loading: workspaceLoading } = useWorkspace();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stage: 'lead',
    value: '',
    accountName: '',
    contactName: '',
    contactEmail: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin) {
      loadOpportunities();
    }
  }, [isPlatformAdmin]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Opportunity.list();
      setOpportunities(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null
      };
      
      if (editingOpportunity) {
        await base44.entities.Opportunity.update(editingOpportunity.id, dataToSave);
      } else {
        await base44.entities.Opportunity.create(dataToSave);
      }
      
      setShowCreateDialog(false);
      setEditingOpportunity(null);
      setFormData({
        name: '',
        stage: 'lead',
        value: '',
        accountName: '',
        contactName: '',
        contactEmail: '',
        notes: ''
      });
      loadOpportunities();
    } catch (error) {
      console.error('Error saving opportunity:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      name: opportunity.name || '',
      stage: opportunity.stage || 'lead',
      value: opportunity.value?.toString() || '',
      accountName: opportunity.accountName || '',
      contactName: opportunity.contactName || '',
      contactEmail: opportunity.contactEmail || '',
      notes: opportunity.notes || ''
    });
    setShowCreateDialog(true);
  };

  const openCreate = () => {
    setEditingOpportunity(null);
    setFormData({
      name: '',
      stage: 'lead',
      value: '',
      accountName: '',
      contactName: '',
      contactEmail: '',
      notes: ''
    });
    setShowCreateDialog(true);
  };

  // Access control - ONLY platform_admin can access
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
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || opp.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Calculate pipeline stats
  const pipelineValue = opportunities
    .filter(o => !['won', 'lost'].includes(o.stage))
    .reduce((sum, o) => sum + (o.value || 0), 0);
  const wonValue = opportunities
    .filter(o => o.stage === 'won')
    .reduce((sum, o) => sum + (o.value || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Sales pipeline and prospect management"
        actionLabel="New Opportunity"
        onAction={openCreate}
      />

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Opportunities</p>
            <p className="text-2xl font-bold text-slate-900">{opportunities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pipeline Value</p>
            <p className="text-2xl font-bold text-slate-900">${pipelineValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Won Deals</p>
            <p className="text-2xl font-bold text-emerald-600">${wonValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Active Deals</p>
            <p className="text-2xl font-bold text-slate-900">
              {opportunities.filter(o => !['won', 'lost'].includes(o.stage)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(stage => (
              <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={searchQuery || stageFilter !== 'all' ? "No opportunities match your filters" : "No opportunities yet"}
          description={searchQuery || stageFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Start tracking your sales pipeline by creating opportunities"}
          actionLabel="Create Opportunity"
          onAction={openCreate}
          showAction={!searchQuery && stageFilter === 'all'}
        />
      ) : (
        <div className="grid gap-4">
          {filteredOpportunities.map(opportunity => (
            <Card 
              key={opportunity.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEdit(opportunity)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-slate-900">{opportunity.name}</h3>
                      <StatusBadge status={opportunity.stage} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      {opportunity.accountName && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {opportunity.accountName}
                        </span>
                      )}
                      {opportunity.contactName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {opportunity.contactName}
                        </span>
                      )}
                      {opportunity.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {opportunity.contactEmail}
                        </span>
                      )}
                    </div>
                    {opportunity.notes && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{opportunity.notes}</p>
                    )}
                  </div>
                  {opportunity.value && (
                    <div className="flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {opportunity.value.toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOpportunity ? 'Edit Opportunity' : 'Create Opportunity'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Opportunity Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp - Compliance Package"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deal Value ($)</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="10000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prospect Company Name</Label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this opportunity..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving...' : (editingOpportunity ? 'Save Changes' : 'Create Opportunity')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}