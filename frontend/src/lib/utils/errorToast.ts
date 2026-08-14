import { toast } from 'sonner';
import { getErrorMessage } from './errorHandler';

type ErrorToastOptions = Parameters<typeof toast.error>[1];

export function showErrorToast(error: unknown, options?: ErrorToastOptions) {
  return toast.error(getErrorMessage(error), options);
}
