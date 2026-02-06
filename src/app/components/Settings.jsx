import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Settings as SettingsIcon,
  Users,
  Sliders,
  Save,
  Plus,
  Trash2,
  Edit2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { settingsAPI } from '@/services/api';

export const Settings = ({ rules, onUpdateRules }) => {
  const { hasPermission } = useAuth();
  const [localRules, setLocalRules] = useState(rules);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  // User dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    isActive: true
  });
  const [savingUser, setSavingUser] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    if (hasPermission('admin')) {
      fetchUsers();
    }
  }, []);

  // Update local rules when props change
  useEffect(() => {
    setLocalRules(rules);
  }, [rules]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data } = await settingsAPI.getUsers();
      setUsers(data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRuleToggle = (ruleId, enabled) => {
    const updatedRules = localRules.map((rule) =>
      rule.id === ruleId ? { ...rule, enabled } : rule
    );
    setLocalRules(updatedRules);
  };

  const handleRuleVarianceChange = (ruleId, variance) => {
    const updatedRules = localRules.map((rule) =>
      rule.id === ruleId
        ? { ...rule, config: { ...rule.config, variance: variance / 100 } }
        : rule
    );
    setLocalRules(updatedRules);
  };

  const handleSaveRules = async () => {
    try {
      setSavingRules(true);
      await onUpdateRules(localRules);
    } finally {
      setSavingRules(false);
    }
  };

  // User Management Functions
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateUser = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
      isActive: true
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setSavingUser(true);

      if (selectedUser) {
        // Update existing user
        const updates = {
          name: userFormData.name,
          role: userFormData.role,
          isActive: userFormData.isActive
        };

        const { data } = await settingsAPI.updateUser(selectedUser._id, updates);
        setUsers(users.map(u => u._id === selectedUser._id ? data.data : u));
        toast.success('User updated successfully');
      } else {
        // Create new user
        if (!userFormData.password) {
          toast.error('Password is required for new users');
          return;
        }

        const { data } = await settingsAPI.createUser(userFormData);
        setUsers([...users, data.data]);
        toast.success('User created successfully');
      }

      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await settingsAPI.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!hasPermission('admin')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">
              You do not have permission to access system settings. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure reconciliation rules and system preferences</p>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">
            <Sliders className="h-4 w-4 mr-2" />
            Reconciliation Rules
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Reconciliation Rules</CardTitle>
                  <CardDescription>
                    Configure matching rules that will be applied during the reconciliation process.
                    Rules are applied in order from top to bottom.
                  </CardDescription>
                </div>
                <Button onClick={handleSaveRules} disabled={savingRules}>
                  {savingRules ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Rules
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {localRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                          <Badge variant="outline" className="uppercase text-xs">
                            {rule.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {rule.type === 'exact_match' &&
                            'Matches records with identical Transaction ID and Amount'}
                          {rule.type === 'partial_match' &&
                            'Matches records by Reference Number with configurable amount variance'}
                          {rule.type === 'duplicate_check' &&
                            'Detects duplicate Transaction IDs within the upload'}
                        </p>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleRuleToggle(rule.id, checked)}
                      />
                    </div>

                    {rule.type === 'partial_match' && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          <Label>Amount Variance Threshold</Label>
                          <div className="flex items-center gap-4">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={((rule.config.variance || 0) * 100).toFixed(1)}
                              onChange={(e) =>
                                handleRuleVarianceChange(rule.id, parseFloat(e.target.value))
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-gray-600">% variance allowed</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Current: ±{((rule.config.variance || 0) * 100).toFixed(1)}% (e.g.,
                            $1000 ± ${(1000 * (rule.config.variance || 0)).toFixed(2)})
                          </p>
                        </div>
                      </div>
                    )}

                    {rule.config.fields && (
                      <div className="pt-4 border-t border-gray-200">
                        <Label className="text-xs text-gray-500">MATCHING FIELDS</Label>
                        <div className="flex gap-2 mt-2">
                          {rule.config.fields.map((field) => (
                            <Badge key={field} variant="secondary">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Enable Async Processing</p>
                  <p className="text-sm text-gray-500">Process large files in the background</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Idempotency Check</p>
                  <p className="text-sm text-gray-500">
                    Prevent duplicate processing of the same file
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Auto-approve Exact Matches</p>
                  <p className="text-sm text-gray-500">
                    Automatically approve transactions with 100% match confidence
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </div>
                <Button onClick={handleCreateUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          No users found. Create your first user to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === 'admin' ? 'default' :
                                  user.role === 'analyst' ? 'secondary' :
                                    'outline'
                              }
                            >
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={user.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id, user.name)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Analyst</TableHead>
                    <TableHead>Viewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>View Dashboard</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Upload Files</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Manual Corrections</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>View Audit Logs</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Manage Settings</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>User Management</TableCell>
                    <TableCell>✓</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={userFormData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-gray-500">User can log in and access the system</p>
              </div>
              <Switch
                checked={userFormData.isActive}
                onCheckedChange={(checked) => setUserFormData({ ...userFormData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>
              {savingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Enter password (min 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-gray-500">User can log in and access the system</p>
              </div>
              <Switch
                checked={userFormData.isActive}
                onCheckedChange={(checked) => setUserFormData({ ...userFormData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>
              {savingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
