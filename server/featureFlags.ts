// Centralized feature flags for the backend
// ENABLE_BLOCKCHAIN: toggles all blockchain-related behavior
// Default: false (park blockchain until ready)

export const ENABLE_BLOCKCHAIN: boolean = (process.env.ENABLE_BLOCKCHAIN || 'false') === 'true';


