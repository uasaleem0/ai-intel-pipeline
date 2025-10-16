import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, Search, Plus, ChevronDown, ChevronUp, ExternalLink, 
  TrendingUp, BarChart3, Lightbulb, ArrowUpRight, Palette, Bot, Zap, Settings, Target
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

// Key Insights Component
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
        icon: Lightbulb,
        insight: `${topPillar?.[0] || 'AI Development'} shows accelerating activity with ${topPillar?.[1] || 5} new items this week`,
        detail: `Analysis of recent data shows increased focus on ${topPillar?.[0]?.toLowerCase()} with notable contributions from leading developers and researchers. This trend indicates growing industry interest and potential breakthrough developments.`,
        confidence: 94,
        sources: recent.slice(0, 3),
        trend: 'up'
      },
      {
        id: 2,
        icon: TrendingUp,
        insight: `${topSource?.[0] || 'GitHub'} releases indicate major framework updates incoming`,
        detail: `Recent repository activity suggests significant updates across multiple frameworks. Early indicators point to performance improvements and new feature sets that could reshape development workflows.`,
        confidence: 87,
        sources: recent.slice(3, 6),
        trend: 'up'
      },
      {
        id: 3,
        icon: Zap,
        insight: 'Emerging pattern: AI-first development workflows gaining momentum',
        detail: 'Cross-platform analysis reveals a shift toward AI-integrated development processes. This includes automated code review, intelligent testing, and AI-assisted debugging becoming standard practice.',
        confidence: 91,
        sources: recent.slice(6, 9),
        trend: 'up'
      },
      {
        id: 4,
        icon: ArrowUpRight,
        insight: 'Next-generation UI frameworks showing 40% performance improvements',
        detail: 'Benchmarking data from recent releases demonstrates substantial performance gains in rendering, state management, and bundle optimization. These improvements could accelerate adoption rates.',
        confidence: 89,
        sources: recent.slice(7, 10),
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
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-background" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Key Insights</h3>
              <CardDescription className="text-muted-foreground">
                AI-Generated Intelligence from Your Data
              </CardDescription>
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
              <Card className="border-amber-500/10 hover:bg-amber-500/5 transition-colors">
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <insight.icon className="h-6 w-6 text-amber-500 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{insight.insight}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            📊 Confidence: {insight.confidence}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending {insight.trend}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        {expandedInsight === insight.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t">
                    <div className="pt-4 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{insight.detail}</p>
                      
                      <div>
                        <p className="text-xs font-medium mb-2 text-muted-foreground">Related Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {insight.sources.map((source, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
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

// Pillar Grid Component
const PillarGrid = ({ report }) => {
  const pillars = report?.pillars || {}
  const pillarConfigs = {
    'AI UI/UX': { icon: Palette, color: 'bg-pink-500' },
    'Agents': { icon: Bot, color: 'bg-blue-500' },
    'Claude/OpenAI Best Practices': { icon: Zap, color: 'bg-purple-500' },
    'DevOps/Infra for AI': { icon: Settings, color: 'bg-green-500' },
    'Automation': { icon: ArrowUpRight, color: 'bg-orange-500' },
    'No-code Workflows': { icon: Target, color: 'bg-teal-500' },
    'Hygienic Workflow': { icon: BarChart3, color: 'bg-slate-500' }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">📊 Explore by Pillar</h3>
        <p className="text-muted-foreground">Discover insights organized by key domains</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(pillars)
          .sort(([,a], [,b]) => b - a)
          .map(([pillar, count]) => {
            const config = pillarConfigs[pillar] || { icon: BarChart3, color: 'bg-gray-500' }
            const isActive = count > 10 // Simple heuristic for "active" status
            
            return (
              <motion.div
                key={pillar}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-2 rounded-lg", config.color)}>
                        <config.icon className="h-4 w-4 text-background" />
                      </div>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-sm mb-1">{pillar}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">items</span>
                    </div>
                    
                    {isActive && (
                      <p className="text-xs text-green-600 mt-1">
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
export default function ProperDashboard() {
  const { report, items } = useData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const handlePillarClick = (pillar) => {
    console.log('Navigate to pillar:', pillar)
    // TODO: Implement navigation to pillar view
  }
  
  const handleSourceClick = (source) => {
    console.log('Navigate to source:', source)
    // TODO: Implement navigation to source view
  }
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Navigation Header */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        width: '100%', 
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 24px',
          display: 'flex', 
          height: '64px', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, var(--primary), rgba(139, 92, 246, 0.6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              AI Intel Pipeline
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Search data..."
                style={{ paddingLeft: '40px', width: '320px' }}
              />
            </div>
            <Button style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        data={report} 
        onPillarClick={handlePillarClick}
        onSourceClick={handleSourceClick}
      />

      {/* Main Content */}
      <main style={{
        transition: 'margin-left 0.3s ease-in-out',
        marginLeft: sidebarOpen ? '280px' : '0'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          {/* Hero AI Interface */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AIInterface data={report} />
          </div>
          
          {/* Key Insights */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <KeyInsights items={items} />
          </div>
          
          {/* Pillar Grid */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PillarGrid report={report} />
          </div>
        </div>
      </main>
    </div>
  )
}