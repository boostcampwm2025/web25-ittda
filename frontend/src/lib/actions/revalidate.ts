'use server';

import { revalidatePath } from 'next/cache';

export async function refreshHomeData() {
  revalidatePath('/', 'page');
}

export async function refreshRecordData() {
  revalidatePath('/my', 'page');
  revalidatePath('/group', 'page');
}

export async function refreshGroupData(groupId: string) {
  revalidatePath(`/group/${groupId}`);
}

export async function refreshSharedData() {
  revalidatePath('/shared');
}
