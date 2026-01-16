import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";

/**
 * Standard API error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * Standard API success response
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * Generate request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Handle API errors uniformly
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error("API Error:", error);

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    return errorResponse("VALIDATION_ERROR", "Dados inválidos", 400, error.errors);
  }

  // Authentication errors
  if (error instanceof UnauthorizedError) {
    return errorResponse("UNAUTHORIZED", error.message, 401);
  }

  // Authorization errors
  if (error instanceof ForbiddenError) {
    return errorResponse("FORBIDDEN", error.message, 403);
  }

  // Generic errors
  if (error instanceof Error) {
    return errorResponse("INTERNAL_ERROR", error.message, 500);
  }

  return errorResponse("UNKNOWN_ERROR", "Erro desconhecido", 500);
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandling<T>(
  handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<NextResponse> {
  return async (...args: any[]) => {
    try {
      const result = await handler(...args);
      return successResponse(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

