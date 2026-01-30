import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { FolderKanban, AlertCircle } from 'lucide-react';

export default function ClientProjects() {
  const { activeAccountId, activeWorkspace, isClientUser } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeAccountId && activeWorkspace) {
      loadProjects();
    }
  }, [activeAccountId, activeWorkspace]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await base44.entities.Project.filter({
        accountId: activeAccountId,
        workspaceId: activeWorkspace.id
      });
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
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
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Compliance projects for your company"
        showAction={false}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Your consultant hasn't created any projects yet"
        />
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Card key={project.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-lg">{project.title}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={project.status} />
                      <StatusBadge status={project.priority} />
                    </div>
                    <p className="text-sm text-slate-500 mt-2 capitalize">
                      {project.projectType?.replace(/_/g, ' ')}
                    </p>
                    {project.description && (
                      <p className="text-sm text-slate-600 mt-2">{project.description}</p>
                    )}
                  </div>
                  {project.dueDate && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Due Date</p>
                      <p className="text-sm font-medium">{new Date(project.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}