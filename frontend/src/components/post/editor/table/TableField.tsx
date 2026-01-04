'use client';

import { Plus, Trash2, MinusCircle } from 'lucide-react';

interface TableFieldProps {
  data: string[][] | null;
  onUpdate: (newData: string[][] | null) => void;
}

export const TableField = ({ data, onUpdate }: TableFieldProps) => {
  if (!data) return null;

  const rowCount = data.length;
  const colCount = data[0]?.length || 0;

  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    const newData = data.map((row, i) =>
      i === rIdx ? row.map((cell, j) => (j === cIdx ? value : cell)) : row,
    );
    onUpdate(newData);
  };

  const addRow = () => {
    const newRow = new Array(colCount).fill('');
    onUpdate([...data, newRow]);
  };

  const addColumn = () => {
    onUpdate(data.map((row) => [...row, '']));
  };

  const removeRow = (rIdx: number) => {
    if (rowCount <= 1) {
      removeTable();
      return;
    }
    onUpdate(data.filter((_, i) => i !== rIdx));
  };

  const removeColumn = (cIdx: number) => {
    if (colCount <= 1) {
      removeTable();
      return;
    }
    onUpdate(data.map((row) => row.filter((_, j) => j !== cIdx)));
  };

  const removeTable = () => {
    onUpdate(null);
  };

  return (
    <div className="group/table relative w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 relative overflow-x-auto hide-scrollbar rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02] shadow-sm mb-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {data[0].map((_, cIdx) => (
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
              {data.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="group/row border-b border-gray-100/50 dark:border-white/5 last:border-none"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-0 border-r border-gray-100/50 dark:border-white/5 last:border-none"
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                        placeholder={rIdx === 0 ? '항목명' : '내용'}
                        className={`w-full p-2.5 text-xs outline-none dark:focus:bg-white/5 transition-colors ${
                          rIdx === 0
                            ? 'font-bold text-itta-black dark:text-white bg-gray-100 dark:bg-gray-100'
                            : 'font-medium text-itta-gray3 bg-transparent '
                        }`}
                      />
                    </td>
                  ))}
                  <td className="w-8 p-0 text-center bg-gray-50/20 dark:bg-white/[0.01]">
                    <button
                      onClick={() => removeRow(rIdx)}
                      className="flex m-auto text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover/row:opacity-100 active:scale-90"
                    >
                      <MinusCircle size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          title="열 추가"
          onClick={addColumn}
          className="shrink-0 mt-1 flex items-center p-2 rounded-lg border border-dashed border-itta-gray2 dark:border-white/10 text-xs font-bold text-gray-400 hover:text-itta-point hover:border-itta-point transition-all active:scale-95 bg-white dark:bg-transparent"
        >
          <Plus size={10} />
        </button>
      </div>

      <div className="flex items-start gap-2 ">
        <button
          title="행 추가"
          onClick={addRow}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-400 hover:text-itta-point hover:border-itta-point transition-all active:scale-95"
        >
          <Plus size={10} /> 행 추가
        </button>
        <button
          onClick={removeTable}
          className="p-1.5 text-gray-400 hover:text-rose-500 opacity-0 group-hover/table:opacity-100 transition-all active:scale-90"
          title="테이블 전체 삭제"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
