import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/card';
import { FileText, Github, Code, Flame, Upload, Search, Bot, TrendingUp } from 'lucide-react';

export function OverviewSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const statsCards = [
    {
      title: 'Total Notes',
      value: stats?.totalNotes || 0,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+12%',
      changeText: 'vs last week'
    },
    {
      title: 'GitHub Repos',
      value: stats?.totalRepos || 0,
      icon: Github,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      change: `+${stats?.totalRepos || 0}`,
      changeText: 'repositories'
    },
    {
      title: 'Practice Questions',
      value: stats?.totalQuestions || 0,
      icon: Code,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: `${Math.round(((stats?.solvedQuestions || 0) / Math.max(stats?.totalQuestions || 1, 1)) * 100)}%`,
      changeText: 'solved'
    },
    {
      title: 'Study Streak',
      value: '12 days',
      icon: Flame,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: '🎯 Goal: 30 days',
      changeText: ''
    }
  ];

  const quickActions = [
    {
      title: 'Upload Notes',
      description: 'Add new study material',
      icon: Upload,
      color: 'text-primary'
    },
    {
      title: 'Search Notes',
      description: 'Find specific topics',
      icon: Search,
      color: 'text-secondary'
    },
    {
      title: 'Ask AI',
      description: 'Get instant answers',
      icon: Bot,
      color: 'text-accent'
    },
    {
      title: 'Practice DSA',
      description: 'Solve coding problems',
      icon: Code,
      color: 'text-yellow-600'
    }
  ];

  const recentActivities = [
    {
      title: 'Uploaded DBMS notes',
      time: '2 hours ago',
      icon: Upload,
      color: 'text-primary'
    },
    {
      title: 'Searched "Two-phase locking"',
      time: '4 hours ago',
      icon: Search,
      color: 'text-secondary'
    },
    {
      title: 'Analyzed movie-management repo',
      time: 'Yesterday',
      icon: TrendingUp,
      color: 'text-accent'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className={card.color} size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-secondary">{card.change}</span>
                  {card.changeText && <span className="text-gray-600 dark:text-gray-400 ml-2">{card.changeText}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`${activity.color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')} w-8 h-8 rounded-full flex items-center justify-center`}>
                      <Icon className={`${activity.color} text-xs`} size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-background transition-colors text-left"
                  >
                    <Icon className={`${action.color} mb-2`} size={20} />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


