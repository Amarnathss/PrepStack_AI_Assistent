import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import { uploadFile, apiRequest } from '../../lib/api';
import { CloudUpload, Search, FileText, File, MoreVertical, Trash2 } from 'lucide-react';

export function NotesSection() {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadSubject, setUploadSubject] = useState('DBMS');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['/api/notes', selectedSubject === 'All' ? undefined : selectedSubject],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      return uploadFile('/api/notes/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: 'File uploaded successfully',
        description: 'Your notes have been processed and stored.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId) => {
      return apiRequest('DELETE', `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: 'Note deleted',
        description: 'Your note has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', uploadSubject);

    uploadMutation.mutate(formData);
  };

  const subjects = [
    'All',
    'DBMS',
    'Computer Networks',
    'Operating Systems',
    'OOPS',
    'SQL',
    'Data Structures',
    'Algorithms',
  ];

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="text-red-600 dark:text-red-400" size={20} />;
      case 'docx':
        return <File className="text-blue-600 dark:text-blue-400" size={20} />;
      default:
        return <FileText className="text-gray-600 dark:text-gray-400" size={20} />;
    }
  };

  const filteredNotes =
    notes?.filter((note) => {
      const q = searchQuery.toLowerCase();
      return (
        note.title?.toLowerCase().includes(q) ||
        note.content?.toLowerCase().includes(q)
      );
    }) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload Area */}
      <div className="lg:col-span-1">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Notes</h3>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-gray-300 dark:border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <CloudUpload className="text-3xl text-gray-400 mb-4 mx-auto" size={48} />
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Drop files here or click to upload</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">PDF, DOCX, Markdown files supported</p>

              <input
                type="file"
                className="hidden"
                id="fileUpload"
                accept=".pdf,.docx,.md"
                onChange={handleFileUpload}
              />
              <label htmlFor="fileUpload">
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                  disabled={uploadMutation.isLoading}
                >
                  <span>{uploadMutation.isLoading ? 'Uploading...' : 'Choose Files'}</span>
                </Button>
              </label>
            </div>

            {/* Subject Categories */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject Category</label>
              <Select value={uploadSubject} onValueChange={setUploadSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.slice(1).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Library */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Notes Library</h3>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Input
                  type="text"
                  placeholder="Search notes using natural language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            {/* Subject Filter Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-background p-1 rounded-lg overflow-x-auto">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    selectedSubject === subject
                      ? 'bg-white dark:bg-card text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            {/* Notes Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 dark:border-border rounded-lg p-4 animate-pulse">
                    <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No notes found matching your search.' : 'No notes uploaded yet. Upload your first note!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-gray-200 dark:border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-red-100 dark:bg-red-900/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                          {getFileIcon(note.fileType)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{note.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{note.subject}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(note.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {note.content?.substring(0, 100)}...
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Uploaded {note.uploadedAt ? new Date(note.uploadedAt).toLocaleDateString() : '—'}</span>
                      <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                        {note.fileType?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
