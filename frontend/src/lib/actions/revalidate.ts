'use server';

import { revalidatePath } from 'next/cache';

export async function refreshHomeData() {
  revalidatePath('/', 'page');
}

export async function refreshRecordData() {
  revalidatePath('/my', 'layout');
}

export async function refreshRecordAndHomeData() {
  revalidatePath('/', 'page');
  revalidatePath('/my', 'layout');
}

export async function refreshRecordGroupAndSharedData(groupId: string) {
  revalidatePath(`/group/${groupId}`, 'layout');
  revalidatePath('/shared');
}

export async function refreshGroupData(groupId: string) {
  revalidatePath(`/group/${groupId}`, 'layout');
}

export async function refreshSharedData() {
  revalidatePath('/shared');
}
