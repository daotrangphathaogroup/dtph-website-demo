import Link from 'next/link';
import {ArrowLeft, FileQuestion} from 'lucide-react';
import PublicShell from '../components/PublicShell';
import {EmptyState, PageHeader} from '../components/ui/primitives';
export default function NotFound() {
  return (
    <PublicShell hideNavigation>
      <PageHeader
        title="Không tìm thấy trang"
        description="Đường dẫn này không tồn tại hoặc đã được thay đổi."
      />
      <section className="panel">
        <EmptyState
          title="Trang bạn cần tìm chưa có ở đây"
          icon={<FileQuestion size={24} />}
          action={
            <Link className="button primary" href="/">
              <ArrowLeft size={16} />
              Quay về trang chủ
            </Link>
          }
        />
      </section>
    </PublicShell>
  );
}
