import dataSource from '../data-source';
import { Post } from '../modules/post/entity/post.entity';
import { PostContributor } from '../modules/post/entity/post-contributor.entity';
import { User } from '../modules/user/user.entity';

const SEED_PROVIDER = 'kakao';
const SEED_PROVIDER_ID = 'seed-owner';

async function run() {
  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(User);
    const postRepo = dataSource.getRepository(Post);
    const contributorRepo = dataSource.getRepository(PostContributor);

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

      await txContributorRepo.delete({ userId: owner.id });
      await txPostRepo.delete({ ownerUserId: owner.id });
      await txUserRepo.delete({ id: owner.id });
    });

    const remaining = await postRepo.count({
      where: { ownerUserId: owner.id },
    });
    const remainingContrib = await contributorRepo.count({
      where: { userId: owner.id },
    });

    console.log(
      `[seed-reset] removed seed data. remaining posts=${remaining} contributors=${remainingContrib}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void run();
