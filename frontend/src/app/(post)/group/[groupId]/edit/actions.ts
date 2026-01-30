'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateGroupProfile(groupId: string) {
  // 그룹 상세 페이지 revalidate
  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}/edit`);
  revalidatePath(`/group/${groupId}/edit/profile`);
}
