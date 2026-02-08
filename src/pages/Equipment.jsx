import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { Wrench, Search, AlertCircle, Calendar } from 'lucide-react';

export default function Equipment() {
  const { activeWorkspace, activeAccountId, isClientUser, canEdit } = useWorkspace();
  
  const [equipment, setEquipment] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (activeWorkspace) {
      loadData();
    }
  }, [activeWorkspace, activeAccountId]);

  const loadData = async () => {
    if (!activeWorkspace) return;
    
    setLoading(true);
    try {
      // Build filters with workspace and account isolation
      const equipmentFilter = { workspaceId: activeWorkspace.id };
      const facilityFilter = { workspaceId: activeWorkspace.id };
      
      if (isClientUser && activeAccountId) {
        equipmentFilter.accountId = activeAccountId;
        facilityFilter.accountId = activeAccountId;
      }

      const [equipmentData, facilitiesData] = await Promise.all([
        base44.entities.Equipment.filter(equipmentFilter),
        base44.entities.Facility.filter(facilityFilter)
      ]);
      
      // Check for overdue maintenance
      const now = new Date();
      const equipmentWithStatus = equipmentData.map(eq => ({
        ...eq,
        isOverdue: eq.nextServiceDate && new Date(eq.nextServiceDate) < now
      }));

      setEquipment(equipmentWithStatus);
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFacilityName = (facilityId) => {
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name || 'Unknown';
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.assetTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFacility = facilityFilter === 'all' || eq.facilityId === facilityFilter;
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesFacility && matchesStatus;
  });

  const overdueCount = equipment.filter(eq => eq.isOverdue).length;

  if (loading) {
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
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        description="Manage equipment and maintenance schedules"
        actionLabel={canEdit ? "Add Equipment" : null}
        onAction={() => window.location.href = createPageUrl('EquipmentDetail') + '?mode=create'}
        showAction={canEdit}
      />

      {overdueCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">Maintenance Overdue</p>
              <p className="text-sm text-amber-700">{overdueCount} equipment item{overdueCount !== 1 ? 's' : ''} need{overdueCount === 1 ? 's' : ''} maintenance</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => setStatusFilter('operational')}
            >
              View Overdue
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={facilityFilter} onValueChange={setFacilityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Facilities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Facilities</SelectItem>
            {facilities.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="down">Down</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEquipment.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No equipment"
          description="Add equipment to track maintenance schedules"
          actionLabel="Add Equipment"
          onAction={() => window.location.href = createPageUrl('EquipmentDetail') + '?mode=create'}
          showAction={canEdit}
        />
      ) : (
        <div className="grid gap-3">
          {filteredEquipment.map(eq => (
            <Link key={eq.id} to={createPageUrl('EquipmentDetail') + `?id=${eq.id}`}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-medium">{eq.name}</span>
                        <StatusBadge status={eq.status} />
                        {eq.isOverdue && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            Maintenance Overdue
                          </span>
                        )}
                        <StatusBadge status={eq.criticality} />
                      </div>
                      <div className="text-sm text-slate-500 space-y-1">
                        <p>
                          <span className="font-medium">Asset:</span> {eq.assetTag || 'N/A'} • 
                          <span className="ml-1">{getFacilityName(eq.facilityId)}</span>
                        </p>
                        {eq.manufacturer && (
                          <p>{eq.manufacturer} {eq.model && `• ${eq.model}`}</p>
                        )}
                        {eq.nextServiceDate && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Next Service: {new Date(eq.nextServiceDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}