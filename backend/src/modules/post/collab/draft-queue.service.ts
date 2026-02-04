import { Injectable } from '@nestjs/common';

@Injectable()
export class DraftQueueService {
  private readonly queues = new Map<string, Promise<unknown>>();
  // 각 draftId별로 현재 진행 중이거나 대기 중인 Promise 체인을 저장합니다.

  /**
   * 특정 드래프트에 대해 작업을 순차적으로 실행합니다.
   * 이전 작업이 완료된 후 다음 작업이 시작됩니다.
   */
  async run<T>(draftId: string, task: () => Promise<T>): Promise<T> {
    const previousTask = this.queues.get(draftId) ?? Promise.resolve();
    // 큐에 저장된 이전 Promise

    const currentTask = previousTask.then(async () => {
      // 이전 작업이 끝난 뒤 실행할 새 작업.
      try {
        return await task();
      } catch (error) {
        console.error(`Task failed for draftId ${draftId}:`, error);
        throw error as Error;
      } finally {
        // 큐를 비우거나 다음 작업을 위해 유지
        if (this.queues.get(draftId) === currentTask) {
          // const currentTask = previousTask.then(...) 실행 시점에 currentTask가 만들어져서 클로저 참조문제 없음
          this.queues.delete(draftId);
          // 작업이 모두 끝났다면 큐를 비워서 “이 draftId는 현재 아무 작업도 없다”는 상태를 명확히 해줍니다.
        }
      }
    });

    // 주의: then()은 새로운 promise를 반환하므로 이를 큐에 저장합니다.
    // 하지만 async/await 환경에서 then 내부의 에러가 전파되도록 처리해야 합니다.
    this.queues.set(
      draftId,
      currentTask.catch(() => {}), // 에러를 무시하는 안전한 Promise를 큐에 저장
    );

    return currentTask; //  호출자에게는 에러/결과를 그대로 전달: await run(...) 했을 때 실제 task()의 결과
  }
}
// JS에서는 스레드 락(lock) 같은 개념이 없으니, 이런 큐 기반 직렬화가 흔히 쓰입니다.
