import { ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AllWsExceptionFilter } from './AllWsExceptionFilter';

describe('AllWsExceptionFilter', () => {
  const createHost = () => {
    let emittedPayload: unknown;
    const client = {
      id: 'socket-id',
      emit: jest.fn((_event: string, payload: unknown) => {
        emittedPayload = payload;
      }),
    };
    const host = {
      switchToWs: () => ({
        getClient: () => client,
      }),
    } as ArgumentsHost;

    return {
      client,
      host,
      getEmittedPayload: () => emittedPayload,
    };
  };

  it('알려진 WS 예외를 code와 안전 메시지로 변환한다', () => {
    const filter = new AllWsExceptionFilter();
    const { client, host, getEmittedPayload } = createHost();

    filter.catch(new WsException('Draft is full.'), host);

    expect(client.emit).toHaveBeenCalledTimes(1);
    expect(getEmittedPayload()).toMatchObject({
      code: 'WS_DRAFT_FULL',
      message: '참여 인원이 가득 찼습니다.',
    });
    const payload = getEmittedPayload() as { requestId: string };
    expect(payload.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
  });

  it('알 수 없는 WsException의 원문을 숨긴다', () => {
    const filter = new AllWsExceptionFilter();
    const { client, host } = createHost();

    filter.catch(new WsException('query failed: password=secret'), host);

    expect(client.emit).toHaveBeenCalledWith(
      'exception',
      expect.objectContaining({
        code: 'WS_ERROR',
        message: '실시간 요청을 처리할 수 없습니다.',
      }),
    );
  });

  it('처리되지 않은 예외의 원문과 stack을 숨긴다', () => {
    const filter = new AllWsExceptionFilter();
    const { client, host } = createHost();

    filter.catch(new Error('database connection failed'), host);

    expect(client.emit).toHaveBeenCalledWith(
      'exception',
      expect.objectContaining({
        code: 'WS_INTERNAL_ERROR',
        message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }),
    );
  });
});
