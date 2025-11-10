import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmailRecipient {
   id?: number;
   email: string;
   isActive?: boolean;
   createdAt?: string;
   updatedAt?: string;
}

interface EmailRecipientsState {
   emails: string[];
   addEmail: (email: string) => void;
   removeEmail: (email: string) => void;
   clearEmails: () => void;
   setEmails: (emails: string[]) => void;
   syncWithBackend: () => Promise<void>;
}

/**
 * Email Recipients Store
 * Manages email addresses for automated report delivery
 * Data is persisted to localStorage
 */
export const useEmailRecipientsStore = create<EmailRecipientsState>()(
   persist(
      (set, get) => ({
         emails: [],

         /**
          * Add a new email address
          */
         addEmail: (email: string) => {
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

            // Check if already exists
            const { emails } = get();
            if (emails.includes(trimmedEmail)) {
               throw new Error('Email already exists');
            }

            set((state) => ({
               emails: [...state.emails, trimmedEmail],
            }));

            // Sync with backend
            get().syncWithBackend();
         },

         /**
          * Remove an email address
          */
         removeEmail: (email: string) => {
            set((state) => ({
               emails: state.emails.filter((e) => e !== email),
            }));

            // Sync with backend
            get().syncWithBackend();
         },

         /**
          * Clear all email addresses
          */
         clearEmails: () => {
            set({ emails: [] });
            get().syncWithBackend();
         },

         /**
          * Set email addresses (bulk update)
          */
         setEmails: (emails: string[]) => {
            set({ emails });
         },

         /**
          * Sync email list with backend
          */
         syncWithBackend: async () => {
            const { emails } = get();

            try {
               const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/email-recipients/sync`,
                  {
                     method: 'POST',
                     headers: {
                        'Content-Type': 'application/json',
                     },
                     body: JSON.stringify({ emails }),
                  }
               );

               if (!response.ok) {
                  console.error('Failed to sync emails with backend');
               }
            } catch (error) {
               console.error('Error syncing emails with backend:', error);
            }
         },
      }),
      {
         name: 'email-recipients-storage', // localStorage key
         version: 1,
      }
   )
);
