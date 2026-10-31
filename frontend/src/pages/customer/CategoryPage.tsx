import { useParams } from "react-router-dom";
import { useCategory } from "../../hooks/useCatalog";
import ProductBrowser from "../../components/customer/ProductBrowser";
import { EmptyState } from "../../components/ui/Feedback";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading, isError } = useCategory(slug);

  if (isLoading) return <div className="container-editorial py-24 text-center text-charcoal/50">Loading...</div>;
  if (isError || !category) return <EmptyState title="Category not found" description="This category may have been removed." />;

  return <ProductBrowser lockedCategorySlug={category.slug} title={category.name} />;
}
