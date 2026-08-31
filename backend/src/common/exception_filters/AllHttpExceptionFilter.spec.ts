import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AllHttpExceptionFilter } from './AllHttpExceptionFilter';

describe('AllHttpExceptionFilter', () => {
  const createHost = (clientRequestId?: string) => {
    let responseBody: unknown;
    const response = {
      headersSent: false,
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn((body: unknown) => {
        responseBody = body;
      }),
    };
    const request = {
      headers: clientRequestId ? { 'x-request-id': clientRequestId } : {},
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    return {
      host,
      response,
      getResponseBody: () => responseBody,
    };
  };

  it('알 수 없는 예외의 원문을 숨긴다', () => {
    const filter = new AllHttpExceptionFilter();
    const { host, response, getResponseBody } = createHost();

    filter.catch(new Error('password=secret'), host);

    const body = getResponseBody() as { error: { requestId: string } };
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        requestId: body.error.requestId,
      },
    });
  });

  it('명시적인 코드가 있는 4xx 예외의 메시지만 노출한다', () => {
    const filter = new AllHttpExceptionFilter();
    const { host, response, getResponseBody } = createHost();
    const exception = new HttpException(
      {
        code: 'ALREADY_JOINED',
        message: '이미 참여한 그룹입니다.',
        details: { constraint: 'group_member_unique' },
      },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, host);

    const body = getResponseBody() as { error: { requestId: string } };
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'ALREADY_JOINED',
        message: '이미 참여한 그룹입니다.',
        requestId: body.error.requestId,
      },
    });
  });

  it('DTO 검증 오류를 공통 검증 오류로 치환한다', () => {
    const filter = new AllHttpExceptionFilter();
    const { host, response, getResponseBody } = createHost();
    const exception = new BadRequestException([
      'email must be an email',
      'password must be longer than 8 characters',
    ]);

    filter.catch(exception, host);

    const body = getResponseBody() as { error: { requestId: string } };
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값을 확인해 주세요.',
        requestId: body.error.requestId,
      },
    });
  });

  it('요청 ID가 없으면 새 요청 ID를 생성한다', () => {
    const filter = new AllHttpExceptionFilter();
    const { host, response, getResponseBody } = createHost();

    filter.catch(new BadRequestException('raw message'), host);

    const body = getResponseBody() as {
      error: { requestId: string; message: string };
    };
    expect(body.error.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
    expect(body.error.message).toBe('잘못된 요청입니다.');
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      body.error.requestId,
    );
  });

  // 회귀 테스트: 클라이언트가 보낸 x-request-id를 그대로 신뢰해 응답에
  // 반영하면, 임의 값을 재사용해 예외 로그를 다른 요청과 뒤섞을 수 있었다.
  // 이제는 클라이언트가 뭘 보내든 서버가 항상 직접 발급한다.
  it('클라이언트가 보낸 요청 ID는 신뢰하지 않고 항상 새로 발급한다', () => {
    const filter = new AllHttpExceptionFilter();
    const { host, response, getResponseBody } = createHost(
      'req_client-supplied-id',
    );

    filter.catch(new BadRequestException(), host);

    const body = getResponseBody() as {
      error: { requestId: string };
    };
    expect(body.error.requestId).not.toBe('req_client-supplied-id');
    expect(body.error.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      body.error.requestId,
    );
  });
});
