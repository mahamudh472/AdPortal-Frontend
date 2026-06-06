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
  X
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

  // Truncate text to 17 characters
  const truncateText = (text: string): string => {
    if (!text) return '';
    if (text.length <= 17) return text;
    return text.substring(0, 17) + '...';
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
      
      // Re-fetch to update list after deletion
      await fetchContacts(currentPage, debouncedSearch);

      // Close modals
      closeDeleteModal();
      if (selectedContact?.id === contactToDelete.id) {
        closeModal();
      }
      
      // Show success message
      toast.success('Contact message deleted successfully', {
        duration: 3000,
        position: 'top-center',
      });
      
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Failed to delete message. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return formatToLocalDate(dateString);
  };

  // Format datetime for modal
  const formatDateTime = (dateString: string): string => {
    return formatToLocalDateTime(dateString);
  };

  return (
    <div className="min-h-screen  p-2">
      {/* Header */}
      <div className="mb-8">
        <h1 className="lg:text-3xl text-2xl font-bold text-gray-800 mb-2">Contact Messages</h1>
        <p className="text-gray-600">View and manage messages submitted via the public contact form</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search messages by name, email, or subject..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border overflow-hidden p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading contact messages...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-xl border overflow-hidden p-12">
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Error Loading Messages</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => fetchContacts(currentPage, debouncedSearch)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-linear-to-r bg-gray-100 text-gray-800">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Message</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact: Contact, index: number) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-gray-50 transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{contact.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{truncateText(contact.subject)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{truncateText(contact.message)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(contact.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(contact)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={(e: React.MouseEvent) => openDeleteModal(contact, e)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No messages found</h3>
              <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalCount)} of {totalCount} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {isModalOpen && selectedContact && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white bg- rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Contact Message Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <p className="text-lg font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedContact.name}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <p className="text-lg text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedContact.email}
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Subject
                </label>
                <p className="text-lg text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedContact.subject}
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedContact.message}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Submission Date & Time
                </label>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {formatDateTime(selectedContact.created_at)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
           
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && contactToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Are you sure you want to delete this contact message from{' '}
                <span className="font-semibold text-gray-800">{contactToDelete.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
     
    </div>
  );
};

export default AdminContact;