import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init(); // app.init()을 호출하면 NestJS 애플리케이션이
    // 실제로 초기화되고, 내부적으로 HTTP 서버 인스턴스
    // (app.getHttpServer())가 생성되어 리스닝을 시작할 준비
  });

  afterAll(async () => {
    await app.close(); // 애플리케이션 인스턴스를 닫아 서버 핸들을 해제합니다.
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
