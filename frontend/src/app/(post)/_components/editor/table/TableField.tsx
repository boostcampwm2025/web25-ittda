'use client';

import { TableValue } from '@/lib/types/recordField';
import { cn } from '@/lib/utils';
import { Plus, MinusCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TableFieldProps {
  data: TableValue | null;
  onUpdate: (newData: TableValue | null) => void;
  isLocked?: boolean;
  isMyLock?: boolean;
  onFocus?: () => void;
  onBlur?: (finalValue: TableValue) => void;
}

const MAX_ROWS = 4;
const MAX_COLS = 4;

export const TableField = ({
  data,
  onUpdate,
  isLocked,
  isMyLock,
  onFocus,
  onBlur,
}: TableFieldProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const isInternalFocus = useRef(false);

  useEffect(() => {
    if (isMyLock && firstInputRef.current) {
      if (containerRef.current?.contains(document.activeElement)) {
        return;
      }
      isInternalFocus.current = true;
      firstInputRef.current.focus();

      const len = firstInputRef.current.value.length;
      firstInputRef.current.setSelectionRange(len, len);
    }
  }, [isMyLock]);

  // 내부 포커스인지 외부 사용자의 클릭 포커스인지 구분
  const handleFocusWrapper = () => {
    if (isInternalFocus.current || isMyLock) {
      isInternalFocus.current = false;
      return;
    }
    onFocus?.();
  };

  const handleBlurWrapper = (e: React.FocusEvent<HTMLInputElement>) => {
    // 다음에 포커스될 요소가 우리 테이블 안에 있다면 블러 무시
    if (
      e.relatedTarget &&
      containerRef.current?.contains(e.relatedTarget as Node)
    ) {
      return;
    }

    // 테이블 외부로 나갈 때만 onBlur
    if (data) {
      onBlur?.(data);
    }
  };

  if (!data) return null;

  const { rows: rowCount, cols: colCount, cells } = data;

  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    const newCells = cells.map((row, i) =>
      i === rIdx ? row.map((cell, j) => (j === cIdx ? value : cell)) : row,
    );
    onUpdate({
      ...data,
      cells: newCells,
    });
  };

  const addRow = () => {
    if (!canAddRow) return;

    const newRow = new Array(colCount).fill('');
    onUpdate({
      rows: rowCount + 1,
      cols: colCount,
      cells: [...cells, newRow],
    });
  };

  const addColumn = () => {
    if (!canAddColumn) return;
    onUpdate({
      rows: rowCount,
      cols: colCount + 1,
      cells: cells.map((row) => [...row, '']),
    });
  };

  const removeRow = (rIdx: number) => {
    if (rowCount <= 1) {
      removeTable();
      return;
    }
    onUpdate({
      rows: rowCount - 1,
      cols: colCount,
      cells: cells.filter((_, i) => i !== rIdx),
    });
  };

  const removeColumn = (cIdx: number) => {
    if (colCount <= 1) {
      removeTable();
      return;
    }
    onUpdate({
      rows: rowCount,
      cols: colCount - 1,
      cells: cells.map((row) => row.filter((_, j) => j !== cIdx)),
    });
  };

  const removeTable = () => {
    onUpdate(null);
  };

  const canAddRow = rowCount < MAX_ROWS;
  const canAddColumn = colCount < MAX_COLS;

  return (
    <div
      ref={containerRef}
      className={cn(
        'group/table relative w-full transition-opacity',
        isLocked && 'opacity-60 pointer-events-none',
      )}
    >
      <div className="flex items-stretch gap-2">
        <div className="flex-1 min-w-0 relative overflow-x-auto hide-scrollbar rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02] shadow-sm mb-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {cells[0]?.map((_, cIdx) => (
                  <th
                    key={`col-del-${cIdx}`}
                    className="p-1 bg-gray-50/50 dark:bg-white/5 border-r border-gray-100/50 dark:border-white/5 last:border-none"
                  >
                    <button
                      onClick={() => removeColumn(cIdx)}
                      className="flex m-auto text-gray-300 hover:text-rose-500 transition-colors active:scale-90"
                    >
                      <MinusCircle size={12} />
                    </button>
                  </th>
                ))}
                <th className="w-8 bg-gray-50/50 dark:bg-white/5" />
              </tr>
            </thead>
            <tbody>
              {cells.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="group/row border-b border-gray-100/50 dark:border-white/5 last:border-none"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-0 border-r border-gray-100/50 dark:border-white/5 last:border-none overflow-hidden"
                    >
                      <input
                        ref={rIdx === 0 && cIdx === 0 ? firstInputRef : null}
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                        disabled={isLocked && !isMyLock}
                        onFocus={handleFocusWrapper}
                        onBlur={handleBlurWrapper}
                        placeholder={rIdx === 0 ? '항목명' : '내용'}
                        className={`table-cell-input p-2.5 outline-none dark:focus:bg-white/5 transition-colors ${
                          rIdx === 0
                            ? 'font-bold text-itta-black dark:text-white bg-gray-100 dark:bg-white/10'
                            : 'font-medium text-itta-gray3 bg-transparent '
                        }`}
                      />
                    </td>
                  ))}
                  <td className="w-8 p-0 text-center bg-gray-50/20 dark:bg-white/[0.01]">
                    <button
                      disabled={isLocked}
                      onClick={() => removeRow(rIdx)}
                      className="flex m-auto text-gray-300 hover:text-rose-500 transition-colors active:scale-90"
                    >
                      <MinusCircle size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canAddColumn && (
          <button
            title="열 추가"
            disabled={isLocked}
            onClick={addColumn}
            className="shrink-0 mb-2 flex items-center p-2 rounded-lg border border-dashed border-itta-gray2 dark:border-white/10 text-xs font-bold text-gray-400 hover:text-itta-point hover:border-itta-point transition-all active:scale-95 bg-white dark:bg-transparent"
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 ">
        <div className="flex-1">
          {canAddRow && (
            <button
              disabled={isLocked}
              title="행 추가"
              onClick={addRow}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-400 hover:text-itta-point hover:border-itta-point transition-all active:scale-95"
            >
              <Plus size={10} /> 행 추가
            </button>
          )}
        </div>
        <button
          onClick={removeTable}
          className="p-1.5 text-gray-400 hover:text-rose-500 transition-all active:scale-90"
          title="테이블 전체 삭제"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
