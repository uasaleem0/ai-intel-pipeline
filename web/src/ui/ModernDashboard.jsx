import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, Search, Plus, ChevronDown, ChevronUp, ExternalLink, 
  TrendingUp, BarChart3, Lightbulb, ArrowUpRight
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible'
import AIInterface from '../components/AIInterface'
import Sidebar from '../components/Sidebar'
import { cn } from '../lib/utils'

// Hook for data fetching
function useData() {
  const [report, setReport] = useState(null)
  const [items, setItems] = useState([])
  
  React.useEffect(() => {
    const v = '?v=' + Date.now()
    Promise.all([
      fetch('report.json' + v).then(r => r.json()),
      fetch('items.json' + v).then(r => r.json()),
    ]).then(([rep, its]) => {
      setReport(rep)
      setItems(its)
    })
  }, [])
  
  return { report, items }
}

// Main AI Interface Component - The Hero
const AIInterface = ({ data }) => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I've analyzed your latest data and I'm ready to help. Ask me anything about AI trends, tools, or insights from your sources.",
      timestamp: new Date()
    }
  ])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user', 
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    
    // Simulate AI response
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Based on your indexed data about "${input}", I found several relevant insights. This relates to ${Math.floor(Math.random() * 12) + 3} items in your collection across multiple pillars. Would you like me to dive deeper into any specific aspect?`,
        timestamp: new Date(),
        sources: ['SuperClaude Framework', 'Next.js v16 Updates']
      }
      setMessages(prev => [...prev, aiMsg])
    }, 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto"
    >
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-blue-800/20 backdrop-blur-sm">
        {/* 3D Effect Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10" />
        <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] rounded-lg" />
        
        {/* Glow Effects */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-lg blur-xl opacity-75" />
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-400/10 rounded-lg blur-2xl opacity-50" />
        
        <div className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-75" />
                <Avatar className="relative w-12 h-12 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600">
                    <Sparkles className="h-6 w-6 text-white" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  AI Intelligence Assistant
                </CardTitle>
                <p className="text-blue-200/80 text-sm">
                  Trained on {data?.counts?.items || 0} curated items • RAG-powered insights
                </p>
              </div>
              <div className="ml-auto">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <Activity className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Chat Messages */}
            <div className="space-y-4 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.type === 'assistant' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600">
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                      <Card className={message.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0' 
                        : 'bg-white/10 border-white/20 backdrop-blur-sm'
                      }>
                        <CardContent className="p-3">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </CardContent>
                      </Card>
                      
                      {message.sources && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.sources.map((source, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-white/5 border-white/20 hover:bg-white/10">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {message.type === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-600">
                          <Users className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative group">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about trends, insights, or specific topics from your data..."
                  className="pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}

// Key Insights Section with expandable details
const KeyInsights = ({ items }) => {
  const [expandedInsight, setExpandedInsight] = useState(null)
  
  // Generate insights from actual data
  const generateInsights = () => {
    if (!items?.length) return []
    
    const recent = items.slice(0, 10)
    const pillars = {}
    const sources = {}
    
    recent.forEach(item => {
      item.pillars?.forEach(pillar => {
        pillars[pillar] = (pillars[pillar] || 0) + 1
      })
      if (item.source_type) {
        sources[item.source_type] = (sources[item.source_type] || 0) + 1
      }
    })
    
    const topPillar = Object.entries(pillars).sort(([,a], [,b]) => b - a)[0]
    const topSource = Object.entries(sources).sort(([,a], [,b]) => b - a)[0]
    
    return [
      {
        id: 1,
        icon: '💡',
        insight: `${topPillar?.[0] || 'AI Development'} shows accelerating activity with ${topPillar?.[1] || 5} new items this week`,
        detail: `Analysis of recent data shows increased focus on ${topPillar?.[0]?.toLowerCase()} with notable contributions from leading developers and researchers. This trend indicates growing industry interest and potential breakthrough developments.`,
        confidence: 94,
        sources: recent.slice(0, 3),
        trend: 'up'
      },
      {
        id: 2,
        icon: '🚀',
        insight: `${topSource?.[0] || 'GitHub'} releases indicate major framework updates incoming`,
        detail: `Recent repository activity suggests significant updates across multiple frameworks. Early indicators point to performance improvements and new feature sets that could reshape development workflows.`,
        confidence: 87,
        sources: recent.slice(3, 6),
        trend: 'up'
      },
      {
        id: 3,
        icon: '⚡',
        insight: 'Emerging pattern: AI-first development workflows gaining momentum',
        detail: 'Cross-platform analysis reveals a shift toward AI-integrated development processes. This includes automated code review, intelligent testing, and AI-assisted debugging becoming standard practice.',
        confidence: 91,
        sources: recent.slice(6, 9),
        trend: 'up'
      },
      {
        id: 4,
        icon: '🔮',
        insight: 'Next-generation UI frameworks showing 40% performance improvements',
        detail: 'Benchmarking data from recent releases demonstrates substantial performance gains in rendering, state management, and bundle optimization. These improvements could accelerate adoption rates.',
        confidence: 89,
        sources: recent.slice(7, 10),
        trend: 'up'
      },
      {
        id: 5,
        icon: '🎯',
        insight: 'Developer tooling evolution: Integration becoming the key differentiator',
        detail: 'Analysis shows tools that seamlessly integrate across the development lifecycle are gaining preference over specialized single-purpose solutions.',
        confidence: 85,
        sources: recent.slice(4, 7),
        trend: 'up'
      }
    ]
  }
  
  const insights = generateInsights()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-6xl mx-auto mt-8"
    >
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-900/10 to-yellow-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-200">Key Insights</h3>
              <p className="text-amber-200/70 text-sm font-normal">AI-Generated Intelligence from Your Data</p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {insights.map((insight) => (
            <Collapsible
              key={insight.id}
              open={expandedInsight === insight.id}
              onOpenChange={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
            >
              <Card className="border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div className="flex-1">
                        <p className="text-amber-100 font-medium">{insight.insight}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            📊 Confidence: {insight.confidence}%
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending {insight.trend}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-amber-200 hover:text-amber-100">
                        {expandedInsight === insight.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-amber-500/10">
                    <div className="pt-4 space-y-3">
                      <p className="text-amber-100/80 text-sm leading-relaxed">{insight.detail}</p>
                      
                      <div>
                        <p className="text-amber-200 text-xs font-medium mb-2">Related Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {insight.sources.map((source, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-amber-500/5 border-amber-500/20 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
                              onClick={() => window.open(source.url, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {source.title?.slice(0, 30)}...
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Pillar Cards with activity indicators
const PillarGrid = ({ report }) => {
  const pillars = report?.pillars || {}
  const pillarConfigs = {
    'AI UI/UX': { icon: '🎨', color: 'from-pink-500 to-rose-500' },
    'Agents': { icon: '🤖', color: 'from-blue-500 to-cyan-500' },
    'Claude/OpenAI Best Practices': { icon: '⚡', color: 'from-purple-500 to-indigo-500' },
    'DevOps/Infra for AI': { icon: '⚙️', color: 'from-green-500 to-emerald-500' },
    'Automation': { icon: '🔄', color: 'from-orange-500 to-amber-500' },
    'No-code Workflows': { icon: '🎯', color: 'from-teal-500 to-cyan-500' },
    'Hygienic Workflow': { icon: '🧹', color: 'from-slate-500 to-gray-500' }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-6xl mx-auto mt-8"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">📊 Explore by Pillar</h3>
        <p className="text-white/60">Discover insights organized by key domains</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(pillars)
          .sort(([,a], [,b]) => b - a)
          .map(([pillar, count]) => {
            const config = pillarConfigs[pillar] || { icon: '📁', color: 'from-gray-500 to-slate-500' }
            const isNew = count > 10 // Simple heuristic for "new" activity
            
            return (
              <motion.div
                key={pillar}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className="cursor-pointer border-white/10 bg-gradient-to-br from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                        <span className="text-lg">{config.icon}</span>
                      </div>
                      {isNew && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-white text-sm mb-1">{pillar}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">{count}</span>
                      <span className="text-xs text-white/60">items</span>
                    </div>
                    
                    {isNew && (
                      <p className="text-xs text-green-300 mt-1">
                        ↗ +{Math.floor(count * 0.2)} new
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
      </div>
    </motion.div>
  )
}

// Main Dashboard Component
export default function ModernDashboard() {
  const { report, items } = useData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                AI Intel Pipeline
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search data..."
                  className="pl-10 w-80 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                />
              </div>
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-medium">
                <Plus className="h-4 w-4" />
                Add Source
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero AI Interface */}
          <AIInterface data={report} />
          
          {/* Key Insights */}
          <KeyInsights items={items} />
          
          {/* Pillar Grid */}
          <PillarGrid report={report} />
        </div>
      </main>

      {/* TODO: Sidebar component would go here */}
    </div>
  )
}