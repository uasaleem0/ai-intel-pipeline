import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Database, AlertCircle, Lightbulb, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { cn } from '../lib/utils'

const RAGQueryInterface = ({ data }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm your AI assistant trained on your intelligence data. I can help you find insights, answer questions about your collected sources, and provide recommendations based on your indexed content.",
      timestamp: new Date(),
      sources: []
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [ragStatus, setRagStatus] = useState('ready') // 'building', 'ready', 'error'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate RAG response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I understand you're asking about "${input.trim()}". Based on your indexed data, here are some relevant insights:\n\n• This relates to ${Math.floor(Math.random() * 5) + 1} items in your collection\n• Most relevant pillars: AI UI/UX, Claude/OpenAI Best Practices\n• Confidence score: ${(Math.random() * 0.3 + 0.7).toFixed(2)}\n\nWould you like me to elaborate on any specific aspect?`,
        timestamp: new Date(),
        sources: [
          { title: 'SuperClaude Framework', url: 'https://github.com/SuperClaude-Org/SuperClaude_Framework', pillar: 'Claude/OpenAI Best Practices' },
          { title: 'Next.js v16.0.0-canary.4', url: 'https://github.com/vercel/next.js/releases/tag/v16.0.0-canary.4', pillar: 'AI UI/UX' }
        ]
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const StatusIndicator = () => {
    const statusConfig = {
      building: { icon: Loader2, color: 'text-yellow-500', text: 'Building index...', spin: true },
      ready: { icon: Database, color: 'text-green-500', text: 'RAG ready', spin: false },
      error: { icon: AlertCircle, color: 'text-red-500', text: 'Index error', spin: false }
    }
    
    const config = statusConfig[ragStatus]
    const Icon = config.icon
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={ragStatus === 'ready' ? 'default' : 'secondary'} className="gap-1">
          <Icon className={cn(config.color, "h-3 w-3", config.spin && "animate-spin")} />
          {config.text}
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Database className="h-3 w-3 mr-1" />
          {data?.counts?.items || 0} items
        </Badge>
      </div>
    )
  }

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user'
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn("flex gap-3 max-w-full", isUser ? "justify-end" : "justify-start")}
      >
        {!isUser && (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Bot className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
          <Card className={cn(
            "shadow-sm",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}>
            <CardContent className="p-3">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </CardContent>
          </Card>
          
          {message.sources && message.sources.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-1 mt-1"
            >
              {message.sources.map((source, index) => (
                <motion.a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    {source.title}
                  </Badge>
                </motion.a>
              ))}
            </motion.div>
          )}
          
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {isUser && (
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-600">
              <User className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    )
  }

  const suggestedQueries = [
    "What are the latest AI UI/UX trends?",
    "Show me Claude best practices",
    "What's new in Next.js development?",
    "Find automation tools I should try"
  ]

  return (
    <Card className="h-full flex flex-col border-2 border-primary/20 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Intelligence Assistant
              </h2>
              <p className="text-sm text-muted-foreground font-normal">Powered by your curated data</p>
            </div>
          </CardTitle>
          <StatusIndicator />
        </div>
      </CardHeader>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-2"
          >
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setInput(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your AI intelligence data..."
              disabled={isLoading || ragStatus === 'building'}
              className="flex-1"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading || ragStatus === 'building'}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  )
}

export default RAGQueryInterface