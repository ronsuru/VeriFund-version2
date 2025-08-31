import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  User, 
  CreditCard, 
  TrendingUp, 
  FileText,
  ExternalLink,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: 'user' | 'campaign' | 'transaction' | 'document' | 'ticket';
  displayId: string;
  title: string;
  description: string;
  status?: string;
  createdAt?: string;
  additionalInfo?: any;
}

interface UniversalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
}

export function UniversalSearch({ isOpen, onClose, onSelectResult }: UniversalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/admin/universal-search', searchQuery],
queryFn: async () => {
      if (!searchQuery.trim()) return [] as any[];
      const { apiRequest } = await import('@/lib/queryClient');
      const res = await apiRequest('GET', `/api/admin/universal-search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();    },
    enabled: searchQuery.length >= 2,
  });

  const getResultIcon = (type: string) => {
    switch(type) {
      case 'user': return <User className="w-4 h-4 text-blue-600" />;
      case 'campaign': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'transaction': return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'document': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'ticket': return <FileText className="w-4 h-4 text-red-600" />;
      default: return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'user': return "bg-blue-100 text-blue-800";
      case 'campaign': return "bg-purple-100 text-purple-800";
      case 'transaction': return "bg-green-100 text-green-800";
      case 'document': return "bg-orange-100 text-orange-800";
      case 'ticket': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    // Auto-navigate to the detailed view based on type
    switch(result.type) {
      case 'user':
        window.open(`/profile/${result.id}`, '_blank', 'rel=noopener,noreferrer');
        break;
      case 'campaign':
        window.open(`/campaign/${result.id}`, '_blank', 'rel=noopener,noreferrer');
        break;
      case 'transaction':
        // Show transaction details in current context
        break;
      case 'document':
        // Show document details
        break;
      case 'ticket':
        // Navigate to ticket details
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Universal ID Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by User ID, Campaign ID, Transaction ID, Document ID, or Ticket Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
              data-testid="input-universal-search"
              autoFocus
            />
          </div>

          {/* Search Instructions */}
          {searchQuery.length < 2 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Search Examples:</strong>
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• User IDs: USR-001234, user email, or name</li>
                  <li>• Campaign IDs: CAM-001234 or campaign title</li>
                  <li>• Transaction IDs: TXN-001234 or transaction hash</li>
                  <li>• Document IDs: DOC-001234 or document title</li>
                  <li>• Ticket Numbers: TKT-0001 or ticket subject</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && searchQuery.length >= 2 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-600">Searching across all records...</span>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700">
                Found {searchResults.length} result(s)
              </h3>
              {searchResults.map((result: SearchResult) => (
                <Card 
                  key={`${result.type}-${result.id}`} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleResultClick(result)}
                  data-testid={`search-result-${result.displayId}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getResultIcon(result.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{result.displayId}</h4>
                            <Badge className={getTypeColor(result.type)} variant="secondary">
                              {result.type.toUpperCase()}
                            </Badge>
                            {result.status && (
                              <Badge variant="outline" className="text-xs">
                                {result.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{result.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{result.description}</p>
                          {result.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Created: {new Date(result.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery.length >= 2 && !isLoading && searchResults.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No records found matching "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-2">
                  Try searching with a different ID, name, or keyword
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Standalone search button component
export function UniversalSearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2"
        data-testid="button-universal-search"
      >
        <Search className="w-4 h-4" />
        Universal Search
      </Button>
      
      <UniversalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}