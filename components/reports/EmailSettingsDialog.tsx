'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Plus, Trash2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useEmailRecipientsStore } from '@/stores/emailRecipients';

interface EmailSettingsDialogProps {
   isOpen: boolean;
   onClose: () => void;
}

/**
 * Email Settings Dialog
 * Manages email recipients for automated daily reports
 */
export default function EmailSettingsDialog({ isOpen, onClose }: EmailSettingsDialogProps) {
   const { emails, loadEmails, addEmail, removeEmail, isLoading } = useEmailRecipientsStore();
   const [newEmail, setNewEmail] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);
   const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);

   // Load emails from backend when dialog opens
   useEffect(() => {
      if (isOpen) {
         loadEmails();
      }
   }, [isOpen, loadEmails]);

   const handleAddEmail = async () => {
      setError(null);
      setSuccess(null);

      if (!newEmail.trim()) {
         setError('Please enter an email address');
         return;
      }

      try {
         await addEmail(newEmail);
         setSuccess(`Added ${newEmail} successfully!`);
         setNewEmail('');

         // Clear success message after 3 seconds
         setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
         setError(err.message || 'Failed to add email');
      }
   };

   const handleRemoveEmail = async (email: string) => {
      try {
         await removeEmail(email);
         setSuccess(`Removed ${email}`);
         setTimeout(() => setSuccess(null), 2000);
      } catch (err: any) {
         setError(err.message || 'Failed to remove email');
      }
   };

   const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
         handleAddEmail();
      }
   };

   return (
      <AnimatePresence>
         {isOpen && (
            <>
               {/* Backdrop */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
               />

               {/* Dialog */}
               <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                  <motion.div
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                     className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-cyan-500/30 w-full max-w-2xl overflow-hidden"
                  >
                     {/* Header with gradient */}
                     <div className="relative bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 p-6 border-b border-cyan-500/30">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),transparent)]" />

                        <div className="relative flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                              <motion.div
                                 animate={{
                                    rotate: [0, 5, -5, 0],
                                    scale: [1, 1.1, 1],
                                 }}
                                 transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                 }}
                                 className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50"
                              >
                                 <Mail className="w-6 h-6 text-white" />
                              </motion.div>
                              <div>
                                 <h2 className="text-2xl font-bold text-white">Email Settings</h2>
                                 <p className="text-sm text-gray-400 mt-0.5">Configure recipients for daily reports</p>
                              </div>
                           </div>

                           <motion.button
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={onClose}
                              className="w-10 h-10 rounded-lg bg-gray-800/50 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 flex items-center justify-center transition-all group"
                           >
                              <X className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                           </motion.button>
                        </div>
                     </div>

                     {/* Content */}
                     <div className="p-6 space-y-6">
                        {/* Status Messages */}
                        <AnimatePresence>
                           {error && (
                              <motion.div
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                              >
                                 <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                 <p className="text-sm text-red-300">{error}</p>
                              </motion.div>
                           )}

                           {success && (
                              <motion.div
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="flex items-center space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                              >
                                 <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                 <p className="text-sm text-green-300">{success}</p>
                              </motion.div>
                           )}
                        </AnimatePresence>

                        {/* Add Email Input */}
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                              <Send className="w-4 h-4 text-cyan-400" />
                              <span>Add New Recipient</span>
                           </label>
                           <div className="flex space-x-2">
                              <motion.input
                                 whileFocus={{ scale: 1.01 }}
                                 type="email"
                                 value={newEmail}
                                 onChange={e => setNewEmail(e.target.value)}
                                 onKeyPress={handleKeyPress}
                                 placeholder="admin@example.com"
                                 className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                 maxLength={100}
                              />
                              <motion.button
                                 whileHover={{ scale: isLoading ? 1 : 1.05 }}
                                 whileTap={{ scale: isLoading ? 1 : 0.95 }}
                                 onClick={handleAddEmail}
                                 disabled={isLoading}
                                 className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                 ) : (
                                    <Plus className="w-5 h-5" />
                                 )}
                                 <span>{isLoading ? 'Adding...' : 'Add'}</span>
                              </motion.button>
                           </div>
                           <p className="text-xs text-gray-500 mt-1">Maximum 100 characters per email address</p>
                        </div>

                        {/* Email List */}
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
                              <span>Recipients ({emails.length})</span>
                              {emails.length > 0 && <span className="text-xs text-cyan-400">Receives daily reports at 00:00</span>}
                           </label>

                           <div
                              className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
                              style={{
                                 scrollbarWidth: 'thin',
                                 scrollbarColor: '#06b6d4 transparent',
                              }}
                           >
                              <AnimatePresence>
                                 {emails.length === 0 ? (
                                    <motion.div
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1 }}
                                       className="flex flex-col items-center justify-center py-12 space-y-3"
                                    >
                                       <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                          <Mail className="w-8 h-8 text-gray-600" />
                                       </div>
                                       <p className="text-gray-500 text-sm">No recipients configured</p>
                                       <p className="text-gray-600 text-xs">Add email addresses to receive daily reports</p>
                                    </motion.div>
                                 ) : (
                                    emails.map((email, index) => (
                                       <motion.div
                                          key={email}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 20 }}
                                          transition={{ delay: index * 0.05 }}
                                          onMouseEnter={() => setHoveredEmail(email)}
                                          onMouseLeave={() => setHoveredEmail(null)}
                                          className="group flex items-center justify-between p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/50 hover:border-cyan-500/50 transition-all"
                                       >
                                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                                             <motion.div
                                                animate={{
                                                   scale: hoveredEmail === email ? 1.1 : 1,
                                                }}
                                                className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30"
                                             >
                                                <Mail className="w-5 h-5 text-cyan-400" />
                                             </motion.div>
                                             <span className="text-sm text-gray-300 font-mono truncate">{email}</span>
                                          </div>

                                          <motion.button
                                             whileHover={{ scale: isLoading ? 1 : 1.1 }}
                                             whileTap={{ scale: isLoading ? 1 : 0.9 }}
                                             onClick={() => handleRemoveEmail(email)}
                                             disabled={isLoading}
                                             className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                             <Trash2 className="w-4 h-4 text-red-400" />
                                          </motion.button>
                                       </motion.div>
                                    ))
                                 )}
                              </AnimatePresence>
                           </div>
                        </div>
                     </div>

                     {/* Footer */}
                     <div className="p-6 bg-gray-800/30 border-t border-gray-700/50 flex justify-end">
                        <motion.button
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={onClose}
                           className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all cursor-pointer"
                        >
                           Close
                        </motion.button>
                     </div>
                  </motion.div>
               </div>

               {/* Custom Scrollbar Styles */}
               <style jsx global>{`
                  .custom-scrollbar::-webkit-scrollbar {
                     width: 6px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                     background: transparent;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                     background: #06b6d4;
                     border-radius: 3px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                     background: #0891b2;
                  }
               `}</style>
            </>
         )}
      </AnimatePresence>
   );
}
