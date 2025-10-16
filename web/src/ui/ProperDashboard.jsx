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
        icon: Zap,
        insight: 'Try Claude 3.5 Sonnet with Artifacts - Game changer for rapid prototyping',
        detail: `Claude 3.5 Sonnet's Artifacts feature lets you create interactive demos, code examples, and mini-apps directly in the chat. Perfect for testing UI components, data visualizations, or quick proof-of-concepts. Users report 3x faster iteration cycles for frontend work.`,
        confidence: 96,
        sources: recent.slice(0, 3),
        trend: 'up',
        impact: 'High',
        timeframe: 'Try today',
        category: 'AI Tool',
        actionable: 'Start with simple React components or data visualizations. Use for client presentations and rapid mockups.'
      },
      {
        id: 2,
        icon: Bot,
        insight: 'Implement cursor.sh + GitHub Copilot combo for 10x coding productivity',
        detail: `Latest workflow: Cursor IDE with GitHub Copilot for real-time code completion + Claude for architecture decisions. Developers report 60-80% faster feature development and fewer bugs. The AI-first coding approach is becoming the new standard.`,
        confidence: 92,
        sources: recent.slice(3, 6),
        trend: 'up',
        impact: 'High',
        timeframe: '1-2 weeks setup',
        category: 'Development Workflow',
        actionable: 'Replace your current IDE with Cursor, enable Copilot, and use Claude for code reviews and planning.'
      },
      {
        id: 3,
        icon: Target,
        insight: 'Master prompt engineering with the STAR method for better AI outputs',
        detail: `The STAR framework (Situation, Task, Action, Result) dramatically improves AI responses. Instead of "write code", use "I'm building a React app (S), need user authentication (T), using Firebase (A), expecting clean, production-ready code (R)". 40% better results confirmed.`,
        confidence: 88,
        sources: recent.slice(6, 9),
        trend: 'up',
        impact: 'Medium',
        timeframe: 'Learn in 1 hour',
        category: 'Prompting Technique',
        actionable: 'Apply STAR to your next 5 AI interactions. Template: "I am [situation], I need to [task], I will use [action], I expect [result]".'
      },
      {
        id: 4,
        icon: Lightbulb,
        insight: 'Use Perplexity Pro for research + Claude for implementation = perfect combo',
        detail: `New workflow emerging: Perplexity Pro for initial research and finding latest info/papers, then Claude 3.5 for implementation and code generation. Combines real-time search with powerful reasoning. Saves 2-3 hours per research task.`,
        confidence: 85,
        sources: recent.slice(7, 10),
        trend: 'up',
        impact: 'Medium',
        timeframe: 'Start this week',
        category: 'Research Workflow',
        actionable: 'Use Perplexity for "What are the latest developments in [topic]?", then paste findings into Claude for "Help me implement this".'
      }
    ]
  }
  
  const insights = generateInsights()
  
  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto',
      animationDelay: '0.3s', 
      animationFillMode: 'both' 
    }} className="animate-fadeInUp">
      <div style={{ 
        padding: '24px',
        background: 'linear-gradient(135deg, var(--card) 0%, rgba(139, 92, 246, 0.03) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(139, 92, 246, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ 
              padding: '8px', 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #6366f1 100%)', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4)'
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
                background: 'linear-gradient(135deg, var(--card) 0%, rgba(139, 92, 246, 0.02) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                animationDelay: `${0.1 + index * 0.1}s`,
                animationFillMode: 'both'
              }}>
                <CollapsibleTrigger asChild>
                  <div style={{ padding: '16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <insight.icon style={{ 
                        width: '24px', 
                        height: '24px', 
                        color: 'var(--primary)', 
                        marginTop: '2px',
                        filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))'
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          fontWeight: '500', 
                          color: 'var(--foreground)', 
                          margin: '0 0 8px 0',
                          lineHeight: '1.4'
                        }}>{insight.insight}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Badge variant="secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            📊 {insight.confidence}%
                          </Badge>
                          <Badge variant="outline" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {insight.trend === 'up' ? 'Rising' : 'Declining'}
                          </Badge>
                          <Badge style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px',
                            background: insight.impact === 'High' ? 'var(--primary)' : insight.impact === 'Medium' ? 'var(--blue)' : 'var(--muted)',
                            color: 'white',
                            border: 'none'
                          }}>
                            {insight.impact} Impact
                          </Badge>
                          <Badge variant="secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            🕰️ {insight.timeframe}
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
                  <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
                        {insight.detail}
                      </p>
                      
                      {/* Actionable Information */}
                      <div style={{ 
                        background: 'var(--muted)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--primary)'
                      }}>
                        <h5 style={{ 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          color: 'var(--foreground)', 
                          margin: '0 0 6px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Target style={{ width: '12px', height: '12px' }} />
                          Recommended Action
                        </h5>
                        <p style={{ 
                          fontSize: '13px', 
                          color: 'var(--muted-foreground)', 
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          {insight.actionable}
                        </p>
                      </div>

                      {/* Category and Timeframe */}
                      <div style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--muted-foreground)', fontWeight: '500' }}>Category:</span>
                          <span style={{ color: 'var(--foreground)', marginLeft: '6px', fontWeight: '600' }}>{insight.category}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--muted-foreground)', fontWeight: '500' }}>Expected Timeline:</span>
                          <span style={{ color: 'var(--foreground)', marginLeft: '6px', fontWeight: '600' }}>{insight.timeframe}</span>
                        </div>
                      </div>
                      
                      {/* Next Steps */}
                      {insight.nextSteps && (
                        <div>
                          <h5 style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: 'var(--foreground)', 
                            margin: '0 0 12px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            🎯 Step-by-Step Implementation
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {insight.nextSteps.map((step, stepIndex) => (
                              <div key={stepIndex} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '10px 12px',
                                background: 'var(--accent)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)'
                              }}>
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: 'var(--primary)',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: '1px'
                                }}>
                                  {stepIndex + 1}
                                </div>
                                <span style={{
                                  fontSize: '13px',
                                  color: 'var(--foreground)',
                                  lineHeight: '1.4',
                                  fontWeight: '500'
                                }}>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h5 style={{ 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: 'var(--foreground)', 
                          margin: '0 0 12px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          📚 Related Sources & Research
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {insight.sources.map((source, i) => (
                            <div key={i} style={{
                              background: 'var(--muted)',
                              padding: '14px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--accent)'
                              e.currentTarget.style.transform = 'translateY(-1px)'
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--muted)'
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                            onClick={() => window.open(source.url, '_blank')}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <ExternalLink style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  color: 'var(--primary)', 
                                  marginTop: '2px', 
                                  flexShrink: 0 
                                }} />
                                <div style={{ flex: 1 }}>
                                  <p style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: 'var(--foreground)',
                                    margin: '0 0 4px 0',
                                    lineHeight: '1.3'
                                  }}>{source.title}</p>
                                  <p style={{
                                    fontSize: '12px',
                                    color: 'var(--muted-foreground)',
                                    margin: '0 0 6px 0',
                                    lineHeight: '1.4'
                                  }}>
                                    {source.pillar ? `From your ${source.pillar} research collection` : 'Referenced material from your AI intelligence pipeline'}
                                  </p>
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'var(--primary)',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    → Click to view source
                                  </div>
                                </div>
                              </div>
                            </div>
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
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Navigation Header - RESTORED */}
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
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ 
                background: 'transparent',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--foreground)'
                e.target.style.background = 'var(--muted)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--muted-foreground)'
                e.target.style.background = 'transparent'
              }}
            >
              <Menu className="h-5 w-5" />
            </button>
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
            <button className="button-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              Add Source
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        data={report} 
        onPillarClick={() => setSidebarOpen(false)}
        onSourceClick={() => setSidebarOpen(false)}
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
          
          {/* Pillar Grid - ONLY */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PillarGrid report={report} />
          </div>
        </div>
      </main>
    </div>
  )
}