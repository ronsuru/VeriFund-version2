import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, FileText, Image as ImageIcon, Video, Music, Archive, File } from "lucide-react";

interface DocumentViewerProps {
  document: {
    id?: string;
    fileName?: string;
    fileUrl?: string;
    mimeType?: string;
    fileSize?: number;
    documentType?: string;
    description?: string;
    type?: string;
    url?: string;
    filename?: string;
    size?: string;
  };
  trigger?: React.ReactNode;
  className?: string;
  externalShow?: boolean;
  onExternalClose?: () => void;
}

export function DocumentViewer({ document, trigger, className, externalShow, onExternalClose }: DocumentViewerProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use external show state if provided, otherwise use internal state
  const isModalOpen = externalShow !== undefined ? externalShow : showModal;
  
  const handleModalClose = () => {
    if (onExternalClose) {
      onExternalClose();
    } else {
      setShowModal(false);
    }
  };
  
  // Normalize document properties from different sources
  const fileName = document.fileName || document.filename || `Document-${document.id || 'unknown'}`;
  const fileUrl = document.fileUrl || document.url || '';
  const mimeType = document.mimeType || document.type || 'application/octet-stream';
  const fileSize = document.fileSize || (typeof document.size === 'string' ? parseInt(document.size) : 0);
  const description = document.description || document.documentType || 'No description available';

  // Get file extension and type
  const getFileExtension = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return extension;
  };

  const getFileType = (mime: string, url: string) => {
    const extension = getFileExtension(url);
    
    // Debug logging
    console.log('🔍 DocumentViewer file type detection:', {
      url,
      mime,
      extension,
      fileName
    });
    
    // First check by MIME type if it's a valid MIME type
    if (mime && mime !== 'application/octet-stream' && !mime.includes('_')) {
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      if (mime === 'application/pdf') return 'pdf';
    }
    
    // Then check by file extension (this is more reliable for our use case)
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv', 'flv'].includes(extension)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) {
      return 'audio';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
      return 'document';
    } else if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return 'archive';
    }
    
    // Special case: if URL contains common image patterns, treat as image
    if (url.includes('evidence/') || url.includes('government') || url.includes('address')) {
      console.log('🔍 Detected KYC document URL, treating as image');
      return 'image';
    }
    
    return 'other';
  };

  const fileType = getFileType(mimeType, fileUrl);

  const getIcon = () => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'pdf': 
      case 'document': return <FileText className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Image file';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = () => {
    if (!fileUrl) {
      alert('File URL not available');
      return;
    }
    setShowModal(true);
  };

  const handleDownload = async () => {
    if (!fileUrl) {
      alert('File URL not available');
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the same URL conversion logic as the preview
      let downloadUrl = fileUrl;
      if (fileUrl.startsWith('/objects/')) {
        downloadUrl = fileUrl; // Object storage endpoint will handle serving
      } else if (fileUrl.startsWith('http')) {
        downloadUrl = fileUrl; // Direct URL (Supabase public URL)
      } else if (fileUrl.startsWith('/api/upload') || fileUrl.startsWith('api/upload')) {
        // Convert upload URL to public URL
        try {
          const fullUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
          const url = new URL(fullUrl, window.location.origin);
          const objectPath = url.searchParams.get('objectPath');
          if (objectPath) {
            const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
            const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
            if (supabaseUrl) {
              // Keep the public/ prefix for Supabase URLs
              downloadUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
            } else {
              downloadUrl = `/objects/${objectPath}`;
            }
          }
        } catch (error) {
          console.warn('Failed to convert upload URL for download:', error);
          // Fallback: try to extract objectPath manually
          const match = fileUrl.match(/objectPath=([^&]+)/);
          if (match) {
            const objectPath = decodeURIComponent(match[1]);
            downloadUrl = `/objects/${objectPath}`;
          } else {
            downloadUrl = `/objects/${fileUrl}`;
          }
        }
      } else {
        downloadUrl = `/objects/${fileUrl}`; // Assume object path
      }
      
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDocumentPreview = () => {
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
          <p className="text-gray-500">File URL not available</p>
        </div>
      );
    }

    // Convert object storage paths to viewable URLs
    let viewUrl = fileUrl;
    console.log('🔍 DocumentViewer URL conversion:', { originalUrl: fileUrl, fileType });
    
    if (fileUrl.startsWith('/objects/')) {
      viewUrl = fileUrl; // Object storage endpoint will handle serving
    } else if (fileUrl.startsWith('http')) {
      viewUrl = fileUrl; // Direct URL (Supabase public URL)
    } else if (fileUrl.startsWith('/api/upload') || fileUrl.startsWith('api/upload')) {
      // Convert upload URL to public URL
      try {
        const fullUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        const url = new URL(fullUrl, window.location.origin);
        const objectPath = url.searchParams.get('objectPath');
        if (objectPath) {
          const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
          const bucket = (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET || 'verifund-assets';
          if (supabaseUrl) {
            // Keep the public/ prefix for Supabase URLs
            viewUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
          } else {
            viewUrl = `/objects/${objectPath}`;
          }
        }
      } catch (error) {
        console.warn('Failed to convert upload URL:', error);
        // Fallback: try to extract objectPath manually
        const match = fileUrl.match(/objectPath=([^&]+)/);
        if (match) {
          const objectPath = decodeURIComponent(match[1]);
          viewUrl = `/objects/${objectPath}`;
        } else {
          viewUrl = `/objects/${fileUrl}`;
        }
      }
    } else {
      viewUrl = `/public-objects/${fileUrl}`; // Assume public object
    }

    console.log('🔍 DocumentViewer final URL:', { viewUrl, fileType });
    
    switch (fileType) {
      case 'image':
        return (
          <div className="text-center">
            <img 
              src={viewUrl} 
              alt={fileName}
              className="max-w-full max-h-96 mx-auto rounded border"
              onError={(e) => {
                console.error('Image load error:', e);
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden mt-4 p-4 bg-gray-100 rounded">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Unable to display image</p>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="text-center">
            <video 
              controls 
              className="max-w-full max-h-96 mx-auto"
              onError={(e) => {
                console.error('Video load error:', e);
                (e.target as HTMLVideoElement).style.display = 'none';
                (e.target as HTMLVideoElement).nextElementSibling?.classList.remove('hidden');
              }}
            >
              <source src={viewUrl} type={mimeType} />
              Your browser does not support the video tag.
            </video>
            <div className="hidden mt-4 p-4 bg-gray-100 rounded">
              <Video className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Unable to display video</p>
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="text-center py-8">
            <Music className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <audio controls className="mx-auto">
              <source src={viewUrl} type={mimeType} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="text-center">
            <iframe 
              src={viewUrl}
              className="w-full h-96 border rounded"
              title={fileName}
              onError={(e) => {
                console.error('PDF load error:', e);
                (e.target as HTMLIFrameElement).style.display = 'none';
                (e.target as HTMLIFrameElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden mt-4 p-4 bg-gray-100 rounded">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Unable to display PDF. Please download to view.</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            {getIcon()}
            <h3 className="mt-4 text-lg font-medium">{fileName}</h3>
            <p className="text-gray-600 mt-2">
              This file type cannot be previewed directly. Please view full to see the contents.
            </p>
            <Button onClick={handleDownload} className="mt-4" disabled={isLoading}>
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? 'Opening...' : 'View Full'}
            </Button>
          </div>
        );
    }
  };

  const defaultTrigger = (
    <Button size="sm" variant="outline" className={className}>
      <Eye className="h-3 w-3 mr-1" />
      View
    </Button>
  );

  return (
    <>
      <div onClick={handleViewDocument} className="cursor-pointer">
        {trigger || defaultTrigger}
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getIcon()}
              {fileName}
            </DialogTitle>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">{fileType.toUpperCase()}</Badge>
              <Badge variant="outline">{formatFileSize(fileSize)}</Badge>
              {mimeType && mimeType !== 'application/octet-stream' && (
                <Badge variant="outline">{mimeType}</Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600 mt-2">{description}</p>
            )}
          </DialogHeader>
          
          <div className="mt-4">
            {renderDocumentPreview()}
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
              <Eye className="h-4 w-4 mr-2" />
              {isLoading ? 'Opening...' : 'View Full'}
            </Button>
            <Button variant="outline" onClick={handleModalClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}