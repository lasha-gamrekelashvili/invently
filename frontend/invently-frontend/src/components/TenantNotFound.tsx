import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

const TenantNotFound = () => {
  const mainDomain = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000' 
    : `https://${window.location.hostname.split('.').slice(1).join('.')}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Store Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            The store you're looking for doesn't exist or is no longer available.
          </p>
          <div className="space-y-4">
            <Link
              to={mainDomain}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go to Main Site
            </Link>
            <p className="text-sm text-gray-500">
              Or check the URL and try again
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantNotFound;
