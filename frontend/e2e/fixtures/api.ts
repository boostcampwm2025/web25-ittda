import { Page, Browser, BrowserContext } from '@playwright/test';

const TODAY = new Date().toISOString().split('T')[0];

export interface CreatedRecord {
  id: string;
  title: string;
}

export interface CreatedGroup {
  id: string;
  inviteCode: string;
}

async function getAuthHeaders(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === 'x-guest-access-token')?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 테스트용 기록을 실 백엔드에 생성하고 id를 반환한다.
 * @param options.extraBlocks - 기본 DATE/TIME/TEXT 블록 뒤에 추가할 블록 (row 3+부터 지정)
 *   태그 추가 예시: { type: 'tags', value: { tags: ['tag1'] }, layout: { row: 3, col: 1, span: 2 } }
 */
export async function createTestRecord(
  page: Page,
  title = 'E2E 테스트 기록',
  date = TODAY,
  options?: {
    extraBlocks?: Array<{ type: string; value: object; layout: { row: number; col: number; span: number } }>;
  },
): Promise<CreatedRecord> {
  const headers = await getAuthHeaders(page);
  const blocks = [
    { type: 'DATE', value: { date }, layout: { row: 1, col: 1, span: 1 } },
    { type: 'TIME', value: { time: '12:00' }, layout: { row: 1, col: 2, span: 1 } },
    { type: 'TEXT', value: { text: 'E2E 테스트 내용입니다.' }, layout: { row: 2, col: 1, span: 2 } },
    ...(options?.extraBlocks ?? []),
  ];
  const res = await page.request.post('/api/posts', {
    headers,
    data: { title, blocks, scope: 'PERSONAL' },
  });

  const body = await res.json();
  if (!body.success) throw new Error(`기록 생성 실패: ${JSON.stringify(body.error)}`);
  return { id: body.data.id, title };
}

/**
 * 테스트용 기록을 삭제한다.
 */
export async function deleteTestRecord(
  page: Page,
  recordId: string,
): Promise<void> {
  const headers = await getAuthHeaders(page);
  await page.request.delete(`/api/posts/${recordId}`, { headers });
}

// 1×1 투명 PNG (68 bytes)
const MINIMAL_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';

/**
 * 1×1 PNG를 MinIO에 업로드하고 mediaId를 반환한다.
 * presign → PUT → complete 3단계 플로우.
 */
export async function uploadTestImage(page: Page): Promise<string> {
  const headers = await getAuthHeaders(page);

  const presignRes = await page.request.post('/api/media/presign', {
    headers,
    data: { files: [{ contentType: 'image/png', size: 68 }] },
  });
  const presignBody = await presignRes.json();
  if (!presignBody.success) throw new Error(`presign 실패: ${JSON.stringify(presignBody.error)}`);

  const { mediaId, uploadUrl } = presignBody.data.items[0] as {
    mediaId: string;
    uploadUrl: string;
  };

  const imageData = Buffer.from(MINIMAL_PNG_B64, 'base64');
  const uploadRes = await page.request.put(uploadUrl, {
    data: imageData,
    headers: { 'Content-Type': 'image/png' },
  });
  if (!uploadRes.ok()) throw new Error(`MinIO 업로드 실패: ${uploadRes.status()}`);

  const completeRes = await page.request.post('/api/media/complete', {
    headers,
    data: { mediaIds: [mediaId] },
  });
  const completeBody = await completeRes.json();
  if (!completeBody.success) throw new Error(`complete 실패: ${JSON.stringify(completeBody.error)}`);

  return mediaId;
}

/**
 * 테스트용 그룹을 생성하고 초대 코드를 반환한다.
 */
export async function createTestGroup(
  page: Page,
  name = 'E2E 테스트 그룹',
): Promise<CreatedGroup> {
  const headers = await getAuthHeaders(page);

  const groupRes = await page.request.post('/api/groups', {
    headers,
    data: { name },
  });
  const groupBody = await groupRes.json();
  if (!groupBody.success) throw new Error(`그룹 생성 실패: ${JSON.stringify(groupBody.error)}`);

  const groupId = groupBody.data.id;

  const inviteRes = await page.request.post(`/api/groups/${groupId}/invites`, {
    headers,
    data: { permission: 'EDITOR', expiresInSeconds: 86400 },
  });
  const inviteBody = await inviteRes.json();
  if (!inviteBody.success) throw new Error(`초대 코드 생성 실패: ${JSON.stringify(inviteBody.error)}`);

  return { id: groupId, inviteCode: inviteBody.data.code };
}

/**
 * 새 게스트 계정을 생성하고 auth setup과 동일하게 쿠키 + localStorage를 세팅한 BrowserContext를 반환한다.
 */
