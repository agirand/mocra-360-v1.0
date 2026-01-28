import React from 'react';
import { useWorkspace } from './WorkspaceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Users, Check } from 'lucide-react';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, loading } = useWorkspace();

  if (loading || !activeWorkspace) {
    return (
      <Button variant="ghost" disabled className="gap-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm font-medium">{activeWorkspace.name}</span>
          <Badge 
            variant="secondary" 
            className={`text-[10px] px-1.5 py-0 shrink-0 ${
              activeWorkspace.type === 'consultant' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {activeWorkspace.type === 'consultant' ? 'Consultant' : 'Client'}
          </Badge>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          Your Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchWorkspace(workspace)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{workspace.name}</span>
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-1.5 py-0 shrink-0 ${
                  workspace.type === 'consultant' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {workspace.type === 'consultant' ? 'C' : 'D'}
              </Badge>
            </div>
            {workspace.id === activeWorkspace?.id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}