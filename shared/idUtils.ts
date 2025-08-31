/**
 * Utility functions for generating standardized display IDs
 * These IDs are user-friendly and searchable in the admin panel
 */

/**
 * Generate a random 6-digit number for display IDs
 */
function generateRandomNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random 4-digit number for ticket numbers
 */
function generateRandomTicketNumber(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate standardized display IDs for different entity types
 */
export const idGenerator = {
  /**
   * Generate user display ID (USR-XXXXXX)
   */
  user(): string {
    return `USR-${generateRandomNumber()}`;
  },

  /**
   * Generate campaign display ID (CAM-XXXXXX)
   */
  campaign(): string {
    return `CAM-${generateRandomNumber()}`;
  },

  /**
   * Generate transaction display ID (TXN-XXXXXX)
   */
  transaction(): string {
    return `TXN-${generateRandomNumber()}`;
  },

  /**
   * Generate document display ID (DOC-XXXXXX)
   */
  document(): string {
    return `DOC-${generateRandomNumber()}`;
  },

  /**
   * Generate support ticket number (TKT-XXXX)
   */
  supportTicket(): string {
    return `TKT-${generateRandomTicketNumber()}`;
  },

  /**
   * Generate email ticket number (TKT-XXXX)
   */
  emailTicket(): string {
    return `TKT-${generateRandomTicketNumber()}`;
  }
};

/**
 * Parse display ID to determine entity type and extract ID
 */
export function parseDisplayId(displayId: string): { type: string; id: string } | null {
  const patterns = {
    USR: /^USR-(\d{6})$/,
    CAM: /^CAM-(\d{6})$/,
    TXN: /^TXN-(\d{6})$/,
    DOC: /^DOC-(\d{6})$/,
    TKT: /^TKT-(\d{4})$/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    const match = displayId.match(pattern);
    if (match) {
      return { type, id: match[1] };
    }
  }

  return null;
}

/**
 * Entity type mapping for search navigation
 */
export const entityTypeMap = {
  USR: {
    name: 'User',
    searchPath: '/admin?section=users',
    iconType: '👤'
  },
  CAM: {
    name: 'Campaign',
    searchPath: '/admin?section=campaigns',
    iconType: '🎯'
  },
  TXN: {
    name: 'Transaction',
    searchPath: '/admin?section=transactions',
    iconType: '💰'
  },
  DOC: {
    name: 'Document',
    searchPath: '/admin?section=reports&tab=document',
    iconType: '📄'
  },
  TKT: {
    name: 'Support Ticket',
    searchPath: '/admin?section=support',
    iconType: '🎫'
  }
};

/**
 * Check if a string matches any standardized ID format
 */
export function isStandardizedId(input: string): boolean {
  return parseDisplayId(input) !== null;
}

/**
 * Generate search suggestions based on partial input
 */
export function generateSearchSuggestions(input: string): Array<{ id: string; type: string; name: string }> {
  const suggestions: Array<{ id: string; type: string; name: string }> = [];
  
  // If input is empty or less than 3 characters, return examples
  if (input.length < 3) {
    return [
      { id: 'USR-260151', type: 'User', name: 'Example User ID' },
      { id: 'CAM-001234', type: 'Campaign', name: 'Example Campaign ID' },
      { id: 'TXN-567890', type: 'Transaction', name: 'Example Transaction ID' },
      { id: 'DOC-123456', type: 'Document', name: 'Example Document ID' },
      { id: 'TKT-0001', type: 'Support Ticket', name: 'Example Support Ticket' },
    ];
  }

  // Check if input matches the beginning of any ID pattern
  const upperInput = input.toUpperCase();
  
  if ('USR-'.startsWith(upperInput)) {
    suggestions.push({ id: 'USR-XXXXXX', type: 'User', name: 'User ID Format' });
  }
  if ('CAM-'.startsWith(upperInput)) {
    suggestions.push({ id: 'CAM-XXXXXX', type: 'Campaign', name: 'Campaign ID Format' });
  }
  if ('TXN-'.startsWith(upperInput)) {
    suggestions.push({ id: 'TXN-XXXXXX', type: 'Transaction', name: 'Transaction ID Format' });
  }
  if ('DOC-'.startsWith(upperInput)) {
    suggestions.push({ id: 'DOC-XXXXXX', type: 'Document', name: 'Document ID Format' });
  }
  if ('TKT-'.startsWith(upperInput)) {
    suggestions.push({ id: 'TKT-XXXX', type: 'Support Ticket', name: 'Support Ticket Format' });
  }

  return suggestions;
}