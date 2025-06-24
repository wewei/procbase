// Test file for analysis command

// Types
export type UserId = string;
export type Status = 'active' | 'inactive' | 'pending';

// Interfaces
export interface User {
  id: UserId;
  name: string;
  email: string;
  status: Status;
}

interface InternalConfig {
  apiUrl: string;
  timeout: number;
}

// Classes
export class UserService {
  private config: InternalConfig;

  constructor(config: InternalConfig) {
    this.config = config;
  }

  async getUser(id: UserId): Promise<User | null> {
    // Implementation would go here
    return null;
  }
}

class Helper {
  static formatName(name: string): string {
    return name.trim();
  }
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

enum InternalStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Functions
export function createUser(name: string, email: string): User {
  return {
    id: generateId(),
    name,
    email,
    status: 'pending'
  };
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Constants
export const DEFAULT_TIMEOUT = 5000;
export const API_BASE_URL = 'https://api.example.com';

const INTERNAL_CONSTANT = 'internal';

// Let variables
export let currentUser: User | null = null;
let sessionToken: string | null = null;

// Var variables (legacy)
export var globalConfig = {
  debug: false,
  version: '1.0.0'
};

var legacyVariable = 'deprecated';

// Arrow functions
export const validateEmail = (email: string): boolean => {
  return email.includes('@');
};

const internalValidator = (data: any): boolean => {
  return data !== null && data !== undefined;
}; 