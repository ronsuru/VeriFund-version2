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
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    } else if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
      return 'video';
    } else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio';
    } else if (mime === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
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
    if (bytes === 0) return 'Unknown size';
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
      // Check if it's an object storage path and convert it
      let downloadUrl = fileUrl;
      if (fileUrl.startsWith('/objects/')) {
        downloadUrl = fileUrl; // Object storage endpoint will handle serving
      } else if (fileUrl.startsWith('http')) {
        downloadUrl = fileUrl; // Direct URL
      } else {
        downloadUrl = `/public-objects/${fileUrl}`; // Assume public object
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
    if (fileUrl.startsWith('/objects/')) {
      viewUrl = fileUrl; // Object storage endpoint will handle serving
    } else if (fileUrl.startsWith('http')) {
      viewUrl = fileUrl; // Direct URL
    } else {
      viewUrl = `/public-objects/${fileUrl}`; // Assume public object
    }

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
              This file type cannot be previewed directly. Please download to view the contents.
            </p>
            <Button onClick={handleDownload} className="mt-4" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Downloading...' : 'Download File'}
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
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Downloading...' : 'Download'}
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