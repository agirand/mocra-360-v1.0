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
import { FolderKanban, Search, Building2, Factory, Filter, Calendar } from 'lucide-react';

const PROJECT_TYPES = [
  { value: 'health_check_remediation', label: 'Health Check Remediation' },
  { value: 'sop_rollout', label: 'SOP Rollout' },
  { value: 'training_rollout', label: 'Training Rollout' },
  { value: 'adverse_event_investigation', label: 'Adverse Event Investigation' },
  { value: 'equipment_program', label: 'Equipment Program' },
  { value: 'audit_prep', label: 'Audit Prep' },
  { value: 'supplier_qualification', label: 'Supplier Qualification' },
  { value: 'other', label: 'Other' },
];

const PROJECT_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function Projects() {
  const { activeWorkspace, canEdit, loading: workspaceLoading } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    projectType: 'other',
    status: 'not_started',
    priority: 'medium',
    accountId: '',
    facilityId: '',
    dueDate: '',
    description: ''
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
      const [projectsData, accountsData, facilitiesData] = await Promise.all([
        base44.entities.Project.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Account.filter({ workspaceId: activeWorkspace.id }),
        base44.entities.Facility.filter({ workspaceId: activeWorkspace.id })
      ]);
      setProjects(projectsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setAccounts(accountsData);
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !canEdit) return;
    setSaving(true);
    try {
      await base44.entities.Project.create({
        ...formData,
        accountId: formData.accountId || null,
        facilityId: formData.facilityId || null,
        dueDate: formData.dueDate || null,
        workspaceId: activeWorkspace.id
      });
      setShowCreateDialog(false);
      setFormData({
        title: '',
        projectType: 'other',
        status: 'not_started',
        priority: 'medium',
        accountId: '',
        facilityId: '',
        dueDate: '',
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. You may not have permission.');
    } finally {
      setSaving(false);
    }
  };

  const getAccountName = (accountId) => {
    if (!accountId) return null;
    const account = accounts.find(a => a.id === accountId);
    return account?.name;
  };

  const getFacilityName = (facilityId) => {
    if (!facilityId) return null;
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name;
  };

  const getAccountFacilities = (accountId) => {
    if (!accountId) return [];
    return facilities.filter(f => f.accountId === accountId);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.projectType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    const matchesAccount = accountFilter === 'all' || project.accountId === accountFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesAccount;
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
        title="Projects"
        description="Manage compliance and operational projects"
        actionLabel={canEdit ? "New Project" : null}
        onAction={() => setShowCreateDialog(true)}
        showAction={canEdit}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search projects..."
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
              {PROJECT_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Project Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROJECT_TYPES.map(type => (
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
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || accountFilter !== 'all'
            ? "No projects match your filters" 
            : "No projects yet"}
          description={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || accountFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Create projects to track compliance work and operational tasks"}
          actionLabel="Create Project"
          onAction={() => setShowCreateDialog(true)}
          showAction={canEdit && !searchQuery && statusFilter === 'all' && typeFilter === 'all' && priorityFilter === 'all' && accountFilter === 'all'}
        />
      ) : (
        <div className="grid gap-3">
          {filteredProjects.map(project => (
            <Card key={project.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-slate-900">{project.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <StatusBadge status={project.status} />
                      <StatusBadge status={project.priority} />
                      <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded">
                        {project.projectType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      {getAccountName(project.accountId) && (
                        <Link 
                          to={createPageUrl('AccountDetail') + `?id=${project.accountId}`}
                          className="flex items-center gap-1 hover:text-slate-700"
                        >
                          <Building2 className="h-3 w-3" />
                          {getAccountName(project.accountId)}
                        </Link>
                      )}
                      {getFacilityName(project.facilityId) && (
                        <span className="flex items-center gap-1">
                          <Factory className="h-3 w-3" />
                          {getFacilityName(project.facilityId)}
                        </span>
                      )}
                      {project.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{project.description}</p>
                    )}
                  </div>
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
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account (Optional)</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value, facilityId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No specific account</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.accountId && getAccountFacilities(formData.accountId).length > 0 && (
              <div className="space-y-2">
                <Label>Facility (Optional)</Label>
                <Select
                  value={formData.facilityId}
                  onValueChange={(value) => setFormData({ ...formData, facilityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No specific facility</SelectItem>
                    {getAccountFacilities(formData.accountId).map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>{facility.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreate} 
              disabled={saving || !formData.title.trim()}
            >
              {saving ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}