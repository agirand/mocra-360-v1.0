import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from './WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from 'lucide-react';

export default function AccountPicker() {
  const { accountAssignments, switchAccount, activeWorkspace } = useWorkspace();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [accountAssignments]);

  const loadAccounts = async () => {
    if (accountAssignments.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const accountIds = accountAssignments.map(a => a.accountId);
      const accountsList = await base44.entities.Account.filter({
        workspaceId: activeWorkspace.id
      });
      const filtered = accountsList.filter(a => accountIds.includes(a.id));
      setAccounts(filtered);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading accounts...</div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Account Assigned</CardTitle>
            <CardDescription>
              You don't have access to any client accounts yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Please contact your consultant to assign you to a client account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Select Your Account</CardTitle>
          <CardDescription>
            Choose which account you want to access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.map(account => (
            <button
              key={account.id}
              onClick={() => switchAccount(account.id)}
              className="w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{account.name}</p>
                  <p className="text-sm text-slate-500 capitalize">
                    {account.accountType?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}