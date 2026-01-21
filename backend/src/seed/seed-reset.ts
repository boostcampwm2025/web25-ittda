import dataSource from '../data-source';
import { Post } from '../modules/post/entity/post.entity';
import { PostContributor } from '../modules/post/entity/post-contributor.entity';
import { User } from '../modules/user/entity/user.entity';
import { PostDraft } from '../modules/post/entity/post-draft.entity';
import { Group } from '../modules/group/entity/group.entity';

const SEED_PROVIDER = 'kakao';
const SEED_PROVIDER_ID = 'seed-owner';

async function run() {
  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(User);
    const postRepo = dataSource.getRepository(Post);
    const contributorRepo = dataSource.getRepository(PostContributor);
    const draftRepo = dataSource.getRepository(PostDraft);
    const groupRepo = dataSource.getRepository(Group);

    const owner = await userRepo.findOne({
      where: { provider: SEED_PROVIDER, providerId: SEED_PROVIDER_ID },
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

      await txContributorRepo.delete({ userId: owner.id });
      await txPostRepo.delete({ ownerUserId: owner.id });
      await txDraftRepo.delete({ ownerActorId: owner.id });
      await txGroupRepo.delete({ owner: { id: owner.id } });
      await txUserRepo.delete({ id: owner.id });
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

    console.log(
      `[seed-reset] removed seed data. remaining posts=${remaining} contributors=${remainingContrib} drafts=${remainingDrafts} groups=${remainingGroups}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void run();
