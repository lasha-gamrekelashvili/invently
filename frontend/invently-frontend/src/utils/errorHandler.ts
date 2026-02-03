import toast from 'react-hot-toast';

export const handleApiError = (
  error: any,
  defaultMessage: string = 'An error occurred',
  options: { toast?: boolean } = {}
) => {
  console.error('API Error:', error);
  
  let errorMessage = defaultMessage;
  
  if (error.response) {
    // Server responded with error status
    if (error.response.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response.data?.details) {
      // Handle validation errors
      const details = error.response.data.details;
      if (Array.isArray(details) && details.length > 0) {
        errorMessage = details.map(d => d.message).join(', ');
      }
    } else {
      // Generic HTTP error
      switch (error.response.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied. You don\'t have permission for this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 409:
          errorMessage = 'Conflict. The resource already exists.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error (${error.response.status}). Please try again.`;
      }
    }
  } else if (error.request) {
    // Network error
    errorMessage = 'Network error. Please check your connection and try again.';
  } else {
    // Other error
    errorMessage = error.message || defaultMessage;
  }
  
  const shouldToast = options.toast !== false;
  if (shouldToast) {
    toast.error(errorMessage);
  }
  return errorMessage;
};

export const handleSuccess = (message: string, data?: any) => {
  toast.success(message);
  return data;
};

export const handleInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

export const handleWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fbbf24',
    },
  });
};
