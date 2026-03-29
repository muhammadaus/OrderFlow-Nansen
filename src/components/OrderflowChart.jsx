import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';
import { useEnhancedStreamingData } from '../services/dataSourceContext';
import { useStreamingConfig } from '../hooks/useStreamingConfig';
import { detectMarketSignals } from '../utils/marketAnalysis';
import StreamingIndicator from './StreamingIndicator';
import LoadingPlaceholder from './LoadingPlaceholder';

// Custom Candlestick shape for Recharts
const CandlestickBar = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#00d9ff' : '#ff4976';

  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);

  // Scale calculations
  const priceRange = high - low || 1;
  const yScale = height / priceRange;

  const wickX = x + width / 2;
  const wickTop = y;
  const wickBottom = y + height;
  const bodyY = y + (high - bodyBottom) * yScale;
  const bodyH = Math.max(bodyHeight * yScale, 1);

  return (
    <g>
      {/* Wick */}
      <line
        x1={wickX}
        y1={wickTop}
        x2={wickX}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.15}
        y={bodyY}
        width={width * 0.7}
        height={bodyH}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const OrderflowChart = () => {
  const { interval, isPaused } = useStreamingConfig('orderflow');

  const {
    data: orderflowData,
    loading,
    error,
    lastUpdate,
    latency,
    isStale,
    updateCount
  } = useEnhancedStreamingData('orderflow', interval, {
    enabled: !isPaused
  });

  const signalsData = useMemo(() =>
    orderflowData ? detectMarketSignals(orderflowData) : null
  , [orderflowData]);

  const signals = signalsData?.signals || [];
  const marketTip = signalsData?.tip || '';

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!orderflowData?.candles?.length) return [];

    return orderflowData.candles.map((candle, idx) => {
      const deltaValue = orderflowData.delta?.[idx]?.value || 0;
      const volumeValue = orderflowData.volume?.[idx]?.value || 0;
      const isUp = candle.close >= candle.open;

      return {
        time: new Date(candle.time * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        // For bar chart - show price range
        priceRange: [candle.low, candle.high],
        delta: deltaValue,
        volume: volumeValue,
        isUp,
        // Signal markers
        signal: signals.find(s => s.time === candle.time) || null,
      };
    }).slice(-50); // Last 50 candles
  }, [orderflowData, signals]);

  // Calculate price domain
  const priceDomain = useMemo(() => {
    if (!chartData.length) return [0, 100];
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.05;
    return [min - padding, max + padding];
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 p-3 rounded border border-gray-600 text-xs shadow-lg">
          <p className="text-white font-semibold mb-1">{data.time}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p className="text-gray-400">Open:</p>
            <p className="text-white text-right">${data.open?.toFixed(2)}</p>
            <p className="text-gray-400">High:</p>
            <p className="text-green-400 text-right">${data.high?.toFixed(2)}</p>
            <p className="text-gray-400">Low:</p>
            <p className="text-red-400 text-right">${data.low?.toFixed(2)}</p>
            <p className="text-gray-400">Close:</p>
            <p className={`text-right ${data.isUp ? 'text-cyan-400' : 'text-pink-400'}`}>
              ${data.close?.toFixed(2)}
            </p>
            <p className="text-gray-400">Delta:</p>
            <p className={`text-right ${data.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.delta > 0 ? '+' : ''}{data.delta?.toLocaleString()}
            </p>
          </div>
          {data.signal && (
            <div className={`mt-2 pt-2 border-t border-gray-600 ${
              data.signal.type === 'exhaustion' ? 'text-yellow-400' : 'text-purple-400'
            }`}>
              {data.signal.type === 'exhaustion' ? 'EXHAUSTION' : 'ABSORPTION'}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading && !orderflowData) {
    return <LoadingPlaceholder height={500} title="Candlestick Chart" />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Candlestick + Delta</h2>
          <div className="flex gap-4 mt-1 text-xs">
            <span className="text-[#00d9ff]">● Bullish</span>
            <span className="text-[#ff4976]">● Bearish</span>
            <span className="text-[#fbbf24]">― Delta</span>
          </div>
        </div>
        <StreamingIndicator
          lastUpdate={lastUpdate}
          latency={latency}
          isStale={isStale}
          loading={loading}
          error={error}
          updateCount={updateCount}
        />
      </div>

      {/* Chart */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <XAxis
              dataKey="time"
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              domain={priceDomain}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <YAxis
              yAxisId="delta"
              orientation="left"
              stroke="#fbbf24"
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Candlestick Bars */}
            <Bar
              yAxisId="price"
              dataKey="priceRange"
              barSize={8}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isUp ? '#00d9ff' : '#ff4976'}
                  stroke={entry.isUp ? '#00d9ff' : '#ff4976'}
                />
              ))}
            </Bar>

            {/* Delta Line */}
            <Line
              yAxisId="delta"
              type="monotone"
              dataKey="delta"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
            />

            {/* Signal markers as reference lines */}
            {signals.slice(-5).map((signal, i) => {
              const dataPoint = chartData.find(d => d.timestamp === signal.time);
              if (!dataPoint) return null;
              return (
                <ReferenceLine
                  key={`signal-${i}`}
                  yAxisId="price"
                  x={dataPoint.time}
                  stroke={signal.type === 'exhaustion' ? '#fbbf24' : '#a855f7'}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Signals Panel */}
      <div className="mb-4 min-h-[60px]">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Detected Signals
        </h3>
        {signals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {signals.slice(-5).map((signal, idx) => (
              <div
                key={idx}
                className={`text-xs px-2 py-1 rounded ${
                  signal.type === 'exhaustion'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {signal.type === 'exhaustion' ? 'EXH' : 'ABS'} @ ${signal.price?.toFixed(2) || '—'}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No signals detected</p>
        )}
      </div>

      {/* Tip */}
      {marketTip && (
        <div className="px-3 py-2 bg-blue-500/10 border-l-2 border-blue-500 rounded-r">
          <p className="text-xs text-gray-300">{marketTip}</p>
        </div>
      )}
    </div>
  );
};

export default OrderflowChart;
