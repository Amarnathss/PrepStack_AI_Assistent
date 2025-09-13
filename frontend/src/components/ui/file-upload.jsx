import { useState, useRef, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { CloudUpload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

export function FileUpload({
  onFileSelect,
  accept = '.pdf,.docx,.md,.txt',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
  className,
  children
}) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef(null);

  const validateFile = useCallback((file): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(1)}MB limit`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedTypes.some(type => 
        type === fileExtension || 
        (type.includes('/*') && file.type.startsWith(type.replace('/*', '')))
      );
      
      if (!isValidType) {
        return `File 
      }
    }

    return null;
  }, [accept, maxSize]);

  const handleFiles = useCallback((fileList) => {
    if (!fileList || disabled) return;

    const newFiles= [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else if (maxFiles && files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
      } else {
        newFiles.push(file);
      }
    });

    if (newFiles.length > 0) {
      const uploadedFiles= newFiles.map(file => ({
        file,
        status: 'pending'
      }));
      
      setFiles(prev => [...prev, ...uploadedFiles]);
      onFileSelect(newFiles);
    }

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
    }
  }, [files.length, maxFiles, validateFile, onFileSelect, disabled]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled]);

  const handleChange = useCallback((e: React.ChangeEvent) => {
    e.preventDefault();
    handleFiles(e.target.files);
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openFileDialog = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <File className="text-red-500" size={20} />;
      case 'docx':
      case 'doc':
        return <File className="text-blue-500" size={20} />;
      case 'md':
        return <File className="text-green-500" size={20} />;
      case 'txt':
        return <File className="text-gray-500" size={20} />;
      default:
        return <File className="text-gray-400" size={20} />;
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={16} />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 dark:border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-6 text-center">
          {children || (
            <>
              <CloudUpload 
                className={cn(
                  "mx-auto mb-4 transition-colors",
                  dragActive ? "text-primary" : "text-gray-400"
                )} 
                size={48} 
              />
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {accept ? `Supported formats: ${accept}` : 'All file types supported'}
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={disabled}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Choose Files
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-background rounded-lg border border-gray-200 dark:border-border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(uploadedFile.file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.error && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadedFile.status)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


