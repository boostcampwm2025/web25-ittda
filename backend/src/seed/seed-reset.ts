import dataSource from '../data-source';
import { Post } from '../modules/post/entity/post.entity';
import { PostContributor } from '../modules/post/entity/post-contributor.entity';
import { User } from '../modules/user/entity/user.entity';
import { PostDraft } from '../modules/post/entity/post-draft.entity';
import { Group } from '../modules/group/entity/group.entity';
import { GroupMember } from '../modules/group/entity/group_member.entity';

const SEED_PROVIDER = 'kakao';
const SEED_PROVIDER_ID = 'seed-owner';
const DEV_PROVIDER_ID = 'dev-user-001';

async function run() {
  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(User);
    const postRepo = dataSource.getRepository(Post);
    const contributorRepo = dataSource.getRepository(PostContributor);
    const draftRepo = dataSource.getRepository(PostDraft);
    const groupRepo = dataSource.getRepository(Group);
    const memberRepo = dataSource.getRepository(GroupMember);

    const owner = await userRepo.findOne({
      where: { provider: SEED_PROVIDER, providerId: SEED_PROVIDER_ID },
    });
    const devUser = await userRepo.findOne({
      where: { provider: SEED_PROVIDER, providerId: DEV_PROVIDER_ID },
    });

    if (!owner) {
      console.log('[seed-reset] seed owner not found, nothing to delete.');
      return;
    }

    await dataSource.transaction(async (manager) => {
      const txPostRepo = manager.getRepository(Post);
      const txContributorRepo = manager.getRepository(PostContributor);
      const txUserRepo = manager.getRepository(User);
      const txDraftRepo = manager.getRepository(PostDraft);
      const txGroupRepo = manager.getRepository(Group);
      const txMemberRepo = manager.getRepository(GroupMember);

      await txContributorRepo.delete({ userId: owner.id });
      if (devUser) {
        await txContributorRepo.delete({ userId: devUser.id });
      }
      await txPostRepo.delete({ ownerUserId: owner.id });
      if (devUser) {
        await txPostRepo.delete({ ownerUserId: devUser.id });
      }
      await txDraftRepo.delete({ ownerActorId: owner.id });
      await txMemberRepo.delete({ userId: owner.id });
      if (devUser) {
        await txMemberRepo.delete({ userId: devUser.id });
      }
      await txGroupRepo.delete({ owner: { id: owner.id } });
      await txUserRepo.delete({ id: owner.id });
      if (devUser) {
        await txUserRepo.delete({ id: devUser.id });
      }
    });

    const remaining = await postRepo.count({
      where: { ownerUserId: owner.id },
    });
    const remainingContrib = await contributorRepo.count({
      where: { userId: owner.id },
    });
    const remainingDrafts = await draftRepo.count({
      where: { ownerActorId: owner.id },
    });
    const remainingGroups = await groupRepo.count({
      where: { owner: { id: owner.id } },
    });
    const remainingMembers = await memberRepo.count({
      where: { userId: owner.id },
    });

    console.log(
      `[seed-reset] removed seed data. remaining posts=${remaining} contributors=${remainingContrib} drafts=${remainingDrafts} groups=${remainingGroups} members=${remainingMembers}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void run();
