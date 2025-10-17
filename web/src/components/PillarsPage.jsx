import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Search, Filter, ExternalLink, Calendar, Star, 
  TrendingUp, BarChart3, Palette, Bot, Zap, Settings, Target 
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

const PillarsPage = ({ pillarName, onBack }) => {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('overall') // overall, date, relevance
  const [loading, setLoading] = useState(true)

  const pillarIcons = {
    'AI UI/UX': Palette,
    'Agents': Bot,
    'Claude/OpenAI Best Practices': Zap,
    'DevOps/Infra for AI': Settings,
    'Automation': Target,
    'Hygienic Workflow': BarChart3
  }

  const pillarColors = {
    'AI UI/UX': '#ec4899',
    'Agents': '#3b82f6',
    'Claude/OpenAI Best Practices': '#8b5cf6',
    'DevOps/Infra for AI': '#10b981',
    'Automation': '#f59e0b',
    'Hygienic Workflow': '#6b7280'
  }

  useEffect(() => {
    fetchPillarItems()
  }, [pillarName])

  useEffect(() => {
    filterAndSortItems()
  }, [items, searchQuery, sortBy])

  const fetchPillarItems = async () => {
    setLoading(true)
    try {
      // Use static files for GitHub Pages compatibility
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${basePath}ui/items.json`)
      const data = await response.json()
      
      // Filter items that contain this pillar
      const allItems = data.items || data || []
      const pillarItems = allItems.filter(item => 
        item.pillars && item.pillars.includes(pillarName)
      )
      
      setItems(pillarItems)
    } catch (error) {
      console.error('Error fetching pillar items:', error)
      // Fallback to empty array
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortItems = () => {
    let filtered = items

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.tldr?.toLowerCase().includes(query) ||
        item.why?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date)
        case 'relevance':
          return (b.relevance || 0) - (a.relevance || 0)
        case 'overall':
        default:
          return (b.overall || 0) - (a.overall || 0)
      }
    })

    setFilteredItems(filtered)
  }

  const PillarIcon = pillarIcons[pillarName] || BarChart3
  const pillarColor = pillarColors[pillarName] || '#8b5cf6'

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid var(--muted)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading {pillarName} items...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="ghost" onClick={onBack} style={{ padding: '8px' }}>
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </Button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              background: pillarColor,
              borderRadius: '8px'
            }}>
              <PillarIcon style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{pillarName}</h1>
              <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
                {filteredItems.length} items found
              </p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: 'var(--muted-foreground)'
            }} />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'var(--input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--foreground)'
            }}
          >
            <option value="overall">Sort by Score</option>
            <option value="date">Sort by Date</option>
            <option value="relevance">Sort by Relevance</option>
          </select>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
              {searchQuery ? 'No items match your search.' : 'No items found for this pillar.'}
            </p>
          </Card>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card style={{ 
                  height: '100%',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="hover-lift"
                onClick={() => window.open(item.url, '_blank')}
                >
                  <CardHeader style={{ paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <CardTitle style={{ 
                        fontSize: '16px', 
                        lineHeight: '1.4', 
                        margin: 0,
                        flex: 1
                      }}>
                        {item.title}
                      </CardTitle>
                      <ExternalLink style={{ 
                        width: '16px', 
                        height: '16px', 
                        color: 'var(--muted-foreground)',
                        flexShrink: 0
                      }} />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <Badge style={{ 
                        background: pillarColor, 
                        color: 'white',
                        fontSize: '10px'
                      }}>
                        <Star style={{ width: '10px', height: '10px', marginRight: '4px' }} />
                        {(item.overall || 0).toFixed(2)}
                      </Badge>
                      
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--muted-foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Calendar style={{ width: '12px', height: '12px' }} />
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {item.tldr && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: 'var(--muted-foreground)', 
                        lineHeight: '1.5',
                        margin: '0 0 12px 0'
                      }}>
                        {item.tldr}
                      </p>
                    )}
                    
                    {item.why && (
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{ 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          color: 'var(--foreground)',
                          margin: '0 0 4px 0'
                        }}>
                          Why it matters:
                        </h4>
                        <p style={{ 
                          fontSize: '13px', 
                          color: 'var(--muted-foreground)', 
                          lineHeight: '1.4',
                          margin: 0
                        }}>
                          {item.why}
                        </p>
                      </div>
                    )}

                    {/* Pillars */}
                    {item.pillars && item.pillars.length > 1 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.pillars.filter(p => p !== pillarName).slice(0, 2).map((pillar, pi) => (
                          <Badge key={pi} variant="outline" style={{ fontSize: '10px' }}>
                            {pillar}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Scores */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      marginTop: '12px',
                      fontSize: '11px',
                      color: 'var(--muted-foreground)'
                    }}>
                      {item.relevance && <span>Rel: {item.relevance.toFixed(2)}</span>}
                      {item.actionability && <span>Act: {item.actionability.toFixed(2)}</span>}
                      {item.credibility && <span>Cred: {item.credibility.toFixed(2)}</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PillarsPage