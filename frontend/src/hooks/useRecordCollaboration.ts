import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { RecordBlock, BlockValue, BlockLayout } from '@/lib/types/recordField';
import { useRouter } from 'next/navigation';
import {
  getDefaultValue,
  normalizeLayout,
} from '@/app/(post)/_utils/recordLayoutHelper';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { ServerToFieldTypeMap } from '@/lib/utils/mapBlocksToPayload';
import { toast } from 'sonner';

type QueuedPatch = {
  patch: PatchApplyPayload | PatchApplyPayload[];
  resolveDispatched: (dispatched: boolean) => void;
  dispatched: boolean;
};

export function useRecordCollaboration(
  draftId: string | undefined,
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>,
  setTitle: (val: string) => void,
  initialVersion: number = 0,
  groupId?: string,
) {
  const { socket, sessionId: mySessionId } = useSocketStore();
  // mySessionId를 ref로도 유지 — PATCH_COMMITTED 핸들러가 effect 클로저에 캡처된 값이 아닌
  // 항상 최신 sessionId를 참조하도록 함 (sessionId 설정 전에 이벤트가 도착하면
  // authorSessionId !== null 조건이 true가 되어 자신의 패치를 타인 패치로 잘못 처리하는 버그 방지)
  const mySessionIdRef = useRef(mySessionId);
  useEffect(() => {
    mySessionIdRef.current = mySessionId;
  });
  const router = useRouter();
  const versionRef = useRef(initialVersion);
  const [isPublishing, setIsPublishing] = useState(false);
  const isNavigatingToRecordRef = useRef(false);
  const pendingPatchQueueRef = useRef<QueuedPatch[]>([]);
  const patchInFlightRef = useRef(false);
  const pendingPatchWaitersRef = useRef<Array<() => void>>([]);
  const pendingPatchRejectedRef = useRef(false);

  useEffect(() => {
    if (initialVersion > versionRef.current) {
      versionRef.current = initialVersion;
    }
  }, [initialVersion]);

  const resolvePendingPatchWaiters = useCallback(() => {
    if (pendingPatchQueueRef.current.length > 0) {
      return;
    }
    const waiters = pendingPatchWaitersRef.current;
    pendingPatchWaitersRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  const dispatchNextPatch = useCallback(() => {
    if (patchInFlightRef.current || !socket || !draftId) {
      return;
    }

    const next = pendingPatchQueueRef.current[0];
    if (!next) {
      resolvePendingPatchWaiters();
      return;
    }

    patchInFlightRef.current = true;
    next.dispatched = true;
    socket.emit('PATCH_APPLY', {
      draftId,
      baseVersion: versionRef.current,
      patch: next.patch,
    });
    // Socket.IO는 같은 소켓의 emit 순서를 보장한다. 호출부는 이 시점 이후에만
    // LOCK_RELEASE를 보내야 패치보다 락 해제가 먼저 도착하지 않는다.
    next.resolveDispatched(true);
  }, [socket, draftId, resolvePendingPatchWaiters]);

  const waitForPendingPatches = useCallback((timeoutMs = 3000) => {
    if (pendingPatchQueueRef.current.length === 0) {
      return Promise.resolve(!pendingPatchRejectedRef.current);
    }

    return new Promise<boolean>((resolve) => {
      let timer: NodeJS.Timeout | null = null;
      const resolveWaiter = () => {
        if (timer) {
          clearTimeout(timer);
        }
        resolve(
          !pendingPatchRejectedRef.current &&
            pendingPatchQueueRef.current.length === 0,
        );
      };

      pendingPatchWaitersRef.current.push(resolveWaiter);
      timer = setTimeout(() => {
        pendingPatchWaitersRef.current = pendingPatchWaitersRef.current.filter(
          (waiter) => waiter !== resolveWaiter,
        );
        resolve(
          !pendingPatchRejectedRef.current &&
            pendingPatchQueueRef.current.length === 0,
        );
      }, timeoutMs);
    });
  }, []);

  // 임시 스트리밍 값
  const [streamingValues, setStreamingValues] = useState<
    Record<string, BlockValue>
  >({});

  useEffect(() => {
    if (!socket || !draftId) return;

    //스트림으로 데이터 수신
    const handleBlockValueStream = ({
      blockId,
      type,
      partialValue,
      sessionId,
    }: {
      blockId: string;
      type: string;
      partialValue: BlockValue;
      sessionId: string;
    }) => {
      if (sessionId === mySessionIdRef.current) return;

      const localType = ServerToFieldTypeMap[type] || 'content';

      // 임시 값 저장
      setStreamingValues((prev) => ({ ...prev, [blockId]: partialValue }));

      // 내 blocks에 이 ID가 없다면 추가
      setBlocks((prev) => {
        if (prev.some((b) => b.id === blockId)) return prev;

        const ghostBlock = {
          id: blockId,
          type: localType,
          value: getDefaultValue(localType),
          layout: { row: 0, col: 0, span: 2 },
          isOptimistic: true,
        } as RecordBlock;

        // 기존 블록들 뒤에 배치
        return normalizeLayout([...prev, ghostBlock]);
      });
    };
    socket.on('BLOCK_VALUE_STREAM', handleBlockValueStream);

    // 스트림 중단 시 롤백 (임시값 제거)
    const handleStreamAborted = ({ blockId }: { blockId: string }) => {
      setStreamingValues((prev) => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
    };
    socket.on('STREAM_ABORTED', handleStreamAborted);

    //  패치 확정 반영
    const handlePatchCommitted = ({
      version,
      patch,
      authorSessionId,
    }: {
      version: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      patch: any;
      authorSessionId: string;
    }) => {
      // 이미 처리한 버전이거나 오래된 버전이면 무시
      // (다른 유저 join 시 서버가 catch-up용 PATCH_COMMITTED를 broadcast하면
      //  versionRef가 퇴행하거나 이미 적용된 값으로 덮어써지는 것을 방지)
      const isOwnPatch = authorSessionId === mySessionIdRef.current;
      const acknowledgedOwnPatch = isOwnPatch && patchInFlightRef.current;
      const isNewVersion = version > versionRef.current;

      if (isNewVersion) {
        versionRef.current = version;
      }

      if (acknowledgedOwnPatch) {
        pendingPatchQueueRef.current.shift();
        patchInFlightRef.current = false;
      }

      // 이미 반영한 원격 패치는 UI에 다시 적용하지 않는다. 단, 내 패치 ACK라면
      // 큐를 진행해야 하므로 위의 dequeue 처리는 버전 검사보다 먼저 수행한다.
      if (!isNewVersion && !acknowledgedOwnPatch) return;
      const commands = Array.isArray(patch) ? patch : [patch];

      // 블록 데이터 반영
      if (authorSessionId !== mySessionIdRef.current) {
        // BLOCK_SET_TITLE은 setBlocks updater 밖에서 별도 처리
        // (updater 함수는 순수 함수여야 하므로 내부에서 다른 setState 호출 금지 — Concurrent Mode 이중 실행 방지)
        const titleCmd = commands.find(
          (cmd: { type: string }) => cmd.type === 'BLOCK_SET_TITLE',
        );
        if (titleCmd && titleCmd.type === 'BLOCK_SET_TITLE') {
          setTitle(titleCmd.title);
        }

        setBlocks((prev) => {
          let next = [...prev];
          commands.forEach(
            (cmd: {
              type: string;
              blockId?: string;
              block?: RecordBlock;
              value?: BlockValue;
              moves?: { blockId: string; layout: BlockLayout }[];
              title?: string;
            }) => {
              if (cmd.type === 'BLOCK_SET_TITLE') {
                // 위에서 처리
              } else if (cmd.type === 'BLOCK_INSERT') {
                const localType =
                  ServerToFieldTypeMap[
                    (cmd.block as RecordBlock & { type: string }).type
                  ] || (cmd.block as RecordBlock & { type: string }).type;
                const localBlock = { ...cmd.block, type: localType };
                if (
                  !next.find((b) => b.id === (localBlock as RecordBlock).id)
                ) {
                  next.push(localBlock as RecordBlock);
                }
              } else if (cmd.type === 'BLOCK_DELETE') {
                next = next.filter((b) => b.id !== cmd.blockId);
              } else if (cmd.type === 'BLOCK_SET_VALUE') {
                next = next.map((b) =>
                  b.id === cmd.blockId ? { ...b, value: cmd.value } : b,
                ) as RecordBlock[];
              } else if (cmd.type === 'BLOCK_MOVE') {
                const moveMap = new Map<string, BlockLayout>(
                  (cmd.moves ?? []).map(
                    (m: { blockId: string; layout: BlockLayout }) => [
                      m.blockId,
                      m.layout,
                    ],
                  ),
                );
                next = next.map((b) => {
                  const newLayout = moveMap.get(b.id);
                  return newLayout ? { ...b, layout: newLayout } : b;
                });
                // normalizeLayout은 배열 순서를 기준으로 row/col을 다시 계산한다.
                // 원격 이동 좌표만 덮어쓰고 기존 배열 순서를 유지하면 바로 이전 순서로
                // 되돌아가므로, 전달받은 좌표 순서로 배열도 함께 재정렬한다.
                next.sort(
                  (a, b) =>
                    a.layout.row - b.layout.row || a.layout.col - b.layout.col,
                );
              }
            },
          );
          return normalizeLayout(next);
        });
      }
      // 커밋 완료 시 스트리밍 값 제거
      // BLOCK_INSERT는 제거하지 않음: 확정 시점에 User A가 아직 타이핑 중일 수 있으며,
      // streaming value가 살아있어야 User B가 실시간 내용을 볼 수 있음.
      // streaming value는 이후 BLOCK_SET_VALUE(blur 시) 또는 BLOCK_DELETE가 확정될 때 제거됨.
      setStreamingValues((prev) => {
        const nextStreaming = { ...prev };

        commands.forEach(
          (cmd: { type: string; blockId?: string; block?: RecordBlock }) => {
            if (cmd.type === 'BLOCK_SET_TITLE') {
              delete nextStreaming['title'];
            } else if (cmd.type === 'BLOCK_INSERT') {
              // 유지: User A가 타이핑 중일 수 있으므로 스트리밍 값 보존
            } else {
              const targetId = cmd.blockId || (cmd.block && cmd.block.id);
              if (targetId) {
                delete nextStreaming[targetId];
              }
            }
          },
        );

        return nextStreaming;
      });

      if (acknowledgedOwnPatch) {
        dispatchNextPatch();
        resolvePendingPatchWaiters();
      }
    };
    socket.on('PATCH_COMMITTED', handlePatchCommitted);

    const handlePatchRejectedStale = () => {
      pendingPatchRejectedRef.current = true;
      pendingPatchQueueRef.current.forEach((queuedPatch) => {
        if (!queuedPatch.dispatched) {
          queuedPatch.resolveDispatched(false);
        }
      });
      pendingPatchQueueRef.current = [];
      patchInFlightRef.current = false;
      resolvePendingPatchWaiters();
      toast.error(
        '다른 사용자의 편집으로 인해 버전이 갱신되었습니다. 페이지를 새로고침합니다.',
        {
          duration: 3000,
        },
      );

      setTimeout(() => {
        window.location.reload();
      }, 2_000);
    };
    socket.on('PATCH_REJECTED_STALE', handlePatchRejectedStale);

    const handleDraftPublishStarted = ({
      draftId: id,
    }: {
      draftId: string;
    }) => {
      if (id === draftId) setIsPublishing(true);
    };
    socket.on('DRAFT_PUBLISH_STARTED', handleDraftPublishStarted);

    const handleDraftPublished = ({ postId }: { postId: string }) => {
      // 이미 HTTP 응답으로 이동 중이면(저장자) 중복 네비게이션 방지
      if (!isNavigatingToRecordRef.current) {
        isNavigatingToRecordRef.current = true;
        const url = groupId
          ? `/record/${postId}?scope=group&groupId=${groupId}`
          : `/record/${postId}`;
        router.replace(url);
      }

      setTimeout(() => {
        toast.success(
          '공동 기록이 저장되었습니다.\n저장된 내용을 확인해보세요.',
          {
            duration: 3000,
            style: {
              whiteSpace: 'pre-wrap',
            },
          },
        );
      }, 500);
    };
    socket.on('DRAFT_PUBLISHED', handleDraftPublished);

    const handleDraftPublishEnded = ({
      draftId: id,
      currentVersion,
    }: {
      draftId: string;
      currentVersion?: number;
    }) => {
      if (id !== draftId) return;
      // 이미 기록 페이지로 이동 중이면 아무것도 하지 않음.
      // setIsPublishing(false)를 호출하면 PostEditor의 draftTimeoutRef 효과가
      // 트리거되어 "기록을 찾을 수 없습니다." 토스트 후 그룹 페이지로 이동하는 버그 발생.
      if (isNavigatingToRecordRef.current) return;
      setIsPublishing(false);
      if (
        typeof currentVersion === 'number' &&
        currentVersion > versionRef.current
      ) {
        versionRef.current = currentVersion;
        window.location.reload();
      }
    };
    socket.on('DRAFT_PUBLISH_ENDED', handleDraftPublishEnded);

    return () => {
      socket.off('BLOCK_VALUE_STREAM', handleBlockValueStream);
      socket.off('STREAM_ABORTED', handleStreamAborted);
      socket.off('PATCH_COMMITTED', handlePatchCommitted);
      socket.off('PATCH_REJECTED_STALE', handlePatchRejectedStale);
      socket.off('DRAFT_PUBLISH_STARTED', handleDraftPublishStarted);
      socket.off('DRAFT_PUBLISHED', handleDraftPublished);
      socket.off('DRAFT_PUBLISH_ENDED', handleDraftPublishEnded);
    };
  }, [
    socket,
    draftId,
    setBlocks,
    setTitle,
    router,
    groupId,
    resolvePendingPatchWaiters,
    dispatchNextPatch,
  ]);

  const emitStream = useCallback(
    (blockId: string, partialValue: BlockValue) => {
      socket?.emit('BLOCK_VALUE_STREAM', {
        draftId,
        blockId,
        partialValue,
        sessionId: mySessionId,
      });
    },
    [socket, draftId, mySessionId],
  );

  const applyPatch = useCallback(
    (patch: PatchApplyPayload | PatchApplyPayload[]): Promise<boolean> => {
      // photos 블록의 tempUrls(data URL)는 로컬 미리보기 전용이므로 WebSocket 전송 전에 제거
      const sanitize = (p: PatchApplyPayload): PatchApplyPayload => {
        if (
          p.type === 'BLOCK_SET_VALUE' &&
          p.value != null &&
          'tempUrls' in p.value
        ) {
          return { ...p, value: { ...p.value, tempUrls: [] } };
        }
        if (
          p.type === 'BLOCK_INSERT' &&
          p.block.type === 'photos' &&
          p.block?.value != null &&
          'tempUrls' in p.block.value
        ) {
          return {
            ...p,
            block: {
              ...p.block,
              value: { ...p.block.value, tempUrls: [] },
            },
          };
        }
        return p;
      };

      const sanitized = Array.isArray(patch)
        ? patch.map(sanitize)
        : sanitize(patch);
      if (!socket || !draftId) {
        return Promise.resolve(false);
      }

      pendingPatchRejectedRef.current = false;
      const dispatched = new Promise<boolean>((resolveDispatched) => {
        pendingPatchQueueRef.current.push({
          patch: sanitized,
          resolveDispatched,
          dispatched: false,
        });
      });
      dispatchNextPatch();
      return dispatched;
    },
    [socket, draftId, dispatchNextPatch],
  );

  const markNavigatingToRecord = () => {
    isNavigatingToRecordRef.current = true;
  };

  const resetNavigatingToRecord = () => {
    isNavigatingToRecordRef.current = false;
  };

  return {
    streamingValues,
    emitStream,
    applyPatch,
    waitForPendingPatches,
    versionRef,
    isPublishing,
    setIsPublishing,
    markNavigatingToRecord,
    resetNavigatingToRecord,
  };
}
