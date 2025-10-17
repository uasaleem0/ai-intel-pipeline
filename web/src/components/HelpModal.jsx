import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Book, MessageCircle, Github, Mail, ExternalLink, Lightbulb, Settings, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

const HelpModal = ({ isOpen, onClose }) => {
  const helpSections = [
    {
      title: 'Getting Started',
      icon: Lightbulb,
      items: [
        'Add your first data source using the "Add Source" button',
        'Explore insights generated from your data',
        'Navigate between pillars to see categorized content',
        'Use the AI interface to ask questions about your data'
      ]
    },
    {
      title: 'Data Sources',
      icon: Book,
      items: [
        'YouTube URLs - Automatically extract transcripts and key insights',
        'GitHub Repositories - Analyze code, documentation, and issues',
        'RSS Feeds - Monitor blogs and news sources',
        'Direct URLs - Process web articles and documentation'
      ]
    },
    {
      title: 'Features',
      icon: Settings,
      items: [
        'AI-powered insights and recommendations',
        'Pillar-based knowledge organization',
        'Vector search across all content',
        'Real-time data ingestion',
        'Export and sharing capabilities'
      ]
    },
    {
      title: 'Navigation',
      icon: Search,
      items: [
        'Dashboard - Overview of all insights and pillars',
        'Pillars - Explore content by knowledge domains',
        'Settings - System health and configuration',
        'Search - Find specific content across all sources'
      ]
    }
  ]

  const quickActions = [
    { icon: Github, label: 'View on GitHub', url: 'https://github.com/uasaleem0/ai-intel-pipeline' },
    { icon: Book, label: 'Documentation', url: '#' },
    { icon: MessageCircle, label: 'Report Issue', url: 'https://github.com/uasaleem0/ai-intel-pipeline/issues' },
    { icon: Mail, label: 'Contact Support', url: 'mailto:support@example.com' }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              maxWidth: '800px',
              maxHeight: '80vh',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 101,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  Help Center
                </h2>
                <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
                  Get help and learn how to use AI Intel Pipeline
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X style={{ width: '20px', height: '20px' }} />
              </Button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
              {/* Help Sections */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  How to Use
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {helpSections.map((section, index) => {
                    const Icon = section.icon
                    return (
                      <Card key={index}>
                        <CardHeader style={{ paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              padding: '8px',
                              background: 'var(--primary)',
                              borderRadius: '6px'
                            }}>
                              <Icon style={{ width: '16px', height: '16px', color: 'white' }} />
                            </div>
                            <CardTitle style={{ fontSize: '16px', margin: 0 }}>
                              {section.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {section.items.map((item, i) => (
                              <li key={i} style={{
                                fontSize: '14px',
                                color: 'var(--muted-foreground)',
                                marginBottom: '8px',
                                lineHeight: '1.4'
                              }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={index}
                        onClick={() => action.url !== '#' && window.open(action.url, '_blank')}
                        disabled={action.url === '#'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          background: 'var(--muted)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          cursor: action.url === '#' ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: action.url === '#' ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (action.url !== '#') {
                            e.currentTarget.style.background = 'var(--accent)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--muted)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>
                          {action.label}
                        </span>
                        {action.url !== '#' && (
                          <ExternalLink style={{ width: '12px', height: '12px', color: 'var(--muted-foreground)', marginLeft: 'auto' }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Version Info */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'var(--muted)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                  AI Intel Pipeline v1.0.0 • Built with React & FastAPI
                </p>
                <Badge variant="outline" style={{ marginTop: '8px', fontSize: '10px' }}>
                  Demo Mode
                </Badge>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default HelpModal