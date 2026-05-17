import React from 'react'
import { Head } from '@inertiajs/react'
import Editor from '@monaco-editor/react'
import { Play } from 'lucide-react';

export default function Home(): React.JSX.Element {
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
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors">
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
                  defaultValue="# write your algo here"
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
                />
              </div>
              <div className="border-neutral-800 overflow-hidden h-full w-1/2 flex flex-col">
                <div className="h-full w-full">
                </div>
                <div className="px-4 pb-4">
                  <div className="flex flex-row bg-neutral-800 border border-neutral-800 rounded-lg p-1 gap-1">
                    <button className="flex-1 py-1.5 text-xs font-mono rounded-md bg-white text-black transition-colors">
                      Chart
                    </button>
                    <button className="flex-1 py-1.5 text-xs font-mono rounded-md text-neutral-500 hover:text-neutral-300 transition-colors">
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
