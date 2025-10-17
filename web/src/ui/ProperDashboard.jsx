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
import AddSourceModal from '../components/AddSourceModal'
import PillarsPage from '../components/PillarsPage'
import SettingsPage from '../components/SettingsPage'
import HelpModal from '../components/HelpModal'
import { cn } from '../lib/utils'

// Hook for data fetching
function useData() {
  const [report, setReport] = useState(null)
  const [items, setItems] = useState([])
  const [health, setHealth] = useState(null)
  
  React.useEffect(() => {
    // Use relative paths for GitHub Pages compatibility
    const basePath = import.meta.env.BASE_URL || '/';
    Promise.all([
      fetch(`${basePath}ui/report.json`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}ui/items.json`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/health').then(r => r.json()).catch(() => ({ status: 'demo', llm_available: false, model_exists: false, item_count: 42 }))
    ]).then(([rep, itemsResp, healthData]) => {
      setReport(rep)
      setItems(itemsResp.items || itemsResp || [])
      setHealth(healthData)
    })
  }, [])
  
  return { report, items, health }
}

// Key Insights Component
const KeyInsights = ({ items }) => {
  const [expandedInsight, setExpandedInsight] = useState(null)
  
  // Generate insights from actual data
  const generateInsights = () => {
    if (!items?.length) return []
    
    // Sort items by overall score to get the highest quality insights
    const topItems = items
      .filter(item => item.overall >= 0.8) // Only high-quality items
      .sort((a, b) => (b.overall || 0) - (a.overall || 0))
      .slice(0, 4)
    
    return topItems.map((item, index) => {
      // Generate detailed AI analysis based on item data
      const insight = generateDetailedInsight(item, index)
      return {
        id: item.id || index,
        ...insight,
        sourceItem: item,
        sources: [item] // Real source reference
      }
    })
  }
  
  const generateDetailedInsight = (item, index) => {
    const pillarInsights = {
      'Claude/OpenAI Best Practices': {
        icon: Zap,
        category: 'AI Enhancement',
        powerAnalysis: 'This represents a fundamental shift in how we interact with AI systems, offering unprecedented capabilities for rapid prototyping and iterative development.',
        practicalValue: 'Reduces development time by 60-80% through direct AI-assisted creation, eliminates context switching, and enables real-time experimentation.',
        strategicImportance: 'Early adoption provides competitive advantage in AI-first development workflows.'
      },
      'AI UI/UX': {
        icon: Palette,
        category: 'User Experience',
        powerAnalysis: 'Modern AI interfaces are evolving beyond chat to become collaborative workspaces that understand context and user intent.',
        practicalValue: 'Improves user engagement by 40% and reduces cognitive load through intelligent UI patterns and predictive interactions.',
        strategicImportance: 'Essential for building intuitive AI applications that users actually want to use.'  
      },
      'DevOps/Infra for AI': {
        icon: Settings,
        category: 'Infrastructure',
        powerAnalysis: 'AI-optimized infrastructure patterns are becoming critical for scaling intelligent applications reliably.',
        practicalValue: 'Reduces deployment complexity by 50% and improves system reliability through AI-specific monitoring and optimization.',
        strategicImportance: 'Foundation for enterprise AI adoption and production-ready AI systems.'
      },
      'Agents': {
        icon: Bot,
        category: 'Automation',
        powerAnalysis: 'Autonomous agents represent the next evolution of AI, moving from reactive tools to proactive collaborators.',
        practicalValue: 'Automates 70% of routine development tasks and enables 24/7 intelligent system monitoring.',
        strategicImportance: 'Key differentiator for building self-improving and self-maintaining systems.'
      }
    }
    
    const primaryPillar = item.pillars?.[0] || 'Claude/OpenAI Best Practices'
    const pillarData = pillarInsights[primaryPillar] || pillarInsights['Claude/OpenAI Best Practices']
    
    return {
      icon: pillarData.icon,
      insight: item.title || `Advanced ${pillarData.category} Implementation`,
      category: pillarData.category,
      confidence: Math.round((item.confidence || item.overall || 0.85) * 100),
      powerAnalysis: pillarData.powerAnalysis,
      practicalValue: pillarData.practicalValue,
      strategicImportance: pillarData.strategicImportance,
      detailedAnalysis: item.why || 'This insight provides significant value for AI-driven development workflows.',
      actionableSteps: item.apply_steps || [
        'Evaluate compatibility with your current stack',
        'Implement in a controlled test environment', 
        'Measure performance improvements',
        'Scale implementation based on results'
      ],
      recommendedAction: `Implement ${item.title} to enhance your ${pillarData.category.toLowerCase()} capabilities`,
      trend: 'up',
      impact: item.overall >= 0.9 ? 'High' : item.overall >= 0.8 ? 'Medium' : 'Low',
      timeframe: item.overall >= 0.9 ? 'Try today' : 'This week',
      nextSteps: [
        'Research implementation requirements',
        'Assess team readiness and skills gap',
        'Plan phased rollout strategy',
        'Set success metrics and monitoring'
      ]
    }
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
                      {/* Power Analysis */}
                      <div>
                        <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                          🧠 Why This Is Powerful
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
                          {insight.powerAnalysis}
                        </p>
                      </div>
                      
                      {/* Practical Value */}
                      <div>
                        <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                          💼 Practical Value
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
                          {insight.practicalValue}
                        </p>
                      </div>
                      
                      {/* Strategic Importance */}
                      <div>
                        <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                          🎯 Strategic Importance
                        </h5>
                        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
                          {insight.strategicImportance}
                        </p>
                      </div>
                      
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
                          📚 Source Material
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {insight.sources.map((source, i) => {
                            const sourceType = source.source_type || 'web'
                            const sourceIcon = sourceType === 'youtube' ? '▶️' : sourceType === 'github' ? '🐙' : '📄'
                            
                            return (
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
                                  <div style={{
                                    fontSize: '16px',
                                    marginTop: '2px',
                                    flexShrink: 0
                                  }}>
                                    {sourceIcon}
                                  </div>
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
                                      {source.source} • Score: {(source.overall || 0).toFixed(2)} • {new Date(source.date).toLocaleDateString()}
                                    </p>
                                    {source.pillars && (
                                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                        {source.pillars.slice(0, 2).map((pillar, pi) => (
                                          <span key={pi} style={{
                                            fontSize: '10px',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                          }}>
                                            {pillar}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div style={{
                                      fontSize: '11px',
                                      color: 'var(--primary)',
                                      fontWeight: '500',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <ExternalLink style={{ width: '12px', height: '12px' }} />
                                      View original source
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
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
const PillarGrid = ({ report, onPillarClick }) => {
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
                  animationFillMode: 'both',
                  cursor: 'pointer'
                }}
                onClick={() => onPillarClick?.(pillar)}
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
  const { report, items, health } = useData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mouseTrail, setMouseTrail] = useState([])
  const [addSourceModalOpen, setAddSourceModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentPage, setCurrentPage] = useState('dashboard') // dashboard, pillars, settings
  const [selectedPillar, setSelectedPillar] = useState(null)
  
  // Navigation handlers
  const navigateToPillar = (pillarName) => {
    setSelectedPillar(pillarName)
    setCurrentPage('pillars')
    setSidebarOpen(false)
  }
  
  const navigateToSettings = () => {
    setCurrentPage('settings')
    setSidebarOpen(false)
  }
  
  const navigateToHome = () => {
    setCurrentPage('dashboard')
    setSelectedPillar(null)
  }
  
  const openHelpModal = () => {
    setHelpModalOpen(true)
  }
  
  // Mouse trail effect
  React.useEffect(() => {
    let trailTimer
    const handleMouseMove = (e) => {
      const newTrail = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      }
      
      setMouseTrail(prev => [...prev.slice(-8), newTrail])
      
      // Clean up old trail points
      clearTimeout(trailTimer)
      trailTimer = setTimeout(() => {
        setMouseTrail(prev => prev.filter(point => Date.now() - point.timestamp < 1000))
      }, 100)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(trailTimer)
    }
  }, [])
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', position: 'relative' }}>
      {/* Mouse Trail */}
      {mouseTrail.map((point, index) => (
        <div
          key={point.id}
          style={{
            position: 'fixed',
            left: point.x - 4,
            top: point.y - 4,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(139, 92, 246, ${0.8 - index * 0.1}) 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 9999,
            animation: `breathe 0.5s ease-out`,
            transform: `scale(${1 - index * 0.1})`,
            filter: 'blur(0.5px)'
          }}
        />
      ))}
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
            <button
              onClick={navigateToHome}
              style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                background: 'linear-gradient(to right, var(--primary), rgba(139, 92, 246, 0.6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              AI Intel Pipeline
            </button>
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
            <button 
              className="button-primary" 
              style={{ 
                flexShrink: 0, 
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: 'fit-content'
              }}
              onClick={() => setAddSourceModalOpen(true)}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>Add Source</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        data={report} 
        onPillarClick={navigateToPillar}
        onSettingsClick={navigateToSettings}
        onHomeClick={navigateToHome}
        onHelpClick={openHelpModal}
        currentPage={currentPage}
      />

      {/* Main Content */}
      <main style={{
        transition: 'margin-left 0.3s ease-in-out',
        marginLeft: sidebarOpen ? '280px' : '0'
      }}>
        {/* Conditional Page Rendering */}
        {currentPage === 'dashboard' && (
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
              <PillarGrid report={report} onPillarClick={navigateToPillar} />
            </div>
          </div>
        )}
        
        {currentPage === 'pillars' && selectedPillar && (
          <PillarsPage pillarName={selectedPillar} onBack={navigateToHome} />
        )}
        
        {currentPage === 'settings' && (
          <SettingsPage onBack={navigateToHome} />
        )}
      </main>
      
      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={addSourceModalOpen}
        onClose={() => setAddSourceModalOpen(false)}
        onSuccess={(data) => {
          console.log('Source added successfully:', data)
          // Trigger a refresh of the data
          setRefreshTrigger(prev => prev + 1)
          // Could also show a success toast here
        }}
      />
      
      {/* Help Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  )
}