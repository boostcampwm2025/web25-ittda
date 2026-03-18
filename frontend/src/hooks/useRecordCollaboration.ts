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

export function useRecordCollaboration(
  draftId: string | undefined,
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>,
  setTitle: (val: string) => void,
  initialVersion: number = 0,
) {
  const { socket, sessionId: mySessionId } = useSocketStore();
  const router = useRouter();
  const versionRef = useRef(initialVersion);
  const [isPublishing, setIsPublishing] = useState(false);
  const isNavigatingToRecordRef = useRef(false);

  useEffect(() => {
    if (initialVersion > versionRef.current) {
      versionRef.current = initialVersion;
    }
  }, [initialVersion]);

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
      if (sessionId === mySessionId) return;

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
      if (version <= versionRef.current) return;
      versionRef.current = version;
      const commands = Array.isArray(patch) ? patch : [patch];

      // 블록 데이터 반영
      if (authorSessionId !== mySessionId) {
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
              }
            },
          );
          return normalizeLayout(next);
        });
      }
      // 커밋 완료 시 스트리밍 값 제거
      setStreamingValues((prev) => {
        const nextStreaming = { ...prev };

        commands.forEach(
          (cmd: { type: string; blockId?: string; block?: RecordBlock }) => {
            if (cmd.type === 'BLOCK_SET_TITLE') {
              delete nextStreaming['title'];
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
    };
    socket.on('PATCH_COMMITTED', handlePatchCommitted);

    const handlePatchRejectedStale = () => {
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
        router.replace(`/record/${postId}`);
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
      setIsPublishing(false);
      // DRAFT_PUBLISHED로 이미 기록 페이지로 이동 중이면 reload 금지
      if (isNavigatingToRecordRef.current) return;
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
  }, [socket, draftId, mySessionId, setBlocks, setTitle, router]);

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
    (patch: PatchApplyPayload | PatchApplyPayload[]) => {
      socket?.emit('PATCH_APPLY', {
        draftId,
        baseVersion: versionRef.current,
        patch,
      });
    },
    [socket, draftId],
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
    versionRef,
    isPublishing,
    setIsPublishing,
    markNavigatingToRecord,
    resetNavigatingToRecord,
  };
}
