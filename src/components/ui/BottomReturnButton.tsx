interface BottomReturnButtonProps {
  onClick: () => void;
  label?: string;
}

export function BottomReturnButton({ onClick, label = '↵ 返回' }: BottomReturnButtonProps) {
  return (
    <div className="shrink-0 px-4 py-3 border-t border-gray-100">
      <button
        onClick={onClick}
        className="w-full py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-300 text-gray-600 font-medium transition-colors"
      >
        {label}
      </button>
    </div>
  );
}
