import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/button';
import { 
  GraduationCap, 
  BarChart3, 
  FileText, 
  Github, 
  Briefcase, 
  Bot, 
  Moon, 
  Sun, 
  LogOut 
} from 'lucide-react';

export function Sidebar({ currentSection, onSectionChange }) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'notes', icon: FileText, label: 'My Notes' },
    { id: 'github', icon: Github, label: 'GitHub Projects' },
    { id: 'placement', icon: Briefcase, label: 'Placement Prep' },
    { id: 'chat', icon: Bot, label: 'AI Assistant' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-card shadow-lg border-r border-gray-200 dark:border-border z-30">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-border">
          <div className="flex items-center">
            <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
              <GraduationCap className="text-primary" size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">PPA Dashboard</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Study Assistant</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-background'
                }`}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-500 hover:bg-gray-100 dark:hover:bg-background"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-background"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


