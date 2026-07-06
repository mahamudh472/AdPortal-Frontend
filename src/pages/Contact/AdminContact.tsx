import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Mail, 
  User, 
  Calendar, 
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

import { toast } from 'sonner';
import api from '@/lib/axios';
import { formatToLocalDate, formatToLocalDateTime } from '@/lib/dateUtils';

// Type definitions
interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Contact[];
}

const AdminContact: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const itemsPerPage: number = 5;
  const totalPages: number = Math.ceil(totalCount / itemsPerPage);

  const fetchContacts = async (page: number = 1, search: string = ''): Promise<void> => {
    setLoading(true);
    try {
      const params: { page: number; search?: string } = { page };
      if (search) params.search = search;
      const response = await api.get<PaginatedResponse>('/admin/contact-messages/', { params });
      setContacts(response.data.results);
      setTotalCount(response.data.count);
      setError(null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contact messages. Please try again.');
      toast.error('Failed to load contact messages', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch contacts when page or debounced search changes
  useEffect(() => {
    fetchContacts(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const indexOfFirstItem: number = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem: number = currentPage * itemsPerPage;

  // Truncate text
  const truncateText = (text: string, len: number = 22): string => {
    if (!text) return '';
    if (text.length <= len) return text;
    return text.substring(0, len) + '...';
  };

  // Open modal with selected contact
  const openModal = (contact: Contact): void => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = (): void => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  // Open delete confirmation modal
  const openDeleteModal = (contact: Contact, e: React.MouseEvent): void => {
    e.stopPropagation();
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  // Close delete modal
  const closeDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setContactToDelete(null);
  };

  // Handle delete contact
  const handleDelete = async (): Promise<void> => {
    if (!contactToDelete) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/contact-messages/${contactToDelete.id}/`);
      await fetchContacts(currentPage, debouncedSearch);
      closeDeleteModal();
      if (selectedContact?.id === contactToDelete.id) {
        closeModal();
      }
      toast.success('Contact message deleted successfully');
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Failed to delete message. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Contact Messages</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          View and manage messages submitted via the public contact form
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
        <div className="relative flex-1 max-w-md flex items-center border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-500 transition-colors">
          <Search className="text-slate-400 mr-2 w-4 h-4" />
          <input
            type="text"
            placeholder="Search messages by name, email, or subject..."
            className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 px-1 font-bold text-sm">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden p-16 shadow-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-xs text-slate-500 font-semibold">Loading contact messages...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden p-16 shadow-sm flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-900 mb-2">Error Loading Messages</h3>
            <p className="text-xs text-slate-500 font-semibold mb-4">{error}</p>
            <button
              onClick={() => fetchContacts(currentPage, debouncedSearch)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left w-[200px]">Name</th>
                  <th className="px-6 py-4 text-left w-[220px]">Email</th>
                  <th className="px-6 py-4 text-left w-[180px]">Subject</th>
                  <th className="px-6 py-4 text-left w-[240px]">Message</th>
                  <th className="px-6 py-4 text-center w-[140px]">Date</th>
                  <th className="px-6 py-4 text-right pr-6 w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.length > 0 ? (
                  contacts.map((contact: Contact) => (
                    <tr 
                      key={contact.id} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Name with initials avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            {getInitials(contact.name)}
                          </div>
                          <span className="text-xs font-bold text-slate-900 leading-snug">{contact.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-500 leading-snug">{contact.email}</span>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-700">{truncateText(contact.subject, 20)}</span>
                      </td>

                      {/* Message */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-400">{truncateText(contact.message, 30)}</span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatToLocalDate(contact.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions view / delete */}
                      <td className="px-6 py-4 text-right pr-6">
                        <div className="inline-flex gap-2 justify-end">
                          <button
                            onClick={() => openModal(contact)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 hover:text-blue-800 rounded-xl transition-colors text-xs font-bold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={(e: React.MouseEvent) => openDeleteModal(contact, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 hover:text-red-800 rounded-xl transition-colors text-xs font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                      <div className="max-w-md mx-auto">
                        <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-slate-900 mb-2">No messages found</h3>
                        <p className="text-xs text-slate-400 font-medium">Try adjusting your search terms to locate submitted forms.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-semibold">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalCount)} of {totalCount} results
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="h-8 w-8 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm flex items-center justify-center">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 text-slate-600 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {isModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-2 border-b border-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Message Details</h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Name */}
              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Full Name</span>
                </label>
                <p className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-800 font-extrabold">
                  {selectedContact.name}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
                <p className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-800 font-extrabold">
                  {selectedContact.email}
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Subject</span>
                </label>
                <p className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-800 font-extrabold">
                  {selectedContact.subject}
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message Body</span>
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedContact.message}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-slate-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted On</span>
                </label>
                <p className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-slate-800 font-extrabold">
                  {formatToLocalDateTime(selectedContact.created_at)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 mt-6">
              <button
                onClick={closeModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Confirm Deletion</h2>
            </div>

            {/* Modal Body */}
            <div className="text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                Are you sure you want to delete this contact message from{' '}
                <span className="font-extrabold text-slate-950">{contactToDelete.name}</span>?
              </p>
              <p className="mt-2 text-red-600">
                This action is permanent and cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-50">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {deleteLoading && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContact;