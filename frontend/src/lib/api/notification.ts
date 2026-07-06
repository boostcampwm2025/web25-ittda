import { post, fetchApi } from './api';

export function registerFcmToken(token: string, platform: 'web' | 'android') {
  return post('/api/notifications/fcm-token', { token, platform });
}

export function removeFcmToken(platform: 'web' | 'android') {
  return fetchApi('/api/notifications/fcm-token', {
    method: 'DELETE',
    body: JSON.stringify({ platform }),
  });
}
