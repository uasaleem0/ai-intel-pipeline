import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Search, ExternalLink, Calendar, Star, 
  BarChart3, Github, Youtube, Globe, Filter
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

const DataSourcesPage = ({ onBack }) => {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  const [sortBy, setSortBy] = useState('overall')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllItems()
  }, [])

  useEffect(() => {
    filterAndSortItems()
  }, [items, searchQuery, selectedSource, sortBy])

  const fetchAllItems = async () => {
    setLoading(true)
    try {
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}ui/items.json`)
      const data = await response.json()
      setItems(data.items || data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortItems = () => {
    let filtered = items

    // Apply source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(item => item.source_type === selectedSource)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.source?.toLowerCase().includes(query) ||
        item.tldr?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date)
        case 'source':
          return (a.source || '').localeCompare(b.source || '')
        case 'overall':
        default:
          return (b.overall || 0) - (a.overall || 0)
      }
    })

    setFilteredItems(filtered)
  }

  // Get unique sources for filter
  const sources = ['all', ...new Set(items.map(item => item.source_type).filter(Boolean))]
  const sourceStats = items.reduce((acc, item) => {
    const type = item.source_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'youtube': return <Youtube style={{ width: '16px', height: '16px', color: '#ff0000' }} />
      case 'github': return <Github style={{ width: '16px', height: '16px', color: 'var(--foreground)' }} />
      default: return <Globe style={{ width: '16px', height: '16px', color: 'var(--muted-foreground)' }} />
    }
  }

  const getSourceColor = (sourceType) => {
    switch (sourceType) {
      case 'youtube': return '#ff0000'
      case 'github': return '#333'
      default: return 'var(--muted-foreground)'
    }
  }

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
          <p style={{ color: 'var(--muted-foreground)' }}>Loading data sources...</p>
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
              background: 'var(--primary)',
              borderRadius: '8px'
            }}>
              <Globe style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Data Sources</h1>
              <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
                {filteredItems.length} items from {Object.keys(sourceStats).length} source types
              </p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Source Stats */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Source Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.entries(sourceStats).map(([sourceType, count]) => (
              <Card key={sourceType} style={{ cursor: 'pointer' }} onClick={() => setSelectedSource(sourceType)}>
                <CardContent style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '8px' }}>
                    {getSourceIcon(sourceType)}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
                    {sourceType}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
              placeholder="Search across all sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            style={{
              background: 'var(--input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--foreground)',
              textTransform: 'capitalize'
            }}
          >
            <option value="all">All Sources</option>
            {sources.filter(s => s !== 'all').map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          
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
            <option value="source">Sort by Source</option>
          </select>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
              {searchQuery ? 'No items match your search.' : 'No items found.'}
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card 
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  className="hover-lift"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  <CardContent style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Source Icon */}
                      <div style={{ 
                        padding: '8px', 
                        background: 'var(--muted)', 
                        borderRadius: '6px',
                        flexShrink: 0
                      }}>
                        {getSourceIcon(item.source_type)}
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '500', margin: 0, lineHeight: '1.3' }}>
                            {item.title}
                          </h3>
                          <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--muted-foreground)' }} />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <Badge style={{ 
                            background: getSourceColor(item.source_type), 
                            color: 'white',
                            fontSize: '10px'
                          }}>
                            <Star style={{ width: '10px', height: '10px', marginRight: '4px' }} />
                            {(item.overall || 0).toFixed(2)}
                          </Badge>
                          
                          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                            {item.source}
                          </span>
                          
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
                        
                        {item.tldr && (
                          <p style={{ 
                            fontSize: '14px', 
                            color: 'var(--muted-foreground)', 
                            lineHeight: '1.4',
                            margin: '0 0 8px 0'
                          }}>
                            {item.tldr}
                          </p>
                        )}
                        
                        {/* Pillars */}
                        {item.pillars && item.pillars.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {item.pillars.map((pillar, pi) => (
                              <Badge key={pi} variant="outline" style={{ fontSize: '10px' }}>
                                {pillar}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
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

export default DataSourcesPage