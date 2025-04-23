exports.successResponse = (res, message = "Thành công", data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      error: null,
    });
  };
  
  exports.errorResponse = (res, message = "Thất bại", statusCode = 500, errorDetails = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: {
        code: statusCode,
        details: errorDetails,
      },
    });
  };
  