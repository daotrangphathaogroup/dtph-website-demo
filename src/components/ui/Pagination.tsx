import {ChevronLeft, ChevronRight} from 'lucide-react';
import {IconButton} from './primitives';
export default function Pagination({
  page,
  pages,
  total,
  size,
  onPage,
  onSize,
  label = 'hồ sơ',
  syncedAt,
}: {
  page: number;
  pages: number;
  total: number;
  size: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
  label?: string;
  syncedAt?: string;
}) {
  return (
    <footer className="data-pagination">
      <span>
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} trên ${total.toLocaleString('vi-VN')} ${label}`
          : `0 ${label}`}
      </span>
      <div className="pagination-controls">
        <label>
          Số dòng
          <select
            aria-label="Số dòng mỗi trang"
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
          >
            {[25, 50, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <nav aria-label="Phân trang">
          <IconButton label="Trang trước" disabled={page === 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft size={18} />
          </IconButton>
          <span className="page-indicator">
            {page} <span>/ {pages}</span>
          </span>
          <IconButton label="Trang sau" disabled={page === pages} onClick={() => onPage(page + 1)}>
            <ChevronRight size={18} />
          </IconButton>
        </nav>
      </div>
      {syncedAt && (
        <small>
          Đồng bộ lúc{' '}
          {new Date(syncedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
        </small>
      )}
    </footer>
  );
}
