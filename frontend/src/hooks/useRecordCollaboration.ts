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
    socket.on(
      'BLOCK_VALUE_STREAM',
      ({ blockId, type, partialValue, sessionId }) => {
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
      },
    );

    // 스트림 중단 시 롤백 (임시값 제거)
    socket.on('STREAM_ABORTED', ({ blockId }) => {
      setStreamingValues((prev) => {
        const { [blockId]: _, ...rest } = prev;
        return rest;
      });
    });

    //  패치 확정 반영
    socket.on('PATCH_COMMITTED', ({ version, patch, authorSessionId }) => {
      versionRef.current = version;
      const commands = Array.isArray(patch) ? patch : [patch];

      // 블록 데이터 반영
      if (authorSessionId !== mySessionId) {
        setBlocks((prev) => {
          let next = [...prev];
          commands.forEach((cmd) => {
            if (cmd.type === 'BLOCK_SET_TITLE') {
              setTitle(cmd.title);
            } else if (cmd.type === 'BLOCK_INSERT') {
              const localType =
                ServerToFieldTypeMap[cmd.block.type] || cmd.block.type;
              const localBlock = { ...cmd.block, type: localType };
              if (!next.find((b) => b.id === localBlock.id)) {
                next.push(localBlock);
              }
            } else if (cmd.type === 'BLOCK_DELETE') {
              next = next.filter((b) => b.id !== cmd.blockId);
            } else if (cmd.type === 'BLOCK_SET_VALUE') {
              next = next.map((b) =>
                b.id === cmd.blockId ? { ...b, value: cmd.value } : b,
              );
            } else if (cmd.type === 'BLOCK_MOVE') {
              setBlocks((prev) => {
                const nextBlocks = cmd.moves
                  .map((moveItem: { blockId: string; layout: BlockLayout }) => {
                    // 현재 로컬에서 해당하는 id 찾기
                    const localBlock = prev.find(
                      (b) => b.id === moveItem.blockId,
                    );

                    // 기존 값들은 유지. 레이아웃만 적용
                    if (localBlock) {
                      return {
                        ...localBlock,
                        layout: moveItem.layout,
                      };
                    }
                    return null;
                  })
                  .filter((b: RecordBlock) => b !== null);
                //정규화
                return normalizeLayout(nextBlocks);
              });
            }
          });
          return normalizeLayout(next);
        });
      }
      // 커밋 완료 시 스티리밍 값 제거
      setStreamingValues((prev) => {
        const nextStreaming = { ...prev };

        commands.forEach((cmd) => {
          if (cmd.type === 'BLOCK_SET_TITLE') {
            delete nextStreaming['title'];
          } else {
            const targetId = cmd.blockId || (cmd.block && cmd.block.id);
            if (targetId) {
              delete nextStreaming[targetId];
            }
          }
        });

        return nextStreaming;
      });
    });

    socket.on('PATCH_REJECTED_STALE', () => {
      toast.error(
        '다른 사용자의 편집으로 인해 버전이 갱신되었습니다. 페이지를 새로고침합니다.',
        {
          duration: 3000,
        },
      );

      setTimeout(() => {
        window.location.reload();
      }, 2_000);
    });
    socket.on('DRAFT_PUBLISHED', ({ postId }) =>
      router.push(`/post/${postId}`),
    );

    return () => {
      socket.off('BLOCK_VALUE_STREAM');
      socket.off('STREAM_ABORTED');
      socket.off('PATCH_COMMITTED');
      socket.off('PATCH_REJECTED_STALE');
      socket.off('DRAFT_PUBLISHED');
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
    (patch: PatchApplyPayload) => {
      socket?.emit('PATCH_APPLY', {
        draftId,
        baseVersion: versionRef.current,
        patch,
      });
    },
    [socket, draftId],
  );

  return { streamingValues, emitStream, applyPatch };
}
