import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Upload, User } from 'lucide-react';

export function TopBar({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-card shadow-sm border-b border-gray-200 dark:border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Quick Upload */}
          <Button className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
            <Upload className="mr-2" size={16} />
            Quick Upload
          </Button>
          
          {/* User Profile */}
          <div className="flex items-center">
            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-2">
              <User className="text-primary text-sm" size={14} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}


