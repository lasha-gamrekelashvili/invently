import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

interface TenantNotFoundProps {
  error?: { response?: { status?: number; data?: { error?: string } } };
}

const TenantNotFound = ({ error }: TenantNotFoundProps) => {
  const mainDomain = window.location.hostname.includes('localhost')
    ? `http://localhost${window.location.port ? `:${window.location.port}` : ':3000'}`
    : `https://${window.location.hostname.split('.').slice(1).join('.') || 'shopu.ge'}`;

  const isSubscriptionError =
    error?.response?.status === 403 &&
    (error?.response?.data?.error?.includes('Subscription') ||
      error?.response?.data?.error?.includes('inactive'));

  const heading = isSubscriptionError ? 'Store Temporarily Unavailable' : 'Store Not Found';
  const description = isSubscriptionError
    ? "This store's subscription has expired or the store is inactive. Please contact the store owner to renew."
    : "The store you're looking for doesn't exist or is no longer available.";

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-10 text-center shadow-sm">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-3 tracking-tight">
            {heading}
          </h2>

          <p className="text-base text-neutral-600 mb-8 leading-relaxed">
            {description}
          </p>

          <div className="space-y-4">
            <a
              href={mainDomain}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go to Main Site
            </a>
            <p className="text-sm text-neutral-500 font-light">
              Or check the URL and try again
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantNotFound;
