import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Settings, Activity, Database, Clock, Zap, 
  Server, CheckCircle, AlertCircle, Info, Cpu, HardDrive 
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

const SettingsPage = ({ onBack }) => {
  const [health, setHealth] = useState(null)
  const [systemStats, setSystemStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    setLoading(true)
    try {
      const [healthResponse, reportResponse] = await Promise.all([
        fetch('/health').then(r => r.json()).catch(() => null),
        fetch('/report').then(r => r.json()).catch(() => null)
      ])
      
      setHealth(healthResponse)
      setSystemStats(reportResponse)
    } catch (error) {
      console.error('Error fetching system data:', error)
    } finally {
      setLoading(false)
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
          <p style={{ color: 'var(--muted-foreground)' }}>Loading system information...</p>
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
              <Settings style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>System Settings</h1>
              <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
                Configuration and health monitoring
              </p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* System Health Overview */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>System Health</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* Overall Status */}
            <Card>
              <CardHeader style={{ paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {health?.status === 'healthy' ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  ) : (
                    <AlertCircle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                  )}
                  <CardTitle style={{ fontSize: '16px', margin: 0 }}>Overall Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {health?.status || 'Unknown'}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                  System operational status
                </p>
              </CardContent>
            </Card>

            {/* Items Count */}
            <Card>
              <CardHeader style={{ paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                  <CardTitle style={{ fontSize: '16px', margin: 0 }}>Total Items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {health?.item_count || systemStats?.counts?.items || 0}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                  Items in knowledge base
                </p>
              </CardContent>
            </Card>

            {/* LLM Status */}
            <Card>
              <CardHeader style={{ paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                  <CardTitle style={{ fontSize: '16px', margin: 0 }}>LLM Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Badge style={{
                    background: health?.llm_available ? '#10b981' : '#f59e0b',
                    color: 'white'
                  }}>
                    {health?.llm_available ? 'Available' : 'No API Keys'}
                  </Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                  AI processing capability
                </p>
              </CardContent>
            </Card>

            {/* Embeddings */}
            <Card>
              <CardHeader style={{ paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                  <CardTitle style={{ fontSize: '16px', margin: 0 }}>Embeddings Index</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Badge style={{
                    background: health?.model_exists ? '#10b981' : '#f59e0b',
                    color: 'white'
                  }}>
                    {health?.model_exists ? 'Ready' : 'Not Built'}
                  </Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                  Vector search capability
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Sources */}
        {systemStats?.by_source && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Data Sources</h2>
            
            <Card>
              <CardContent style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {Object.entries(systemStats.by_source).map(([source, count]) => {
                    const getSourceIcon = (source) => {
                      if (source.toLowerCase().includes('youtube')) return '▶️'
                      if (source.toLowerCase().includes('github')) return '🐙'
                      return '📦'
                    }
                    
                    return (
                      <div key={source} style={{ 
                        textAlign: 'center',
                        padding: '16px',
                        background: 'var(--muted)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                          {getSourceIcon(source)}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {count}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                          {source}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pillars Distribution */}
        {systemStats?.pillars && Object.keys(systemStats.pillars).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Knowledge Pillars</h2>
            
            <Card>
              <CardContent style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                  {Object.entries(systemStats.pillars)
                    .sort(([,a], [,b]) => b - a)
                    .map(([pillar, count]) => (
                    <div key={pillar} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'var(--muted)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {pillar}
                      </span>
                      <Badge variant="outline">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Configuration</h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px', margin: 0 }}>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
                  <div>Health Check: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>/health</code></div>
                  <div>Data Report: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>/report</code></div>
                  <div>Items List: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>/items</code></div>
                  <div>RAG Queries: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>/query</code></div>
                  <div>Add Source: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>/ingest-url</code></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px', margin: 0 }}>Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
                  <div>Vault Path: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>vault/ai-intel/</code></div>
                  <div>Index File: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>vault/index.csv</code></div>
                  <div>Model Path: <code style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>vault/model/</code></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px', margin: 0 }}>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button variant="outline" onClick={fetchSystemData}>
                    <Activity style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Refresh Status
                  </Button>
                  <Button variant="outline" disabled>
                    <HardDrive style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Clear Cache
                  </Button>
                  <Button variant="outline" disabled>
                    <Server style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Restart Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage