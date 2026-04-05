import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Layers3,
  LineChart,
  Loader2,
  RefreshCcw,
  Target,
  Users,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type AnalyticsTab = 'forecast' | 'catalog' | 'customers';

interface OverviewStat {
  label: string;
  value: string | number;
  change: string;
  mlInsight: string;
}

interface RevenuePoint {
  month: string;
  actual: number;
  predicted: number;
  confidence: number;
}

interface CategoryPerformance {
  category: string;
  sales: number;
  growth: number;
  mlScore: number;
}

interface TopProductInsight {
  id: number;
  name: string;
  currentSales: number;
  predictedSales: number;
  performanceScore: number;
  trend: 'up' | 'down';
}

interface AnalyticsAnomaly {
  id: number;
  name: string;
  currentSales: number;
  predictedSales: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
}

interface AnalyticsDashboard {
  overview: OverviewStat[];
  revenueData: RevenuePoint[];
  categoryPerformance: CategoryPerformance[];
  topProducts: TopProductInsight[];
  anomalies: AnalyticsAnomaly[];
  customerInsights: {
    segmentDistribution: CustomerSegment[];
  };
}

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const RevenueForecastChart: React.FC<{ data: RevenuePoint[] }> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return null;
  }

  const chartWidth = 520;
  const chartHeight = 260;
  const paddingX = 36;
  const paddingTop = 28;
  const paddingBottom = 42;
  const groupWidth = 44;
  const innerBarGap = 8;
  const barWidth = 18;
  const maxValue = Math.max(...data.flatMap((point) => [point.actual, point.predicted]), 1);
  const availableWidth = chartWidth - paddingX * 2;
  const stepX = data.length > 0 ? availableWidth / data.length : 0;

  const getGroupX = (index: number) => paddingX + stepX * index + (stepX - groupWidth) / 2;
  const getY = (value: number) => {
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    return paddingTop + usableHeight - (value / maxValue) * usableHeight;
  };

  return (
    <div className="rounded-[28px] border border-white/50 bg-white/70 p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-950/60">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[220px] w-full sm:h-[260px]">
        {[0, 1, 2, 3].map((row) => {
          const y = paddingTop + ((chartHeight - paddingTop - paddingBottom) / 3) * row;
          return (
            <line
              key={row}
              x1={paddingX}
              x2={chartWidth - paddingX}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              className="text-slate-500"
            />
          );
        })}

        {data.map((point, index) => (
          <g key={point.month}>
            {hoveredIndex === index && (
              <rect
                x={getGroupX(index) - 10}
                y={paddingTop - 6}
                width={groupWidth + 20}
                height={chartHeight - paddingTop - paddingBottom + 12}
                rx="14"
                fill="rgb(148 163 184 / 0.12)"
              />
            )}
            <rect
              x={getGroupX(index)}
              y={getY(point.actual)}
              width={barWidth}
              height={chartHeight - paddingBottom - getY(point.actual)}
              rx="8"
              fill="rgb(15 23 42)"
              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.45}
              className="dark:fill-cyan-300"
            />
            <rect
              x={getGroupX(index) + barWidth + innerBarGap}
              y={getY(point.predicted)}
              width={barWidth}
              height={chartHeight - paddingBottom - getY(point.predicted)}
              rx="8"
              fill="rgb(249 115 22)"
              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.45}
            />
            <text
              x={getGroupX(index) + groupWidth / 2}
              y={chartHeight - 14}
              textAnchor="middle"
              className="fill-slate-500 text-[12px] dark:fill-slate-400"
            >
              {point.month}
            </text>
            <rect
              x={getGroupX(index) - 12}
              y={paddingTop - 8}
              width={groupWidth + 24}
              height={chartHeight - paddingTop - paddingBottom + 20}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
            />
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && (
        <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-4 text-sm text-white dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="min-w-0 rounded-xl bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Month</p>
              <p className="mt-1.5 font-semibold tracking-[0.02em] text-white">{data[hoveredIndex].month}</p>
            </div>
            <div className="min-w-0 rounded-xl bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Actual</p>
              <p className="mt-1.5 inline-flex max-w-full items-center gap-2 font-semibold text-white">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-cyan-300" />
                <span className="truncate">{formatCurrency(data[hoveredIndex].actual)}</span>
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Predicted</p>
              <p className="mt-1.5 inline-flex max-w-full items-center gap-2 font-semibold text-white">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="truncate">{formatCurrency(data[hoveredIndex].predicted)}</span>
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Confidence</p>
              <p className="mt-1.5 font-semibold text-slate-200">
                {Math.round(data[hoveredIndex].confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600 dark:text-slate-400">
        <div className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-950 dark:bg-cyan-300" />
          Actual revenue
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Predicted revenue
        </div>
      </div>
    </div>
  );
};

const SegmentDonut: React.FC<{ segments: CustomerSegment[] }> = ({ segments }) => {
  const normalizedSegments = segments.length > 0 ? segments : [{ segment: 'No data', count: 0, percentage: 100 }];
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;
  const colors = ['#0f172a', '#22d3ee', '#f97316', '#a855f7'];

  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
      <div className="mx-auto flex w-full justify-center xl:mx-0 xl:w-auto xl:justify-start">
        <div className="relative h-56 w-56">
          <div className="absolute inset-[38px] rounded-full border border-slate-200/80 bg-white/90 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] dark:border-slate-700/80 dark:bg-slate-900/95" />
          <div className="absolute inset-[54px] rounded-full bg-[radial-gradient(circle_at_top,#ecfeff,transparent_65%)] dark:bg-[radial-gradient(circle_at_top,#164e63,transparent_65%)]" />
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="18" />
          {normalizedSegments.map((segment, index) => {
            const segmentLength = (Math.max(segment.percentage, 0) / 100) * circumference;
            const currentOffset = offsetAccumulator;
            offsetAccumulator += segmentLength;
            return (
              <circle
                key={segment.segment}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="18"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Customer mix</p>
            <p className="mt-2 text-3xl font-bold leading-none text-slate-950 dark:text-slate-50">
              {normalizedSegments.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">tracked users</p>
          </div>
        </div>
      </div>

      <div className="grid w-full gap-4 xl:max-w-xs">
        {normalizedSegments.map((segment, index) => (
          <div
            key={segment.segment}
            className="rounded-[22px] border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/80"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="font-semibold text-slate-900 dark:text-slate-100">{segment.segment}</span>
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{segment.percentage}%</span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{segment.count} customers in this lifecycle bucket.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsCharts: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('forecast');
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(3);
  const [visibleAnomalyCount, setVisibleAnomalyCount] = useState(3);
  const [visibleTopProductCount, setVisibleTopProductCount] = useState(5);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!token) {
        if (isMounted) {
          setLoading(false);
          setError('Admin authentication is required to load analytics.');
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const payload = await apiRequest<AnalyticsDashboard>('/analytics/dashboard', { token });
        if (isMounted) {
          setDashboard(payload);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token, refreshKey]);

  const revenueData = dashboard?.revenueData ?? [];
  const categoryPerformance = dashboard?.categoryPerformance ?? [];
  const topProducts = dashboard?.topProducts ?? [];
  const anomalies = dashboard?.anomalies ?? [];
  const segmentDistribution = dashboard?.customerInsights.segmentDistribution ?? [];
  const visibleCategories = categoryPerformance.slice(0, visibleCategoryCount);
  const visibleAnomalies = anomalies.slice(0, visibleAnomalyCount);
  const visibleTopProducts = topProducts.slice(0, visibleTopProductCount);
  const latestRevenuePoint = revenueData[revenueData.length - 1];
  const strongestCategory = [...categoryPerformance].sort((a, b) => b.mlScore - a.mlScore)[0];
  const topProduct = topProducts[0];
  const highlightCards = [
    {
      label: 'Predicted revenue',
      value: latestRevenuePoint ? formatCurrency(latestRevenuePoint.predicted) : '$0',
      meta: latestRevenuePoint ? `${Math.round(latestRevenuePoint.confidence * 100)}% forecast confidence` : 'Waiting for model data',
      icon: LineChart,
    },
    {
      label: 'Best category signal',
      value: strongestCategory ? strongestCategory.category : 'No category',
      meta: strongestCategory ? `${strongestCategory.mlScore}/100 ML quality score` : 'No category performance yet',
      icon: Layers3,
    },
    {
      label: 'Top product',
      value: topProduct ? topProduct.name : 'No ranking yet',
      meta: topProduct ? `${topProduct.performanceScore.toFixed(1)} performance score` : 'Awaiting product signal',
      icon: Target,
    },
    {
      label: 'Anomaly watchlist',
      value: anomalies.length.toString(),
      meta: anomalies.length > 0 ? 'Products need closer pricing or demand review' : 'No major demand gaps flagged',
      icon: AlertCircle,
    },
  ];

  const internalTabs: Array<{ id: AnalyticsTab; label: string; icon: React.ElementType; description: string }> = [
    { id: 'forecast', label: 'Forecast Lab', icon: Brain, description: 'Revenue prediction, confidence, and executive summaries.' },
    { id: 'catalog', label: 'Catalog Signals', icon: Activity, description: 'Category quality, winners, and product anomaly detection.' },
    { id: 'customers', label: 'Customer Mix', icon: Users, description: 'Segment distribution and retention-oriented insight cards.' },
  ];

  const activeTabMeta = internalTabs.find((tab) => tab.id === activeTab);

  useEffect(() => {
    setVisibleCategoryCount(3);
    setVisibleAnomalyCount(3);
    setVisibleTopProductCount(5);
  }, [activeTab, refreshKey, dashboard]);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[28px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Analytics intelligence</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              The overview tab gives the store-level snapshot. This analytics tab should feel like the same admin product, but focused on forecast quality, category signals, and customer mix from the backend analytics service.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="secondary-button">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh data
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {highlightCards.map((card) => (
          <article key={card.label} className="glass-panel flex h-full flex-col rounded-[28px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">
                <card.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
                Live
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-slate-50">{card.value}</p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{card.meta}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="glass-panel rounded-[28px] p-4">
        <div className="grid gap-2 lg:grid-cols-3">
          {internalTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[22px] px-4 py-4 text-left text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.7)] dark:bg-cyan-400 dark:text-slate-950'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="h-5 w-5" />
                <p>{tab.label}</p>
              </div>
              <p className={`mt-2 text-sm font-normal leading-6 ${activeTab === tab.id ? 'text-slate-200 dark:text-slate-950/80' : 'text-slate-500 dark:text-slate-400'}`}>
                {tab.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[28px] p-6">
        <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">{activeTabMeta?.label}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{activeTabMeta?.description}</p>
      </section>

      {loading && (
        <section className="glass-panel rounded-[32px] p-12 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-500" />
          <h3 className="mt-5 text-2xl font-bold text-slate-950 dark:text-slate-50">Loading analytics intelligence</h3>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Fetching fresh predictions, segments, and category signals from the backend.</p>
        </section>
      )}

      {!loading && error && (
        <section className="glass-panel rounded-[32px] p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Analytics could not load</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>

            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="secondary-button">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </button>
          </div>
        </section>
      )}

      {!loading && !error && dashboard && activeTab === 'forecast' && (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="grid content-start gap-6 self-start">
            <section className="glass-panel rounded-[28px] p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Actual vs predicted revenue trend</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                    The backend is projecting near-term revenue with explainable heuristics built from catalog depth, orders, and ratings.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <RevenueForecastChart data={revenueData} />
              </div>
            </section>

            <article className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Forecast takeaways</h3>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="h-5 w-5 text-emerald-300" />
                    <p className="font-semibold">Predicted next revenue</p>
                  </div>
                  <p className="mt-3 text-3xl font-bold">{latestRevenuePoint ? formatCurrency(latestRevenuePoint.predicted) : '$0'}</p>
                  <p className="mt-2 text-sm text-slate-300">Current model confidence sits at {latestRevenuePoint ? `${Math.round(latestRevenuePoint.confidence * 100)}%` : '0%'}.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-cyan-500" />
                    <p className="font-semibold text-slate-950 dark:text-slate-50">Statistical framing</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    The backend currently produces deterministic, explainable heuristics rather than a persisted trained model, which is a strong fit for an admin MVP because every score remains interpretable.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <section className="grid gap-6">
            <article className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Model summary cards</h3>
              <div className="mt-5 space-y-3">
                {dashboard.overview.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{item.label}</p>
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-300">
                        {item.change}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-slate-50">{item.value}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.mlInsight}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      )}

      {!loading && !error && dashboard && activeTab === 'catalog' && (
        <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="grid content-start gap-6 self-start">
            <section className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Category performance and quality</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Sales, growth, and ML quality signals are blended into a ranking view designed for fast merchandising decisions.
              </p>
              <div className="mt-5 space-y-3">
                {visibleCategories.map((item) => {
                  const salesWidth = latestRevenuePoint ? Math.max(12, (item.sales / latestRevenuePoint.predicted) * 100) : 12;
                  return (
                    <div key={item.category} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-slate-50">{item.category}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {formatCurrency(item.sales)} estimated sales with {item.growth}% synthetic growth.
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/35 dark:text-amber-300">
                          ML score {item.mlScore}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            <span>Sales weight</span>
                            <span>{formatCompactNumber(item.sales)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-slate-200/80 dark:bg-slate-800">
                            <div className="h-3 rounded-full bg-slate-950 dark:bg-cyan-400" style={{ width: `${Math.min(100, salesWidth)}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            <span>Quality score</span>
                            <span>{item.mlScore}/100</span>
                          </div>
                          <div className="h-3 rounded-full bg-slate-200/80 dark:bg-slate-800">
                            <div className="h-3 rounded-full bg-orange-500" style={{ width: `${Math.min(100, item.mlScore)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleCategoryCount < categoryPerformance.length && (
                <button type="button" onClick={() => setVisibleCategoryCount((count) => count + 3)} className="secondary-button mt-5">
                  Load 3 more
                </button>
              )}
            </section>

            <article className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Anomaly detection</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Products with the biggest gaps between current signal and predicted demand are surfaced here first.
              </p>
              <div className="mt-5 space-y-3">
                {anomalies.length === 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                    No major anomalies were flagged by the current rules-based detector.
                  </div>
                )}
                {visibleAnomalies.map((item) => {
                  const delta = item.predictedSales - item.currentSales;
                  return (
                    <div key={item.id} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-slate-50">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current {item.currentSales} | Predicted {item.predictedSales}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${delta >= 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-300'}`}>
                          {delta >= 0 ? '+' : ''}
                          {delta} gap
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleAnomalyCount < anomalies.length && (
                <button type="button" onClick={() => setVisibleAnomalyCount((count) => count + 3)} className="secondary-button mt-5">
                  Load 3 more
                </button>
              )}
            </article>
          </div>

          <section className="grid content-start gap-6 self-start">
            <article className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Top products</h3>
              <div className="mt-5 space-y-3">
                {visibleTopProducts.map((item, index) => (
                  <div key={item.id} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-slate-50">
                          {index + 1}. {item.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Current sales {item.currentSales} vs predicted {item.predictedSales}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${item.trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300'}`}>
                        {item.trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {item.trend}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Performance score {item.performanceScore.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
              {visibleTopProductCount < topProducts.length && (
                <button type="button" onClick={() => setVisibleTopProductCount((count) => count + 3)} className="secondary-button mt-5">
                  Load 3 more
                </button>
              )}
            </article>
          </section>
        </div>
      )}

      {!loading && !error && dashboard && activeTab === 'customers' && (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="grid gap-6">
            <section className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Customer segment distribution</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Lifecycle buckets make the retention story easier to act on, even before a full clustering model lands.
              </p>
              <div className="mt-6">
                <SegmentDonut segments={segmentDistribution} />
              </div>
            </section>

            <article className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Operational recommendations</h3>
              <div className="mt-5 space-y-3">
                {segmentDistribution.map((segment) => (
                  <div key={segment.segment} className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-slate-50">{segment.segment}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{segment.count} customers, {segment.percentage}% of current mix.</p>
                      </div>
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-300">
                        Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <section className="grid content-start gap-6 self-start">
            <article className="glass-panel rounded-[28px] p-6">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">Customer intelligence notes</h3>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">At-risk pressure</p>
                  <p className="mt-3 text-3xl font-bold">
                    {segmentDistribution.find((segment) => segment.segment === 'At Risk')?.percentage ?? 0}%
                  </p>
                  <p className="mt-2 text-sm text-slate-300">Keep a close eye on replenishment cadence and repeat-order triggers.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="font-semibold text-slate-950 dark:text-slate-50">High-value customer focus</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    The strongest-value segment is still relatively compact, which suggests premium merchandising and loyalty nudges can have outsized upside.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                  <p className="font-semibold text-slate-950 dark:text-slate-50">Backend model posture</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    Current segmenting is rule-based and transparent, which is helpful for admin trust. When historical order recency and repeat frequency get richer, this panel can evolve into a true retention model view.
                  </p>
                </div>
              </div>
            </article>
          </section>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
