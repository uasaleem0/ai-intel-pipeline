import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { cn } from '../lib/utils'

const AIInterface = ({ data }) => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I've analyzed your latest data and I'm ready to help. Ask me anything about AI trends, tools, or insights from your curated sources.",
      timestamp: new Date(),
      sources: []
    }
  ])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Based on your indexed data about "${input.trim()}", I found several relevant insights. This relates to ${Math.floor(Math.random() * 12) + 3} items in your collection across multiple pillars. The patterns suggest growing interest in this area. Would you like me to dive deeper into any specific aspect?`,
        timestamp: new Date(),
        sources: [
          { title: 'SuperClaude Framework', pillar: 'Claude/OpenAI Best Practices' },
          { title: 'Next.js v16 Updates', pillar: 'AI UI/UX' }
        ]
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const suggestedQueries = [
    "What are the latest AI UI/UX trends?",
    "Show me Claude best practices",
    "What's new in automation tools?",
    "Find emerging development patterns"
  ]

  return (
    <div style={{ width: '100%' }}>
      <div className="card ai-glow" style={{ 
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--card) 0%, rgba(139, 92, 246, 0.02) 50%, var(--card) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        boxShadow: `
          0 20px 25px -5px rgba(0, 0, 0, 0.4),
          0 10px 10px -5px rgba(0, 0, 0, 0.3),
          0 0 40px rgba(139, 92, 246, 0.15)
        `
      }}>
        {/* Enhanced glow effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, transparent 30%, transparent 70%, rgba(139, 92, 246, 0.08) 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Enhanced Header */}
          <div style={{ 
            padding: '20px',
            borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.03) 0%, transparent 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  position: 'relative',
                  padding: '16px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  <Sparkles style={{ width: '24px', height: '24px', color: 'white' }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '16px',
                    background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    margin: '0 0 4px 0',
                    color: 'var(--foreground)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}>AI Intelligence Assistant</h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--muted-foreground)', 
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    Trained on {data?.counts?.items || 0} curated items • RAG-powered insights
                  </p>
                </div>
              </div>
              <Badge style={{ 
                background: 'linear-gradient(135deg, var(--green) 0%, #059669 100%)', 
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
              }}>
                <Sparkles style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                Ready
              </Badge>
            </div>
          </div>
          
          {/* Chat Content */}
          <div style={{ padding: '20px' }}>
            {/* Chat Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', maxHeight: '320px', overflowY: 'auto' }}>
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {message.type === 'assistant' && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '16px',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0
                      }}>
                        <Bot style={{ width: '16px', height: '16px', color: 'white' }} />
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      maxWidth: '80%',
                      alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <div className="card" style={{
                        padding: '12px 16px',
                        background: message.type === 'user' ? 'var(--primary)' : 'var(--muted)',
                        border: message.type === 'user' ? '1px solid var(--primary)' : '1px solid var(--border)',
                        color: message.type === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)'
                      }}>
                        <p style={{ fontSize: '14px', lineHeight: '1.4', margin: 0 }}>{message.content}</p>
                      </div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex flex-wrap gap-1 mt-2"
                        >
                          {message.sources.map((source, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-accent"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {source.title}
                            </Badge>
                          ))}
                        </motion.div>
                      )}
                      
                      <span className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="bg-muted border-border">
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

            {/* Suggested Queries */}
            {messages.length === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInput(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your AI intelligence data..."
                disabled={isLoading}
                className="input"
                style={{ flex: 1, background: 'var(--input)', border: '1px solid var(--input-border)' }}
                autoFocus
              />
              <button
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="button-primary"
                style={{ padding: '10px', aspectRatio: '1' }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIInterface