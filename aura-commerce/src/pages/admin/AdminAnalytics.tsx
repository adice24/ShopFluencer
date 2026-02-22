import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 12400 }, { month: "Feb", revenue: 18200 }, { month: "Mar", revenue: 22100 },
  { month: "Apr", revenue: 19800 }, { month: "May", revenue: 28400 }, { month: "Jun", revenue: 32100 },
];

const ordersData = [
  { month: "Jan", orders: 320 }, { month: "Feb", orders: 480 }, { month: "Mar", orders: 620 },
  { month: "Apr", orders: 510 }, { month: "May", orders: 780 }, { month: "Jun", orders: 920 },
];

const fade = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 } });

export default function AdminAnalytics() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
        <p className="text-muted-foreground text-sm">Revenue and order trends across the platform</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fade(1)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(60, 10%, 85%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(68, 80%, 52%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fade(2)} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Orders by Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(60, 10%, 85%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(236, 60%, 50%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
