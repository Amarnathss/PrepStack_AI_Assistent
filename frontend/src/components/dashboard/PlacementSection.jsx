import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/api';
import { Bookmark, BookmarkCheck, Calendar, Code } from 'lucide-react';

export function PlacementSection() {
  const [filters, setFilters] = useState({
    company: '',
    year: '',
    difficulty: '',
    topic: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/placement/questions', filters],
  });

  const companies = ['All Companies', 'Amazon', 'Google', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Adobe'];
  const years = ['All Years', '2024', '2023', '2022', '2021'];
  const difficulties = ['All Difficulties', 'Easy', 'Medium', 'Hard'];

  const getDifficultyColor = (difficulty = '') => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const getCompanyColor = (company = '') => {
    const colors = {
      'Amazon': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400',
      'Google': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      'Microsoft': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      'Apple': 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400',
      'Meta': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
    };
    return colors[company] || 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400';
  };

  const filteredQuestions =
    questions?.filter((question) => {
      const q = searchQuery.toLowerCase();
      return (
        (question.question || '').toLowerCase().includes(q) ||
        (question.topic || '').toLowerCase().includes(q)
      );
    }) || [];

  const practiceProgress = [
    { topic: 'Array Problems', solved: 45, total: 60, percentage: 75 },
    { topic: 'String Problems', solved: 32, total: 45, percentage: 71 },
    { topic: 'Tree Problems', solved: 18, total: 35, percentage: 51 },
    { topic: 'Graph Problems', solved: 12, total: 25, percentage: 48 },
  ];

  return (
    <div className="space-y-6">
      {/* Company Filter & Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Placement Questions Database</h3>

            <div className="flex flex-wrap gap-4">
              <Select value={filters.company || 'All Companies'} onValueChange={(value) => setFilters(prev => ({ ...prev, company: value === 'All Companies' ? '' : value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.year || 'All Years'} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value === 'All Years' ? '' : value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.difficulty || 'All Difficulties'} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value === 'All Difficulties' ? '' : value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Questions List */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Questions</h3>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 dark:border-border rounded-lg p-4 animate-pulse">
                    <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <Code className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">No questions found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.slice(0, 10).map((question) => (
                  <div key={question.id} className="border border-gray-200 dark:border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getCompanyColor(question.company)}>
                          {question.company || '—'}
                        </Badge>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty || '—'}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{question.year || '—'}</span>
                      </div>
                      <Button variant="ghost" size="icon">
                        {question.isSolved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </Button>
                    </div>

                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {(question.question || '').length > 80 ? `${(question.question || '').substring(0, 80)}...` : (question.question || '')}
                    </h4>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{question.topic || 'General'}</span>
                        <span>Asked in {question.year || '—'}</span>
                      </div>
                      <Button variant="link" size="sm" className="text-primary hover:text-primary/80">
                        View Solution
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Practice Stats & Recommendations */}
        <div className="space-y-6">
          {/* Practice Progress Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Practice Progress</h3>

              <div className="space-y-4">
                {practiceProgress.map((item) => (
                  <div key={item.topic}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.topic}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.solved}/{item.total}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Practice Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommended Practice</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300 text-sm">Focus on Tree Problems</p>
                    <p className="text-blue-700 dark:text-blue-400 text-xs">Complete 5 more problems to reach 70%</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Practice
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-300 text-sm">Amazon Interview Prep</p>
                    <p className="text-yellow-700 dark:text-yellow-400 text-xs">Review 10 recent Amazon questions</p>
                  </div>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Schedule Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Mock Interviews</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <Calendar className="text-primary text-sm" size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Technical Interview</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Tomorrow, 2:00 PM</p>
                    </div>
                  </div>
                  <Button variant="link" size="sm" className="text-primary">Join</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
