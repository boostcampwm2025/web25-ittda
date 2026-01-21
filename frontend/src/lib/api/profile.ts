import { queryOptions } from '@tanstack/react-query';
import { UserProfileResponse } from '../types/profileResponse';
import { createApiError } from '../utils/errorHandler';
import { get } from './api';

export const userProfileOptions = () =>
  queryOptions({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await get<UserProfileResponse>('/api/me');

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
  });
