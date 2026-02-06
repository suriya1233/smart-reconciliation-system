import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/app/components/ui/button.jsx';
import {
    LayoutDashboard,
    Upload,
    FileCheck,
    History,
    Settings,
    LogOut,
    User
} from 'lucide-react';

export const Layout = ({ children, currentPage, onNavigate }) => {
    const { user, logout, hasPermission } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
        { id: 'upload', label: 'Upload', icon: Upload, permission: 'upload' },
        { id: 'reconciliation', label: 'Reconciliation', icon: FileCheck, permission: null },
        { id: 'audit', label: 'Audit Logs', icon: History, permission: null },
        { id: 'settings', label: 'Settings', icon: Settings, permission: 'admin' },
    ];

    const filteredMenuItems = menuItems.filter(
        (item) => !item.permission || hasPermission(item.permission)
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">Reconciliation</h1>
                    <p className="text-sm text-gray-500 mt-1">Audit System</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
};
