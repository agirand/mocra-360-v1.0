import React from 'react';
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  // Compliance status
  unknown: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  compliant: 'bg-emerald-100 text-emerald-700',
  non_compliant: 'bg-red-100 text-red-700',
  
  // Project status
  not_started: 'bg-slate-100 text-slate-600',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-emerald-100 text-emerald-700',
  
  // General
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  invited: 'bg-blue-100 text-blue-700',
  disabled: 'bg-red-100 text-red-700',
  
  // Priority
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  
  // Opportunity stages
  lead: 'bg-slate-100 text-slate-600',
  qualified: 'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiation: 'bg-amber-100 text-amber-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

const statusLabels = {
  unknown: 'Unknown',
  in_progress: 'In Progress',
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  not_started: 'Not Started',
  blocked: 'Blocked',
  done: 'Done',
  active: 'Active',
  inactive: 'Inactive',
  invited: 'Invited',
  disabled: 'Disabled',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600';
  const label = statusLabels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Badge variant="secondary" className={`${style} font-medium ${className}`}>
      {label}
    </Badge>
  );
}