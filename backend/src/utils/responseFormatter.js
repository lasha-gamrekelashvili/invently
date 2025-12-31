export class ApiResponse {
  static success(data, message = null) {
    const response = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  static error(message, details = null) {
    const response = {
      success: false,
      error: message,
    };

    if (details) {
      response.details = details;
    }

    return response;
  }

  static paginated(items, total, page, limit, message = null) {
    const response = {
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  static created(data, message = 'Resource created successfully') {
    return {
      success: true,
      data,
      message,
    };
  }

  static updated(data, message = 'Resource updated successfully') {
    return {
      success: true,
      data,
      message,
    };
  }

  static deleted(message = 'Resource deleted successfully') {
    return {
      success: true,
      message,
    };
  }

  static notFound(resource = 'Resource') {
    return {
      success: false,
      error: `${resource} not found`,
    };
  }

  static unauthorized(message = 'Unauthorized access') {
    return {
      success: false,
      error: message,
    };
  }

  static forbidden(message = 'Access forbidden') {
    return {
      success: false,
      error: message,
    };
  }

  static validationError(errors) {
    return {
      success: false,
      error: 'Validation failed',
      details: errors,
    };
  }
}
