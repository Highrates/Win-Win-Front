import { BlogListClient } from './BlogListClient';
import catalogStyles from '../catalog/catalogAdmin.module.css';

export default function AdminBlogPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Блог</h1>
      <BlogListClient />
    </main>
  );
}
