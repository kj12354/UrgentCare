'use client';

/**
 * Document Uploader Component
 * 
 * Professional drag-and-drop file uploader with:
 * - Drag and drop support
 * - File type validation
 * - Size limits
 * - Progress tracking
 * - Multiple file upload
 * - Preview thumbnails
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Video
} from 'lucide-react';

interface DocumentUploaderProps {
  patientId: string;
  encounterId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  multiple?: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  key: string;
  url: string;
  uploadedAt: Date;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const DEFAULT_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const DEFAULT_MAX_SIZE = 10; // 10MB

export default function DocumentUploader({
  patientId,
  encounterId,
  onUploadComplete,
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  multiple = true,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Validate files
    const validatedFiles = newFiles.map(file => {
      let status: 'pending' | 'error' = 'pending';
      let error: string | undefined;

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        status = 'error';
        error = `File size exceeds ${maxFileSize}MB`;
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        status = 'error';
        error = 'File type not allowed';
      }

      return {
        file,
        progress: 0,
        status,
        error,
      } as FileWithProgress;
    });

    if (multiple) {
      setFiles(prev => [...prev, ...validatedFiles]);
    } else {
      setFiles(validatedFiles);
    }
  };

  const uploadFile = async (fileWithProgress: FileWithProgress, index: number) => {
    if (fileWithProgress.status === 'error') return;

    // Update status to uploading
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'uploading', progress: 0 };
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append('file', fileWithProgress.file);
      formData.append('patientId', patientId);
      if (encounterId) formData.append('encounterId', encounterId);
      formData.append('documentType', documentType || 'general');
      formData.append('description', description);

      // Simulate progress (in real implementation, use XMLHttpRequest or similar)
      const progressInterval = setInterval(() => {
        setFiles(prev => {
          const updated = [...prev];
          if (updated[index].progress < 90) {
            updated[index] = { ...updated[index], progress: updated[index].progress + 10 };
          }
          return updated;
        });
      }, 200);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Update status to success
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'success',
          progress: 100,
          uploadedFile: {
            name: fileWithProgress.file.name,
            size: fileWithProgress.file.size,
            type: fileWithProgress.file.type,
            key: data.key,
            url: data.url,
            uploadedAt: new Date(),
          },
        };
        return updated;
      });
    } catch (error) {
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        };
        return updated;
      });
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i);
      }
    }

    // Notify parent of completed uploads
    const uploadedFiles = files
      .filter(f => f.status === 'success' && f.uploadedFile)
      .map(f => f.uploadedFile!);

    if (onUploadComplete && uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('zip') || type.includes('archive')) return <FileArchive className="h-8 w-8 text-orange-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload medical documents, images, or files (Max {maxFileSize}MB per file)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="documentType">Document Type</Label>
            <Input
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g., Lab Results, X-Ray"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports: PDF, Images, Word, Excel (up to {maxFileSize}MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Files ({files.length})</h3>
              {files.some(f => f.status === 'pending') && (
                <Button onClick={handleUploadAll} size="sm">
                  Upload All
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((fileWithProgress, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(fileWithProgress.file.type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileWithProgress.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {fileWithProgress.status === 'uploading' && (
                      <Progress value={fileWithProgress.progress} className="mt-2" />
                    )}

                    {/* Error Message */}
                    {fileWithProgress.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">
                        {fileWithProgress.error}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {fileWithProgress.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {fileWithProgress.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {fileWithProgress.status === 'pending' && (
                      <Button
                        onClick={() => removeFile(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {files.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
            <span>
              {files.filter(f => f.status === 'success').length} of {files.length} uploaded
            </span>
            <span>
              Total: {formatFileSize(files.reduce((sum, f) => sum + f.file.size, 0))}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