export async function createGuestSession(browser: Browser): Promise<BrowserContext> {
  const ctx = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await ctx.newPage();

  const res = await page.request.post('/api/auth/guest');
  const body = await res.json();
  const authHeader = res.headers()['authorization'] ?? '';
  const token = authHeader.replace('Bearer ', '');
  const sessionId = body?.data?.guestSessionId ?? '';

  if (!body.success || !token || !sessionId) throw new Error('게스트 세션 생성 실패');

  // 쿠키 설정 (auth.setup.ts와 동일)
  await ctx.addCookies([
    { name: 'x-guest-session-id', value: sessionId, domain: 'localhost', path: '/' },
    { name: 'x-guest-access-token', value: token, domain: 'localhost', path: '/' },
  ]);

  // localStorage에 auth-storage 주입 (Zustand persist 스토어가 이 값을 읽음)
  await page.goto('/login');
  await page.evaluate(
    ({ sessionId, token }) => {
      const authState = {
        state: {
          userType: 'guest',
          userId: null,
          guestSessionId: sessionId,
          guestAccessToken: token,
          guestSessionExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          isLoggedIn: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authState));
    },
    { sessionId, token },
  );

  await page.close();
  return ctx;
}

/**
 * 초대 코드로 그룹에 참여한다.
 */
export async function joinTestGroup(page: Page, inviteCode: string): Promise<void> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.post(`/api/groups/invites/${inviteCode}/join`, { headers, data: {} });
  const body = await res.json();
  if (!body.success) throw new Error(`그룹 참여 실패: ${JSON.stringify(body.error)}`);
}

/**
 * 공동 기록 draft를 생성하고 draftId를 반환한다.
 */
export async function createTestDraft(page: Page, groupId: string): Promise<string> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.get(`/api/groups/${groupId}/posts/new`, { headers });
  const body = await res.json();
  if (!body.success) throw new Error(`드래프트 생성 실패: ${JSON.stringify(body.error)}`);
  const redirectUrl: string = body.data.redirectUrl;
  return redirectUrl.split('/').pop() ?? '';
}

/**
 * 테스트용 그룹을 삭제한다.
 */
export async function deleteTestGroup(
  page: Page,
  groupId: string,
): Promise<void> {
  const headers = await getAuthHeaders(page);
  await page.request.delete(`/api/groups/${groupId}`, { headers });
}

/**
 * 그룹에서 나간다 (DELETE /api/groups/{groupId}/members/me).
 */
export async function leaveTestGroup(page: Page, groupId: string): Promise<void> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.delete(`/api/groups/${groupId}/members/me`, { headers });
  const body = await res.json();
  if (!body.success) throw new Error(`그룹 나가기 실패: ${JSON.stringify(body.error)}`);
}

/**
 * 그룹 내 닉네임을 설정한다 (PATCH /api/groups/{groupId}/members/me).
 */
export async function updateGroupMemberProfile(
  page: Page,
  groupId: string,
  nickname: string,
): Promise<void> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.patch(`/api/groups/${groupId}/members/me`, {
    headers,
    data: { nicknameInGroup: nickname },
  });
  const body = await res.json();
  if (!body.success) throw new Error(`그룹 프로필 변경 실패: ${JSON.stringify(body.error)}`);
}

/**
 * 특정 멤버의 역할을 변경한다 (PATCH /api/groups/{groupId}/members/{userId}/role).
 */
export async function changeMemberRole(
  page: Page,
  groupId: string,
  userId: string,
  role: 'ADMIN' | 'EDITOR' | 'VIEWER',
): Promise<void> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.patch(`/api/groups/${groupId}/members/${userId}/role`, {
    headers,
    data: { role },
  });
  const body = await res.json();
  if (!body.success) throw new Error(`역할 변경 실패: ${JSON.stringify(body.error)}`);
}

export interface GroupMemberInfo {
  userId: string;
  role: string;
  name: string;
  nicknameInGroup: string;
}

/**
 * 그룹 설정(멤버 목록 포함)을 조회한다 (GET /api/groups/{groupId}/settings).
 */
export async function getGroupSettings(
  page: Page,
  groupId: string,
): Promise<{ members: GroupMemberInfo[] }> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.get(`/api/groups/${groupId}/settings`, { headers });
  const body = await res.json();
  if (!body.success) throw new Error(`그룹 설정 조회 실패: ${JSON.stringify(body.error)}`);
  return body.data;
}

/**
 * 현재 계정을 탈퇴 처리한다 (DELETE /api/me).
 */
export async function withdrawTestUser(page: Page): Promise<void> {
  const headers = await getAuthHeaders(page);
  const res = await page.request.delete('/api/me', { headers });
  const body = await res.json();
  if (!body.success) throw new Error(`회원 탈퇴 실패: ${JSON.stringify(body.error)}`);
}
