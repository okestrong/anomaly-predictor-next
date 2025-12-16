import { create } from 'zustand';

export interface EmailRecipient {
   id?: number;
   email: string;
   isActive?: boolean;
   createdAt?: string;
   updatedAt?: string;
}

interface EmailRecipientsState {
   emails: string[];
   recipients: EmailRecipient[];
   isLoading: boolean;
   error: string | null;
   loadEmails: () => Promise<void>;
   addEmail: (email: string) => Promise<void>;
   removeEmail: (email: string) => Promise<void>;
   clearEmails: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

/**
 * Email Recipients Store
 * Manages email addresses for automated report delivery
 * Data is stored in backend database (not localStorage)
 */
export const useEmailRecipientsStore = create<EmailRecipientsState>((set, get) => ({
   emails: [],
   recipients: [],
   isLoading: false,
   error: null,

   /**
    * Load email addresses from backend
    */
   loadEmails: async () => {
      set({ isLoading: true, error: null });

      try {
         const response = await fetch(`${API_URL}/api/v1/email-recipients`);

         if (!response.ok) {
            throw new Error('Failed to load email recipients');
         }

         const recipients: EmailRecipient[] = await response.json();
         const emails = recipients.filter(r => r.isActive !== false).map(r => r.email);

         set({ emails, recipients, isLoading: false });
      } catch (error: any) {
         console.error('Error loading email recipients:', error);
         set({ error: error.message, isLoading: false });
      }
   },

   /**
    * Add a new email address to backend
    */
   addEmail: async (email: string) => {
      const trimmedEmail = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
         throw new Error('Invalid email format');
      }

      // Check max length
      if (trimmedEmail.length > 100) {
         throw new Error('Email address must be 100 characters or less');
      }

      // Check if already exists locally
      const { emails } = get();
      if (emails.includes(trimmedEmail)) {
         throw new Error('Email already exists');
      }

      set({ isLoading: true, error: null });

      try {
         const response = await fetch(`${API_URL}/api/v1/email-recipients`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: trimmedEmail }),
         });

         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add email recipient');
         }

         // Reload all emails from backend
         await get().loadEmails();
      } catch (error: any) {
         set({ error: error.message, isLoading: false });
         throw error;
      }
   },

   /**
    * Remove an email address from backend
    */
   removeEmail: async (email: string) => {
      set({ isLoading: true, error: null });

      try {
         const response = await fetch(`${API_URL}/api/v1/email-recipients/by-email/${encodeURIComponent(email)}`, {
            method: 'DELETE',
         });

         if (!response.ok) {
            throw new Error('Failed to remove email recipient');
         }

         // Reload all emails from backend
         await get().loadEmails();
      } catch (error: any) {
         set({ error: error.message, isLoading: false });
         throw error;
      }
   },

   /**
    * Clear all email addresses (local state only)
    */
   clearEmails: () => {
      set({ emails: [], recipients: [] });
   },
}));
