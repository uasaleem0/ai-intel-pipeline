import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronRight, ChevronDown, Database, Activity, 
  Clock, BarChart3, Github, Youtube, Rss,
  Palette, Bot, Zap, Settings, Workflow, Target
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'

const Sidebar = ({ isOpen, data, onPillarClick, onSourceClick }) => {
  const [openSections, setOpenSections] = React.useState({
    pillars: true,
    sources: true
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const pillarIcons = {
    'AI UI/UX': Palette,
    'Agents': Bot,
    'Claude/OpenAI Best Practices': Zap,
    'DevOps/Infra for AI': Settings,
    'Automation': Workflow,
    'No-code Workflows': Target,
    'Hygienic Workflow': BarChart3
  }

  const sourceIcons = {
    github: Github,
    youtube: Youtube,
    rss: Rss
  }

  const systemHealth = {
    items: data?.counts?.items || 0,
    lastRun: 'All systems operational',
    runs: '47 runs (7d)',
    status: 'healthy'
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
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border overflow-hidden z-40",
        !isOpen && "pointer-events-none"
      )}
    >
      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-6">
          
          {/* Pillars Section */}
          <div className="space-y-2">
            <Collapsible 
              open={openSections.pillars} 
              onOpenChange={() => toggleSection('pillars')}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto font-semibold text-foreground hover:text-primary"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Pillars
                  </span>
                  {openSections.pillars ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1 mt-2">
                {Object.entries(data?.pillars || {})
                  .sort(([,a], [,b]) => b - a)
                  .map(([pillar, count]) => {
                    const Icon = pillarIcons[pillar] || BarChart3
                    return (
                      <Button
                        key={pillar}
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => onPillarClick?.(pillar)}
                      >
                        <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{pillar}</div>
                          <div className="text-xs text-muted-foreground">
                            {count} items
                          </div>
                        </div>
                        {count > 15 && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator />

          {/* Sources Section */}
          <div className="space-y-2">
            <Collapsible 
              open={openSections.sources} 
              onOpenChange={() => toggleSection('sources')}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto font-semibold text-foreground hover:text-primary"
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Sources
                  </span>
                  {openSections.sources ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1 mt-2">
                {Object.entries(data?.by_source || {})
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => {
                    const Icon = sourceIcons[source.toLowerCase()] || Database
                    return (
                      <Button
                        key={source}
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => onSourceClick?.(source)}
                      >
                        <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium capitalize">{source}</div>
                          <div className="text-xs text-muted-foreground">
                            {count} items
                          </div>
                        </div>
                      </Button>
                    )
                  })}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* System Health - At Bottom */}
          <div className="mt-auto">
            <Separator className="mb-4" />
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className={cn(
                    "h-4 w-4",
                    systemHealth.status === 'healthy' ? "text-green-500" : "text-destructive"
                  )} />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <Badge variant="secondary">{systemHealth.items}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Operational
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" />
                    Last run: 2h ago
                  </div>
                  <div>47 runs (past 7 days)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar