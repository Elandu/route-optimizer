'use client';

interface Props {
  onDragStart: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
}

export default function ResizeHandle({ onDragStart }: Props) {
  return (
    <div
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      className="h-2 bg-gray-500 cursor-row-resize w-full"
    />
  );
}
