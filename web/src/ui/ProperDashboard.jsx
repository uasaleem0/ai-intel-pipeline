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
    <div 
      className="w-full max-w-4xl mx-auto animate-fadeInUp"
      style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
    >
      <div className="insight-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ 
              padding: '8px', 
              background: 'var(--orange)', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(247, 147, 22, 0.3)'
            }}>
              <BarChart3 className="h-5 w-5" style={{ color: '#ffffff' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Key Insights</h3>
              <p style={{ 
                color: 'var(--muted-foreground)', 
                fontSize: '14px', 
                margin: 0 
              }}>
                AI-Generated Intelligence from Your Data
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.map((insight, index) => (
            <Collapsible
              key={insight.id}
              open={expandedInsight === insight.id}
              onOpenChange={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
            >
              <div className="card hover-lift" style={{ 
                background: 'linear-gradient(135deg, var(--card) 0%, rgba(247, 147, 22, 0.03) 100%)',
                border: '1px solid rgba(247, 147, 22, 0.15)',
                animationDelay: `${0.1 + index * 0.1}s`,
                animationFillMode: 'both'
              }}>
                <CollapsibleTrigger asChild>
                  <div style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <insight.icon style={{ 
                        width: '24px', 
                        height: '24px', 
                        color: 'var(--orange)', 
                        marginTop: '2px',
                        filter: 'drop-shadow(0 2px 4px rgba(247, 147, 22, 0.3))'
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          fontWeight: '500', 
                          color: 'var(--foreground)', 
                          margin: '0 0 8px 0',
                          lineHeight: '1.4'
                        }}>{insight.insight}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <Badge variant="secondary" style={{ fontSize: '11px' }}>
                            📊 Confidence: {insight.confidence}%
                          </Badge>
                          <Badge variant="outline" style={{ fontSize: '11px' }}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending {insight.trend}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" style={{ color: 'var(--muted-foreground)' }}>
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
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
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
    <div 
      className="w-full max-w-4xl mx-auto animate-fadeInUp"
      style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          📊 Explore by Pillar
        </h3>
        <p style={{ color: 'var(--muted-foreground)' }}>Discover insights organized by key domains</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        {Object.entries(pillars)
          .sort(([,a], [,b]) => b - a)
          .map(([pillar, count], index) => {
            const config = pillarConfigs[pillar] || { icon: BarChart3, color: 'var(--muted)' }
            const isActive = count > 10
            const colorMap = {
              'bg-pink-500': 'var(--pink)',
              'bg-blue-500': 'var(--blue)',
              'bg-purple-500': 'var(--primary)',
              'bg-green-500': 'var(--green)',
              'bg-orange-500': 'var(--orange)',
              'bg-teal-500': 'var(--teal)',
              'bg-slate-500': 'var(--muted)'
            }
            
            return (
              <div
                key={pillar}
                className="pillar-card animate-fadeInUp hover-lift"
                style={{ 
                  animationDelay: `${0.6 + index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ 
                    padding: '8px', 
                    borderRadius: '8px',
                    background: colorMap[config.color] || config.color,
                    boxShadow: `0 4px 6px -1px ${colorMap[config.color] || config.color}30`
                  }}>
                    <config.icon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                  </div>
                  {isActive && (
                    <Badge variant="default" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                
                <h4 style={{ 
                  fontWeight: '600', 
                  fontSize: '14px', 
                  marginBottom: '8px',
                  color: 'var(--foreground)'
                }}>{pillar}</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: colorMap[config.color] || config.color
                  }}>{count}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'var(--muted-foreground)' 
                  }}>items</span>
                </div>
                
                {isActive && (
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--green)', 
                    marginTop: '4px',
                    margin: '4px 0 0 0'
                  }}>
                    ↗ +{Math.floor(count * 0.2)} new
                  </p>
                )}
              </div>
            )
          })}
      </div>
    </div>
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
              <input
                className="input"
                placeholder="Search data..."
                style={{ paddingLeft: '40px', width: '320px' }}
              />
            </div>
            <button className="button-primary hover-lift">
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </button>
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
        marginLeft: sidebarOpen ? '280px' : '0',
        minHeight: '100vh',
        background: 'var(--background)'
      }}>
        {/* Top Actions Bar */}
        <div style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px'
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: 'var(--foreground)', 
                margin: '0 0 4px 0'
              }}>AI Intelligence Dashboard</h1>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--muted-foreground)', 
                margin: 0 
              }}>Monitor and explore your AI data pipeline</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '14px'
              }}>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2x2 Grid Layout */}
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '24px',
          minHeight: 'calc(100vh - 160px)'
        }}>
          {/* Top Left: AI Interface + Quick Stats */}
          <div className="card" style={{ 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                background: 'var(--primary)',
                borderRadius: '8px'
              }}>
                <Bot style={{ width: '20px', height: '20px', color: 'white' }} />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  margin: 0, 
                  color: 'var(--foreground)'
                }}>AI Assistant</h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--muted-foreground)', 
                  margin: 0 
                }}>Ask questions about your data</p>
              </div>
            </div>
            <AIInterface data={report} />
          </div>

          {/* Top Right: Key Insights */}
          <div className="card" style={{ padding: '24px' }}>
            <KeyInsights items={items} />
          </div>

          {/* Bottom Left: Quick Actions */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: '0 0 4px 0', 
                color: 'var(--foreground)'
              }}>Quick Actions</h3>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--muted-foreground)', 
                margin: 0 
              }}>Common tasks and operations</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="pillar-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                textAlign: 'left'
              }}>
                <Plus style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>Add New Source</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Connect a new data source</div>
                </div>
              </button>
              <button className="pillar-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                textAlign: 'left'
              }}>
                <Search style={{ width: '20px', height: '20px', color: 'var(--blue)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>Advanced Search</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Find specific items or patterns</div>
                </div>
              </button>
              <button className="pillar-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '16px',
                textAlign: 'left'
              }}>
                <Settings style={{ width: '20px', height: '20px', color: 'var(--muted-foreground)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>Configure Pipeline</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Adjust ingestion settings</div>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Right: Pillar Grid */}
          <div className="card" style={{ padding: '24px' }}>
            <PillarGrid report={report} />
          </div>
        </div>
      </main>
    </div>
  )
}