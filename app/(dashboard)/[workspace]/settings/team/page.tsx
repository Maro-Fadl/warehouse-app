'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Mail, MoreHorizontal, Shield, User, Crown } from 'lucide-react';

const teamMembers = [
  { id: '1', name: 'John Doe', email: 'john@warehousepro.com', role: 'owner', status: 'active', joinedAt: '2026-01-15' },
  { id: '2', name: 'Sarah Manager', email: 'sarah@warehousepro.com', role: 'manager', status: 'active', joinedAt: '2026-02-01' },
  { id: '3', name: 'Mike Storekeeper', email: 'mike@warehousepro.com', role: 'storekeeper', status: 'active', joinedAt: '2026-03-10' },
  { id: '4', name: 'Lisa Cashier', email: 'lisa@warehousepro.com', role: 'cashier', status: 'active', joinedAt: '2026-04-05' },
];

const roleColors: Record<string, string> = {
  owner: 'bg-purple-500/10 text-purple-500',
  manager: 'bg-blue-500/10 text-blue-500',
  storekeeper: 'bg-green-500/10 text-green-500',
  cashier: 'bg-orange-500/10 text-orange-500',
};

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  manager: Shield,
  storekeeper: User,
  cashier: User,
};

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">Manage your team members and roles.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members ({teamMembers.length})</CardTitle>
            <div className="relative w-64">
              <Input placeholder="Search members..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Member</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => {
                  const RoleIcon = roleIcons[member.role] || User;
                  return (
                    <tr key={member.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={roleColors[member.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {member.joinedAt}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
