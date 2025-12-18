import { Injectable, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { Bbox, Post, CreatePostDto } from './post.types';

@Injectable()
export class PostService {
  /**
   * TODO: 향후 PostgreSQL + PostGIS로 대체 예정.
   * 현재는 간단한 인메모리 데이터로 /posts, /posts/:id 를 제공한다.
   */
  private readonly posts: Post[] = this.createSeedPosts();

  /**
   * 단순 리스트 조회용 페이지네이션.
   * createdAt 내림차순으로 정렬 후 page/limit 기준으로 슬라이스한다.
   */
  findPaginated(page = 1, limit = 10): { items: Post[]; totalCount: number } {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;

    const sorted = [...this.posts].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    const totalCount = sorted.length;
    const start = (safePage - 1) * safeLimit;
    const items = sorted.slice(start, start + safeLimit);

    return { items, totalCount };
  }

  findByBbox(bbox: Bbox, limit = 50): Post[] {
    const { minLat, minLng, maxLat, maxLng } = bbox;

    return this.posts
      .filter(
        (post) =>
          post.lat !== null &&
          post.lng !== null &&
          post.lat >= minLat &&
          post.lat <= maxLat &&
          post.lng >= minLng &&
          post.lng <= maxLng,
      )
      .sort((a, b) =>
        a.eventDate < b.eventDate ? 1 : a.eventDate > b.eventDate ? -1 : 0,
      )
      .slice(0, limit);
  }

  findOne(id: string): Post {
    const found = this.posts.find((post) => post.id === id);

    if (!found) {
      throw new NotFoundException(`Post not found: ${id}`);
    }

    return found;
  }

  createPost(createPostDto: CreatePostDto): Post {
    const {
      title,
      content,
      templateType,
      eventDate,
      address,
      lat,
      lng,
      imageUrl,
      tags,
    } = createPostDto;
    const newPost: Post = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      eventDate,
      templateType,
      title,
      content,
      address: address ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      imageUrl,
      tags,
    };

    this.posts.push(newPost);
    return newPost;
  }

  private createSeedPosts(): Post[] {
    // 서울 시청 근처를 중심으로 한 몇 개의 더미 데이터
    const baseLat = 37.5665;
    const baseLng = 126.978;

    const makePost = (overrides: Partial<Post>): Post => {
      const id = overrides.id ?? crypto.randomUUID();
      const createdAt = overrides.createdAt ?? new Date().toISOString();
      const eventDate = overrides.eventDate ?? createdAt;

      const generatedImageUrl = faker.image.urlPicsumPhotos({
        width: 400,
        height: 400,
      });
      const imageUrl = overrides.imageUrl ?? generatedImageUrl;

      return {
        id,
        // overrides로 들어오는 제목/템플릿/주소 등은 기본값보다 우선 적용
        ...overrides,
        title: overrides.title ?? '제목 없는 일기',
        templateType: overrides.templateType ?? 'diary',
        address: overrides.address ?? '서울특별시 중구 세종대로 110',
        lat: overrides.lat ?? baseLat,
        lng: overrides.lng ?? baseLng,
        content:
          overrides.content ??
          '이것은 인메모리 더미 게시글입니다. 실제 데이터베이스 연동 전까지는 서버 메모리에서만 관리됩니다.',
        createdAt,
        eventDate,
        imageUrl,
      };
    };

    return [
      makePost({
        title: '묘한 묘',
        templateType: 'diary',
        address: '서울특별시 종로구 사직로 161 (경복궁 인근)',
        eventDate: '2025-12-07T09:00:00+09:00',
        lat: baseLat + 0.006,
        lng: baseLng + 0.002,
        content: `오늘 아침에는 삼색이가 없었는데 오후에는 있었어요
          오후에 고양이들이 다 부름에 조금 늦는 바람에 못 주고 올라갈 뻔..
          치즈는 옆에서 많이 얻어먹는 모양인지 밥을 줘도 안 먹더라고요. 대신 놀아달래요. 그래서 조금 놀아줬습니다. 나뭇잎을 사용하여..
          오늘 맨다리로 치즈한테 공격받았어요. 딱히 아프진 않았는데 일어서서 다리를 안 듯이 두 팔로 감싸서 맞닿는 털이랑 뼈대(?)가 확실히 느껴졌고.. 간지럽더라고요.
          삼색이는 옆에서 얻어먹어도 준 사료 다 먹어요. 착한 녀석.. 어릴 때는 영역 싸움 잘 하는지 걱정했는데 치즈가 달려들면 경고하는 걸 봐서 아마 자알.. 하고 있는 모양이에요.`,
        imageUrl:
          'https://catnews.net/data/editor/1606/db8d566424a2b5c795bee7e1d87d0674_1465572867_8415.jpg',
      }),
      makePost({
        title: '교육감배 수영 대회',
        templateType: 'diary',
        address: '서울특별시 중구 을지로 100 (을지로입구역 일대)',
        eventDate: '2025-12-09T10:00:00+09:00',
        lat: baseLat - 0.002,
        lng: baseLng + 0.01,
        content: `나는 수영을 다닌다.
          나는 연수다.
          연수는 지옥의 시간이다.
          쉬는 시간도 없고,
          오리발 신고
          저,배,평,자를 5바퀴씩 돌지(저형,배형,평형,자유형)
          교육감배가 시작하고 나서 나는 내 종목인 평형 으로 대회를 나갔어.
          그런데 나는 15등을 해서 슬펐어.
          나는 나 자신에게 욕을 쏙아 부었어.
          "왜 그럴게 못 할까?"
          "등 수 안에도 못 들고.....`,
        imageUrl:
          'https://cdn.ynenews.kr/news/photo/202403/47288_39610_3723.jpg',
      }),
      makePost({
        title: '병원 ㅠㅠㅠㅠ',
        templateType: 'diary',
        address: '서울특별시 영등포구 여의대로 108 (여의도 한강공원 인근)',
        eventDate: '2025-12-17T12:00:00+09:00',
        lat: baseLat - 0.02,
        lng: baseLng - 0.03,
        content: `난 어저께 병원에 갔다왔다.그런데 거기 있던 티비에서 네 기분과 느낌이 똑같은 상황이 티비 에서 나왔다.
          그래서 알고보니 티비에선 그런건 우울증이라고 했다.그래서 난 이렇게 생각 했다.
          내가 왜 우울증에 걸린걸까 아주 곰곰히 생각 했다. 그래서 난 슬프고 오늘 기분이 많이 안 좋다.`,
        imageUrl:
          'https://i0.wp.com/electrek.co/wp-content/uploads/sites/3/2025/05/clear-blue-sky-clouds-avess-berge-ua2IF9HNaXs-unsplash-e1748369914818.jpg?w=1500&quality=82&strip=all&ssl=1',
      }),
      makePost({
        title: '-',
        templateType: 'diary',
        address: '서울특별시 영등포구 국제금융로 10',
        eventDate: '2025-12-16T12:00:00+09:00',
        lat: baseLat - 0.025,
        lng: baseLng - 0.025,
        content: `갸같은 화여일 ㅠㅠ큐ㅠㅠㅠㅠ.`,
        imageUrl:
          'https://velog.velcdn.com/images/hwsa1004/post/b7a31255-3eff-407c-aa64-07c11404df30/image.jpg',
      }),
      makePost({
        title: '주말 알바',
        templateType: 'diary',
        address: '서울특별시 영등포구 여의대로 24',
        eventDate: '2025-12-13T18:00:00+09:00',
        lat: baseLat - 0.018,
        lng: baseLng - 0.015,
        content: `주말 알바 하느라 하루가 다 간다!!
          그래도 오늘 맛있는 마라탕이랑 탕후루 먹었다.
          아주 신난다.`,
        imageUrl:
          'https://mblogthumb-phinf.pstatic.net/MjAyMzA1MzFfOTcg/MDAxNjg1NTMxNDY5ODI1.U2yFqAFw47LCqc2BsCzZg3_iy9Mg2F-rKbgaU7on-7Eg.4UpuJkJ5LSfxsTrRmevqg9Be-6wN1YMLsW_vM0Fcaj8g.JPEG.ssw9014/KakaoTalk_20230531_195428537_03.jpg?type=w966',
      }),
      makePost({
        title: '방학인김에 넷플 싹쓸이~',
        templateType: 'diary',
        address: '서울특별시 영등포구 여의도동',
        eventDate: '2025-12-10T20:00:00+09:00',
        lat: baseLat - 0.02,
        lng: baseLng - 0.02,
        content: `요즘 일본애니 넘 재밌어져서 넷플에서 애니 조지고있어요

          우선 귀칼 넘 재밌고~~ 사실 귀칼은 유포타블에서 액션 캐리한거지 연출이나 대사는 그닥... 아무튼간에 무한성 영화도 너무 재밌었고 이김에 걍 전편 다시 다 봤죠 ㅎㅎ
          장송의 프리렌은 진짜 일상(?) 적인 이야기인데 연출이랑 색감이랑 그런거 너무 좋고 진짜 연출만은 ㄹㅈㄷ 명작입니다
          원펀맨, 원피스, 주술회전도 볼려고 아껴두고 있습니다 ㅎㅎㅎ`,
        imageUrl:
          'https://biz.chosun.com/resizer/v2/XEXATWWA3BH4BEITEGGLGYK4IE.jpg?auth=9759a9cd7849b29298938c0abdb509bc1c45fd99b418b4a7743de4075212b0eb&width=1920&height=1080&smart=true',
      }),
    ];
  }
}
