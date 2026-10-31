import { useSearchParams } from "react-router-dom";
import ProductBrowser from "../../components/customer/ProductBrowser";

export default function ProductsPage() {
  const [params] = useSearchParams();
  const search = params.get("search");
  return <ProductBrowser title={search ? `Results for "${search}"` : "Shop All Furniture"} />;
}
