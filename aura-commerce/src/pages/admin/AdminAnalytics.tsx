import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAdminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08 },
});

type PlatformAnalytics = {
  summary?: {
    totalStorefrontViews?: number;
    totalProductClicks?: number;
    totalPurchases?: number;
    activeInfluencers?: number;
    totalOrders?: number;
    totalRevenue?: number;
    platformConversionRate?: string;
  };
  dailyChart?: Array<{
    date: string;
    revenue: unknown;
    orders: number;
    totalViews?: number;
  }>;
};

export default function AdminAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAdminApi("/admin/analytics/platform") as Promise<PlatformAnalytics>,
    staleTime: 60_000,
  });

  const summary = data?.summary;
  const chartRows =
    data?.dailyChart?.map((row) => ({
      label: String(row.date ?? "").slice(0, 10),
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    })) ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Live metrics from the API (events + orders). Data depends on tracking and daily aggregation jobs.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="animate-spin" size={20} /> Loading analytics…
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">Could not load analytics. Check API and database.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Storefront views", value: summary?.totalStorefrontViews ?? 0 },
              { label: "Product clicks", value: summary?.totalProductClicks ?? 0 },
              { label: "Purchases (events)", value: summary?.totalPurchases ?? 0 },
              { label: "Platform orders", value: summary?.totalOrders ?? 0 },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...fade(i + 1)}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div
              {...fade(5)}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <p className="text-xs text-muted-foreground">Revenue (confirmed orders)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Conversion (events)</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                ₹{Number(summary?.totalRevenue ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{summary?.platformConversionRate ?? "—"}</p>
            </motion.div>
            <motion.div
              {...fade(6)}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <p className="text-xs text-muted-foreground">Active influencers (verified)</p>
              <p className="text-2xl font-bold text-foreground mt-2">{summary?.activeInfluencers ?? 0}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div {...fade(7)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Revenue (daily aggregates)</h3>
              <div className="h-64">
                {chartRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No daily aggregates yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartRows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(60, 10%, 85%)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 45%)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 45%)" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(68, 80%, 42%)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            <motion.div {...fade(8)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Orders (daily)</h3>
              <div className="h-64">
                {chartRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No daily aggregates yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(60, 10%, 85%)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 45%)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 45%)" />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(236, 60%, 50%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
