"use client"
import React from 'react'
import { Head } from '@inertiajs/react'
import Editor from '@monaco-editor/react'
import { Play, ChartLine, Book } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, UTCTimestamp } from 'lightweight-charts'

export default function Home(): React.JSX.Element {

  const d4code = "GOOGL"
  const [chartData, setChartData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'chart' | 'results'>('chart')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/companies/data?query=${d4code}`)
        const raw = await res.json()

        const formatted = (raw.data?.results || []).map((bar: any) => ({
          time: Math.floor(bar.t / 1000) as UTCTimestamp,
          open:  bar.o,
          high:  bar.h,
          low:   bar.l,
          close: bar.c,
          volume: bar.v,
        }))

        setChartData(formatted)
      } catch (err) {
        console.error('Failed to fetch chart data', err)
      }
    }

    fetchData()
  }, [])

  const editorRef = useRef<any>(null)
  const [results, setResults] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const { pyodide, loading: pyodideLoading } = usePyodide()

  const handleRun = async () => {
    const code = editorRef.current?.getValue()
    if (!code || !pyodide) return

    setRunning(true)
    setResults(null)

    try {
      pyodide.globals.set('candles_json', JSON.stringify(chartData))

      const engine = `
import json

candles = json.loads(candles_json)

${code}

equity = 10000
position = 0
trades = []
equities = [equity]

for i in range(1, len(candles)):
    candle = candles[i]
    history = candles[:i]
    sig = signal(candle, history)

    if sig == 1 and position == 0:
        position = equity / candle['close']
        trades.append({ 'date': str(candle['time']), 'type': 'buy', 'price': candle['close'], 'equity': round(equity) })

    elif sig == -1 and position > 0:
        equity = position * candle['close']
        trades.append({ 'date': str(candle['time']), 'type': 'sell', 'price': candle['close'], 'equity': round(equity) })
        position = 0

    equities.append(round(position * candle['close']) if position > 0 else round(equity))

if position > 0:
    equity = position * candles[-1]['close']

initial = 10000
total_return = round((equity - initial) / initial * 100, 2)
sell_trades = [t for t in trades if t['type'] == 'sell']
wins = [t for i, t in enumerate(sell_trades) if i > 0 and t['price'] > sell_trades[i-1]['price']]
win_rate = round(len(wins) / len(sell_trades) * 100, 1) if sell_trades else 0

peak = initial
max_dd = 0
for e in equities:
    if e > peak: peak = e
    dd = (e - peak) / peak * 100
    if dd < max_dd: max_dd = dd

result = {
    'total_return': total_return,
    'total_trades': len(trades),
    'win_rate': win_rate,
    'max_drawdown': round(max_dd, 2),
    'final_equity': round(equity),
    'trades': trades
}

json.dumps(result)
`

      const output = await pyodide.runPythonAsync(engine)
      const result = JSON.parse(output)
      setResults(result)
      setActiveTab('results')

    } catch (err: any) {
      console.error(err)
      setResults({ error: err.message })
    } finally {
      setRunning(false)
    }
  }


	return (
    <>
      <Head title="SynHedge" />
          <div className="flex flex-col overflow-hidden h-screen w-screen bg-[#0a0a0a] text-white">

            <div className="py-4 px-4 flex border-b-1 border-neutral-700 items-center">
              <h1 className="font-mono tracking-wider text-xl flex items-center">SynHedge</h1>
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-md border-1 border-white text-white text-xs font-medium hover:bg-neutral-700 transition-colors">
                  GOOGL
                </span>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors" onClick={() => {handleRun()}}>
                  <Play className="w-3 h-3" />
                  Test
                </button>
              </div>
            </div>
            <div className="flex flex-1">
              <div className="overflow-hidden h-full w-1/2 border-r-2 border-neutral-800">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  defaultValue="
def signal(candle, history):
    # candle: { time, open, high, low, close, volume }
    # history: list of past candles
    return 0  # return 1 for buy, -1 for sell, 0 for hold"
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: 'Geist Mono, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    padding: { top: 16 },
                  }}
                  onMount={(editor) => { editorRef.current = editor }}
                />
              </div>
              <div className="border-neutral-800 overflow-hidden h-full w-1/2 flex flex-col">
                <div className="h-full w-full">
                  {activeTab === 'chart' ? (
                        chartData.length > 0 ? (
                          <CandlestickChart data={chartData} />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-xs font-mono text-neutral-200">
                              Loading...
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="p-6 text-xs text-neutral-300">
                          {results ? (
                            <>
                              <p>Total Return: {results.total_return}%</p>
                            </>
                          ) : (
                            <p>Run the strategy to see results here.</p>
                          )}
                        </div>
                      )}
                </div>
                <div className="px-4 pb-4">
                  <div className="flex flex-row bg-neutral-800 border border-neutral-800 rounded-lg p-1 gap-1">
                    <button className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === "chart" ? "bg-white text-black hover:bg-neutral-200" : "bg-transparent text-white hover:bg-neutral-700"}`}
                      onClick={() => setActiveTab("chart")}
                    >
                      <ChartLine className="w-3 h-3 mr-2" />
                      Chart
                    </button>
                    <button className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === "results" ? "bg-white text-black hover:bg-neutral-200" : "bg-transparent text-white hover:bg-neutral-700"}`}
                      onClick={() => setActiveTab("results")}
                    >
                      <Book className="w-3 h-3 mr-2" />
                      Results
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

    </>
	)
}




function CandlestickChart({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: '#171717' },
        horzLines: { color: '#171717' },
      },
      crosshair: {
        vertLine: { color: '#404040' },
        horzLine: { color: '#404040' },
      },
      rightPriceScale: { borderColor: '#171717' },
      timeScale: {
        borderColor: '#171717',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeries.setData(data)
    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [data])

  return <div ref={containerRef} className="w-full h-full" />
}

function usePyodide() {
  const [pyodide, setPyodide] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'
      script.onload = async () => {
        const py = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        })
        setPyodide(py)
        setLoading(false)
      }
      document.head.appendChild(script)
    }
    load()
  }, [])

  return { pyodide, loading }
}