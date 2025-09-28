import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsAPI, debounce } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomDropdown from '../components/CustomDropdown';
import DatePicker from '../components/DatePicker';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  UserIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { AuditLog } from '../types';

const Logs = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const debouncedSetSearchQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['auditLogs', currentPage, actionFilter, resourceFilter, searchQuery, startDate, endDate],
    queryFn: () => auditLogsAPI.getAuditLogs({
      page: currentPage,
      limit: 20,
      action: actionFilter || undefined,
      resource: resourceFilter || undefined,
      search: searchQuery || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });

  const { data: logsStats } = useQuery({
    queryKey: ['auditLogStats'],
    queryFn: () => auditLogsAPI.getAuditLogStats(),
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <PlusIcon className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <PencilIcon className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <TrashIcon className="h-4 w-4 text-red-600" />;
      case 'LOGIN':
        return <ArrowRightIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <EyeIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource.toUpperCase()) {
      case 'PRODUCT':
        return 'bg-blue-50 text-blue-700';
      case 'CATEGORY':
        return 'bg-indigo-50 text-indigo-700';
      case 'ORDER':
        return 'bg-orange-50 text-orange-700';
      case 'USER':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderDataDiff = (oldData: any, newData: any) => {
    if (!oldData && !newData) return null;

    return (
      <div className="space-y-4">
        {oldData && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Previous Data:</h5>
            <pre className="bg-red-50 p-3 rounded-lg text-xs overflow-x-auto border">
              {JSON.stringify(oldData, null, 2)}
            </pre>
          </div>
        )}
        {newData && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">New Data:</h5>
            <pre className="bg-green-50 p-3 rounded-lg text-xs overflow-x-auto border">
              {JSON.stringify(newData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-1">
            Track all actions and changes in your store
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {logsStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {logsStats.totalLogs}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Logs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-50 border border-green-200">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {logsStats.logsLast7Days}
                </div>
                <div className="text-sm text-gray-600 font-medium">Last 7 Days</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {logsStats.logsLast30Days}
                </div>
                <div className="text-sm text-gray-600 font-medium">Last 30 Days</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <UserIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(logsStats.recentUsers?.map((log: any) => log.userId)).size || 0}
                </div>
                <div className="text-sm text-gray-600 font-medium">Active Users</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearchQuery(e.target.value);
                }}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <CustomDropdown
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                { value: '', label: 'All Actions' },
                { value: 'CREATE', label: 'Create' },
                { value: 'UPDATE', label: 'Update' },
                { value: 'DELETE', label: 'Delete' },
                { value: 'LOGIN', label: 'Login' },
              ]}
              placeholder="All Actions"
            />
          </div>

          {/* Resource Filter */}
          <div>
            <CustomDropdown
              value={resourceFilter}
              onChange={setResourceFilter}
              options={[
                { value: '', label: 'All Resources' },
                { value: 'PRODUCT', label: 'Products' },
                { value: 'CATEGORY', label: 'Categories' },
                { value: 'ORDER', label: 'Orders' },
                { value: 'USER', label: 'Users' },
              ]}
              placeholder="All Resources"
            />
          </div>

          {/* Date Range */}
          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="From"
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="To"
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={clearDateFilter}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-200"
                >
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : logsData?.data?.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logsData.data.map((log: AuditLog) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleLogClick(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full border ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getResourceColor(log.resource)}`}>
                          {log.resource}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            {log.user ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.user.firstName} {log.user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{log.user.email}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.anonymousUserName || 'Anonymous User'}
                                </div>
                                <div className="text-sm text-gray-500">{log.anonymousUserEmail || 'Guest'}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsData.pagination && logsData.pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(logsData.pagination.pages, currentPage + 1))}
                    disabled={currentPage === logsData.pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page {currentPage} of {logsData.pagination.pages}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(logsData.pagination.pages, currentPage + 1))}
                        disabled={currentPage === logsData.pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">
              {actionFilter || resourceFilter ? 'Try adjusting your filters.' : 'Audit logs will appear here as actions are performed in your store.'}
            </p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Audit Log Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <div className="flex items-center">
                    {getActionIcon(selectedLog.action)}
                    <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full border ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getResourceColor(selectedLog.resource)}`}>
                    {selectedLog.resource}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.user
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.email})`
                      : `${selectedLog.anonymousUserName || 'Anonymous User'} (${selectedLog.anonymousUserEmail || 'Guest'})`
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedLog.createdAt)}</p>
                </div>
                {selectedLog.resourceId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedLog.resourceId}</p>
                  </div>
                )}
              </div>

              {/* Data Changes */}
              {(selectedLog.oldData || selectedLog.newData) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Data Changes</label>
                  {renderDataDiff(selectedLog.oldData, selectedLog.newData)}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;