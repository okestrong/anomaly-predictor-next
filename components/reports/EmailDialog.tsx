/**
 * Email Dialog Component
 * Dialog for sending reports via email
 */

'use client';

import { useState } from 'react';
import { X, Mail, Plus, Trash2 } from 'lucide-react';

interface EmailDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onSend: (recipients: string[], subject: string, message: string) => void;
   reportTitle: string;
}

export function EmailDialog({ isOpen, onClose, onSend, reportTitle }: EmailDialogProps) {
   const [recipients, setRecipients] = useState<string[]>(['']);
   const [subject, setSubject] = useState(`Ceph Cluster Report: ${reportTitle}`);
   const [message, setMessage] = useState(
      'Please find the attached Ceph cluster report.\n\nThis report contains cluster health metrics, performance data, and AI-powered insights.'
   );

   const handleAddRecipient = () => {
      setRecipients([...recipients, '']);
   };

   const handleRemoveRecipient = (index: number) => {
      setRecipients(recipients.filter((_, i) => i !== index));
   };

   const handleRecipientChange = (index: number, value: string) => {
      const newRecipients = [...recipients];
      newRecipients[index] = value;
      setRecipients(newRecipients);
   };

   const handleSend = () => {
      const validRecipients = recipients.filter((r) => r.trim() !== '' && r.includes('@'));
      if (validRecipients.length === 0) {
         alert('Please enter at least one valid email address');
         return;
      }
      onSend(validRecipients, subject, message);
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                     <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Report via Email</h2>
                     <p className="text-sm text-slate-600 dark:text-slate-400">
                        {reportTitle}
                     </p>
                  </div>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
               >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
               </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
               {/* Recipients */}
               <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                     Recipients *
                  </label>
                  <div className="space-y-2">
                     {recipients.map((recipient, index) => (
                        <div key={index} className="flex gap-2">
                           <input
                              type="email"
                              value={recipient}
                              onChange={(e) => handleRecipientChange(index, e.target.value)}
                              placeholder="email@example.com"
                              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           />
                           {recipients.length > 1 && (
                              <button
                                 onClick={() => handleRemoveRecipient(index)}
                                 className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           )}
                        </div>
                     ))}
                  </div>
                  <button
                     onClick={handleAddRecipient}
                     className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                     <Plus className="w-4 h-4" />
                     Add another recipient
                  </button>
               </div>

               {/* Subject */}
               <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                     Subject
                  </label>
                  <input
                     type="text"
                     value={subject}
                     onChange={(e) => setSubject(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
               </div>

               {/* Message */}
               <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                     Message
                  </label>
                  <textarea
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     rows={6}
                     className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
               </div>

               {/* Info */}
               <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                     The report will be attached as a PDF file to the email.
                  </p>
               </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
               <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
               >
                  Cancel
               </button>
               <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
               >
                  <Mail className="w-4 h-4" />
                  Send Email
               </button>
            </div>
         </div>
      </div>
   );
}
