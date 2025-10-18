'use client';

/**
 * Document List Component
 * 
 * Displays and manages uploaded documents with:
 * - List view with file details
 * - Download functionality
 * - Delete capability
 * - Search and filter
 * - Preview support
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  Download, 
  Trash2, 
  Search,
  Eye,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Video,
  Loader2
} from 'lucide-react';

interface Document {
  id: string;
  key: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  documentType?: string;
  description?: string;
  url?: string;
}

interface DocumentListProps {
  patientId: string;
  encounterId?: string;
  onDocumentSelect?: (document: Document) => void;
}

export default function DocumentList({
  patientId,
  encounterId,
  onDocumentSelect,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, [patientId, encounterId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        patientId,
        ...(encounterId && { encounterId }),
      });

      const response = await fetch(`/api/documents/list?${params}`);
      if (!response.ok) throw new Error('Failed to load documents');

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/download?key=${encodeURIComponent(document.key)}`);
      if (!response.ok) throw new Error('Download failed');

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: document.key }),
      });

      if (!response.ok) throw new Error('Delete failed');

      // Remove from list
      setDocuments(prev => prev.filter(d => d.id !== document.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('zip') || type.includes('archive')) return <FileArchive className="h-5 w-5 text-orange-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesType;
  });

  const documentTypes = Array.from(new Set(documents.map(d => d.documentType).filter(Boolean)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-10"
            />
          </div>
          {documentTypes.length > 0 && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
        </div>

        {/* Document List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{searchQuery ? 'No documents found' : 'No documents uploaded yet'}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(document.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {document.name}
                    </p>
                    {document.documentType && (
                      <Badge variant="secondary" className="text-xs">
                        {document.documentType}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(document.size)}</span>
                    <span>•</span>
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>
                  {document.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {document.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onDocumentSelect && (
                    <Button
                      onClick={() => onDocumentSelect(document)}
                      variant="ghost"
                      size="sm"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDownload(document)}
                    variant="ghost"
                    size="sm"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(document)}
                    variant="ghost"
                    size="sm"
                    title="Delete"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
