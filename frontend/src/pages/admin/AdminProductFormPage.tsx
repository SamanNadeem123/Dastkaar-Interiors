import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, X, Star, Trash2 } from "lucide-react";
import { useAdminProduct, useAdminProductMutations, useAdminCategories } from "../../hooks/useAdminData";
import { apiErrorMessage } from "../../services/api";
import { Spinner } from "../../components/ui/Feedback";

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  category_id: z.coerce.number().min(1, "Select a category"),
  sku: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  original_price: z.coerce.number().positive("Enter a valid price"),
  sale_price: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  material: z.string().optional(),
  wood_type: z.string().optional(),
  width: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  height: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  depth: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  length: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  weight: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  dimension_unit: z.string().default("in"),
  availability: z.enum(["in_stock", "out_of_stock", "made_to_order", "coming_soon"]),
  stock_quantity: z.coerce.number().min(0),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  is_active: z.boolean().default(true),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { data: product, isLoading } = useAdminProduct(isEditing ? Number(id) : undefined);
  const { data: categories } = useAdminCategories();
  const { create, update, uploadImages, deleteImage, setPrimaryImage } = useAdminProductMutations();
  const [colors, setColors] = useState<{ color_name: string; color_code?: string }[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { dimension_unit: "in", availability: "in_stock", stock_quantity: 0, is_active: true },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category_id: product.category_id,
        sku: product.sku,
        short_description: product.short_description ?? "",
        description: product.description ?? "",
        original_price: product.original_price,
        sale_price: product.sale_price ?? "",
        material: product.material ?? "",
        wood_type: product.wood_type ?? "",
        width: product.width ?? "",
        height: product.height ?? "",
        depth: product.depth ?? "",
        length: product.length ?? "",
        weight: product.weight ?? "",
        dimension_unit: product.dimension_unit,
        availability: product.availability,
        stock_quantity: product.stock_quantity,
        is_featured: product.is_featured,
        is_new: product.is_new,
        is_on_sale: product.is_on_sale,
        is_active: product.is_active,
      });
      setColors(product.colors.map((c) => ({ color_name: c.color_name, color_code: c.color_code ?? undefined })));
    }
  }, [product, reset]);

  function addColor() {
    const name = colorInput.trim();
    if (!name) return;
    if (colors.some((c) => c.color_name.toLowerCase() === name.toLowerCase())) {
      toast.error("That color is already added.");
      return;
    }
    setColors((prev) => [...prev, { color_name: name }]);
    setColorInput("");
  }

  async function onSubmit(data: FormOutput) {
    const payload = {
      ...data,
      sale_price: data.sale_price === "" ? null : Number(data.sale_price),
      width: data.width === "" ? undefined : Number(data.width),
      height: data.height === "" ? undefined : Number(data.height),
      depth: data.depth === "" ? undefined : Number(data.depth),
      length: data.length === "" ? undefined : Number(data.length),
      weight: data.weight === "" ? undefined : Number(data.weight),
      colors,
    };

    try {
      let productId = product?.id;
      if (isEditing && productId) {
        await update.mutateAsync({ id: productId, payload });
      } else {
        const created = await create.mutateAsync(payload);
        productId = created.id;
      }
      if (pendingFiles.length > 0 && productId) {
        await uploadImages.mutateAsync({ id: productId, files: pendingFiles });
      }
      navigate("/admin/products");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  if (isEditing && isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-walnut">
        <ArrowLeft size={15} /> Back to Products
      </Link>
      <h1 className="mt-3 font-display text-2xl text-charcoal">{isEditing ? "Edit Product" : "Add Product"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-8">
        {/* Basic Information */}
        <section className="card-editorial space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Product Name</label>
              <input {...register("name")} className="input-field" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label-field">Category</label>
              <select {...register("category_id")} className="input-field">
                <option value="">Select category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="mt-1 text-xs text-red-600">{errors.category_id.message}</p>}
            </div>
            <div>
              <label className="label-field">SKU (leave blank to auto-generate)</label>
              <input {...register("sku")} className="input-field" placeholder="NAFV-XXXXXX" />
            </div>
          </div>
          <div>
            <label className="label-field">Short Description</label>
            <input {...register("short_description")} className="input-field" />
          </div>
          <div>
            <label className="label-field">Full Description</label>
            <textarea {...register("description")} rows={4} className="input-field resize-none" />
          </div>
        </section>

        {/* Pricing */}
        <section className="card-editorial space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">Pricing (PKR)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Original Price</label>
              <input type="number" step="0.01" {...register("original_price")} className="input-field" />
              {errors.original_price && <p className="mt-1 text-xs text-red-600">{errors.original_price.message}</p>}
            </div>
            <div>
              <label className="label-field">Sale Price (optional)</label>
              <input type="number" step="0.01" {...register("sale_price")} className="input-field" placeholder="Leave blank for no discount" />
              <p className="mt-1 text-xs text-charcoal/45">Discount % is calculated automatically. A sale price equal to or above the original price is ignored.</p>
            </div>
          </div>
        </section>

        {/* Material & Dimensions */}
        <section className="card-editorial space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">Material &amp; Dimensions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Material</label>
              <input {...register("material")} className="input-field" placeholder="e.g. Solid Wood" />
            </div>
            <div>
              <label className="label-field">Wood Type</label>
              <input {...register("wood_type")} className="input-field" placeholder="e.g. Sheesham" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <label className="label-field">Width</label>
              <input type="number" step="0.01" {...register("width")} className="input-field" />
            </div>
            <div>
              <label className="label-field">Height</label>
              <input type="number" step="0.01" {...register("height")} className="input-field" />
            </div>
            <div>
              <label className="label-field">Depth</label>
              <input type="number" step="0.01" {...register("depth")} className="input-field" />
            </div>
            <div>
              <label className="label-field">Length</label>
              <input type="number" step="0.01" {...register("length")} className="input-field" />
            </div>
            <div>
              <label className="label-field">Weight</label>
              <input type="number" step="0.01" {...register("weight")} className="input-field" />
            </div>
          </div>
          <div className="w-40">
            <label className="label-field">Unit</label>
            <select {...register("dimension_unit")} className="input-field">
              <option value="in">Inches</option>
              <option value="ft">Feet</option>
              <option value="cm">Centimeters</option>
              <option value="kg">Kilograms</option>
            </select>
          </div>
        </section>

        {/* Colors */}
        <section className="card-editorial space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">Available Colors</h2>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <span key={c.color_name} className="flex items-center gap-1.5 rounded-full bg-sand-light px-3 py-1.5 text-sm text-charcoal">
                {c.color_name}
                <button type="button" onClick={() => setColors((prev) => prev.filter((x) => x.color_name !== c.color_name))}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
              placeholder="e.g. Walnut"
              className="input-field max-w-xs"
            />
            <button type="button" onClick={addColor} className="btn-secondary">Add Color</button>
          </div>
        </section>

        {/* Availability & Inventory */}
        <section className="card-editorial space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">Availability &amp; Inventory</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Availability</label>
              <select {...register("availability")} className="input-field">
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="made_to_order">Made to Order</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>
            <div>
              <label className="label-field">Stock Quantity</label>
              <input type="number" {...register("stock_quantity")} className="input-field" />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            {(["is_featured", "is_new", "is_on_sale", "is_active"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm text-charcoal">
                <input type="checkbox" {...register(flag)} className="h-4 w-4 rounded border-charcoal/30 text-walnut focus:ring-walnut" />
                {{ is_featured: "Featured", is_new: "New Arrival", is_on_sale: "On Sale", is_active: "Active (visible to customers)" }[flag]}
              </label>
            ))}
          </div>
        </section>

        {/* Images */}
        <section className="card-editorial space-y-4 p-6">
          <h2 className="font-display text-lg text-charcoal">Product Images</h2>
          {isEditing && product && product.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {product.images.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-card bg-sand-light">
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-walnut p-1"><Star size={11} className="text-ivory-100" /></span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-charcoal/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {!img.is_primary && (
                      <button type="button" onClick={() => setPrimaryImage.mutate({ productId: product.id, imageId: img.id })} className="rounded-full bg-ivory-100 p-1.5" aria-label="Set primary">
                        <Star size={13} className="text-charcoal" />
                      </button>
                    )}
                    <button type="button" onClick={() => deleteImage.mutate({ productId: product.id, imageId: img.id })} className="rounded-full bg-ivory-100 p-1.5" aria-label="Delete">
                      <Trash2 size={13} className="text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-charcoal/70 file:mr-4 file:rounded-card file:border-0 file:bg-sand-light file:px-4 file:py-2 file:text-sm file:font-medium file:text-charcoal hover:file:bg-sand"
            />
            {pendingFiles.length > 0 && <p className="mt-1.5 text-xs text-charcoal/50">{pendingFiles.length} file(s) selected — uploaded on save.</p>}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/admin/products" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
