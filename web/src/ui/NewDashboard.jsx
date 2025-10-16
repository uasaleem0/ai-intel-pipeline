import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, TrendingUp, Database, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import RAGQueryInterface from '../components/RAGQueryInterface'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

function useData() {
  const [report, setReport] = React.useState(null)
  const [items, setItems] = React.useState([])
  const [history, setHistory] = React.useState([])
  
  React.useEffect(() => {
    const v = '?v=' + Date.now()
    Promise.all([
      fetch('report.json' + v).then(r => r.json()),
      fetch('items.json' + v).then(r => r.json()),
      fetch('history.json' + v).then(r => r.json()).catch(() => []),
    ]).then(([rep, its, h]) => {
      setReport(rep)
      setItems(its)
      setHistory(h)
    })
  }, [])
  
  return { report, items, history }
}

const SystemHealthCard = ({ report, history }) => {
  const counts = report?.counts || {}
  const items = counts.items || 0
  const evPass = counts.evidence_pass || 0
  const evTotal = counts.evidence || 0
  const passRate = evTotal ? ((evPass / evTotal) * 100).toFixed(1) + '%' : '—'
  const lastRun = history && history.length ? history[history.length - 1] : null
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Items indexed</span>
          <span className="font-semibold">{items}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pass rate</span>
          <span className="font-semibold">{passRate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last run</span>
          <span className="text-xs text-muted-foreground">
            {lastRun ? new Date(lastRun.ts).toLocaleDateString() : '—'}
          </span>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const QuickStatsCard = ({ title, value, change, icon: Icon, trend = 'up' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    className="p-1"
  >
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={`text-xs flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className="h-3 w-3" />
                {change}
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const RecentItemsList = ({ items }) => {
  const recentItems = items?.slice(0, 5) || []
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentItems.map((item, index) => (
          <motion.div
            key={item.item_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.source_type} • Score: {(item.overall || 0).toFixed(2)}
              </p>
              {item.pillars && item.pillars.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {item.pillars.slice(0, 2).map((pillar, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {pillar}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function NewDashboard() {
  const { report, items, history } = useData()
  const [searchQuery, setSearchQuery] = React.useState('')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">AI Intelligence Pipeline</h1>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search data..."
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="h-4 w-4" />
              Add Source
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Main RAG Interface - Takes center stage */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-8"
          >
            <RAGQueryInterface data={report} />
          </motion.div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6 overflow-y-auto">
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              <QuickStatsCard
                title="Total Items"
                value={report?.counts?.items || 0}
                change="+12 today"
                icon={Database}
              />
              <QuickStatsCard
                title="Active Pillars"
                value={Object.keys(report?.pillars || {}).length}
                change="+2 this week"
                icon={TrendingUp}
              />
            </motion.div>

            {/* System Health */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SystemHealthCard report={report} history={history} />
            </motion.div>

            {/* Recent Items */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <RecentItemsList items={items} />
            </motion.div>

            {/* Pillars Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Top Pillars</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(report?.pillars || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([pillar, count], index) => (
                      <motion.div
                        key={pillar}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{pillar}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </motion.div>
                    ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}