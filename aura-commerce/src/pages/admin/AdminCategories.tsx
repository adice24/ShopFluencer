import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Tag, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminApi } from "@/lib/api";
import { toast } from "sonner";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const raw = await fetchAdminApi("/admin/categories");
      return Array.isArray(raw) ? (raw as CategoryRow[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ name, slug, description }: { name: string; slug: string; description?: string }) =>
      fetchAdminApi("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name, slug, description: description || undefined }),
      }),
    onSuccess: () => {
      toast.success("Category created");
      setName("");
      setSlug("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = slug.trim() || slugify(name);
    if (!name.trim() || !s) return;
    createMutation.mutate({ name: name.trim(), slug: s, description: description.trim() || undefined });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Product categories used across the catalog (same as public catalog).
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
      >
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Plus size={18} /> Add category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Electronics"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="electronics"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[72px]"
            placeholder="Shown in SEO and category pages."
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
          Create category
        </button>
      </motion.form>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border font-semibold text-foreground">Categories ({categories.length})</div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No categories yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((cat, i) => (
              <motion.li
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 p-4 hover:bg-muted/30"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Tag size={18} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{cat.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{cat.slug}</p>
                  {cat.description ? (
                    <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                  ) : null}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
