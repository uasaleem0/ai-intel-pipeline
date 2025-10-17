import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronRight, ChevronDown, Database, Activity, 
  Clock, BarChart3, Github, Youtube, Rss, Home,
  Palette, Bot, Zap, Settings, Workflow, Target,
  Search, Lightbulb, Globe, HelpCircle, User
} from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'

const Sidebar = ({ isOpen, data, onPillarClick, onSettingsClick, onHomeClick, currentPage }) => {
  const [activeItem, setActiveItem] = useState('dashboard')
  const [openSections, setOpenSections] = useState({
    pillars: false,
    sources: false
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Main navigation following the "product spine" principle
  const mainNavItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', active: currentPage === 'dashboard' },
    { id: 'insights', icon: Lightbulb, label: 'Key Insights', badge: '4' },
    { id: 'pillars', icon: BarChart3, label: 'Explore Pillars', count: Object.keys(data?.pillars || {}).length },
    { id: 'sources', icon: Globe, label: 'Data Sources', count: Object.keys(data?.by_source || {}).length },
    { id: 'search', icon: Search, label: 'Search' }
  ]

  // Bottom section - low frequency items
  const bottomNavItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'help', icon: HelpCircle, label: 'Help Center' }
  ]

  const pillarIcons = {
    'AI UI/UX': Palette,
    'Agents': Bot,
    'Claude/OpenAI Best Practices': Zap,
    'DevOps/Infra for AI': Settings,
    'Automation': Workflow,
    'No-code Workflows': Target,
    'Hygienic Workflow': BarChart3
  }

  const handleNavClick = (item) => {
    setActiveItem(item.id)
    if (item.id === 'dashboard') {
      onHomeClick?.()
    } else if (item.id === 'pillars') {
      setOpenSections(prev => ({ ...prev, pillars: !prev.pillars }))
    } else if (item.id === 'sources') {
      setOpenSections(prev => ({ ...prev, sources: !prev.sources }))
    } else if (item.id === 'settings') {
      onSettingsClick?.()
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isOpen ? 280 : 0,
        opacity: isOpen ? 1 : 0
      }}
      transition={{ 
        duration: 0.3,
        ease: 'easeInOut'
      }}
      style={{
        position: 'fixed',
        left: 0,
        top: '64px',
        height: 'calc(100vh - 64px)',
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        zIndex: 40
      }}
      className={!isOpen ? "pointer-events-none" : ""}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header with Profile */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar>
              <AvatarFallback style={{ 
                background: 'var(--primary)', 
                color: 'var(--primary-foreground)',
                fontWeight: '600'
              }}>AI</AvatarFallback>
            </Avatar>
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--foreground)', 
                margin: 0 
              }}>Intelligence Hub</p>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--muted-foreground)', 
                margin: 0 
              }}>AI Data Pipeline</p>
            </div>
            <Button variant="ghost" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Navigation */}
        <div style={{ flex: 1, padding: '16px 0' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = item.active
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                      background: (isActive || (item.id === 'settings' && currentPage === 'settings')) ? 'var(--primary)' : 'transparent',
                      color: (isActive || (item.id === 'settings' && currentPage === 'settings')) ? 'var(--primary-foreground)' : 'var(--foreground)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    width: '100%',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'var(--accent)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '20px',
                      background: 'var(--primary-foreground)',
                      borderRadius: '0 2px 2px 0'
                    }} />
                  )}
                  
                  <Icon style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>
                    {item.label}
                  </span>
                  
                  {/* Badges and counts */}
                  {item.badge && (
                    <Badge style={{ 
                      background: 'var(--orange)', 
                      color: 'white', 
                      fontSize: '10px',
                      padding: '2px 6px'
                    }}>
                      {item.badge}
                    </Badge>
                  )}
                  {item.count > 0 && (
                    <span style={{
                      fontSize: '12px',
                      color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
                    }}>
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Collapsible Sections */}
          {(openSections.pillars || openSections.sources) && (
            <div style={{ marginTop: '16px', padding: '0 12px' }}>
              {openSections.pillars && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: 'var(--muted-foreground)', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 8px 16px'
                  }}>Pillars</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {Object.entries(data?.pillars || {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 6)
                      .map(([pillar, count]) => {
                        const Icon = pillarIcons[pillar] || BarChart3
                        return (
                          <button
                            key={pillar}
                            onClick={() => onPillarClick?.(pillar)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--foreground)',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              width: '100%',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--accent)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            <Icon style={{ width: '16px', height: '16px', color: 'var(--muted-foreground)' }} />
                            <span style={{ fontSize: '13px', flex: 1 }}>{pillar}</span>
                            <span style={{ 
                              fontSize: '11px', 
                              color: 'var(--muted-foreground)',
                              background: 'var(--muted)',
                              padding: '2px 6px',
                              borderRadius: '10px'
                            }}>
                              {count}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation - Low Frequency Items */}
        <div style={{ 
          padding: '16px 12px', 
          borderTop: '1px solid var(--border)',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--accent)'
                    e.target.style.color = 'var(--foreground)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                    e.target.style.color = 'var(--muted-foreground)'
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
          
          {/* System Status */}
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            background: 'var(--muted)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Activity style={{ width: '14px', height: '14px', color: 'var(--green)' }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)' }}>
                System Operational
              </span>
            </div>
            <p style={{ 
              fontSize: '11px', 
              color: 'var(--muted-foreground)', 
              margin: 0 
            }}>
              {data?.counts?.items || 0} items • Last run 2h ago
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar