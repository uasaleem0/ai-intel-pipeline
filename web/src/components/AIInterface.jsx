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
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="card ai-glow" style={{ 
        position: 'relative',
        overflow: 'hidden',
        background: `
          linear-gradient(135deg, 
            #1a1a2e 0%, 
            #16213e 25%,
            #0f3460 50%,
            #533483 75%,
            #1a1a2e 100%
          )
        `,
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: `
          0 25px 50px -12px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(139, 92, 246, 0.1),
          0 0 60px rgba(139, 92, 246, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
        borderRadius: '16px'
      }}>
        {/* Animated Moving Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(-45deg, 
              rgba(139, 92, 246, 0.2) 0%, 
              rgba(59, 130, 246, 0.15) 25%,
              rgba(16, 185, 129, 0.1) 50%,
              rgba(59, 130, 246, 0.15) 75%,
              rgba(139, 92, 246, 0.2) 100%
            )
          `,
          pointerEvents: 'none',
          animation: 'colorShift 4s ease-in-out infinite',
          backgroundSize: '400% 400%'
        }} />
        
        {/* Animated Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              background: `hsl(${Math.random() * 60 + 240}, 70%, ${Math.random() * 30 + 50}%)`,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 6 + 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.7,
              pointerEvents: 'none',
              filter: 'blur(0.5px)'
            }}
          />
        ))}
        
        {/* Pulsing Glow Ring */}
        <div style={{
          position: 'absolute',
          inset: '-2px',
          background: 'linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.3), transparent, rgba(59, 130, 246, 0.3), transparent)',
          borderRadius: '18px',
          animation: 'breathe 4s ease-in-out infinite',
          pointerEvents: 'none',
          filter: 'blur(2px)',
          opacity: 0.8
        }} />
        
        {/* Magnetic Field Effect */}
        <div style={{
          position: 'absolute',
          inset: '-8px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '24px',
          animation: 'magneticPull 6s ease-in-out infinite',
          pointerEvents: 'none',
          opacity: 0.6
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ChatGPT-style Header */}
          <div style={{ 
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{
                position: 'relative',
                padding: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #6366f1 100%)',
                borderRadius: '20px',
                boxShadow: `
                  0 8px 25px rgba(139, 92, 246, 0.6), 
                  0 0 50px rgba(139, 92, 246, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `,
                animation: 'float 3s ease-in-out infinite, buttonGlow 2s ease-in-out infinite'
              }}>
                <Sparkles style={{ width: '28px', height: '28px', color: 'white' }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '20px',
                  background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                  animation: 'pulse 3s ease-in-out infinite'
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>AI Intelligence Assistant</h3>
              <p style={{ 
                fontSize: '16px', 
                color: 'rgba(255, 255, 255, 0.8)', 
                margin: '0 0 12px 0',
                fontWeight: '500'
              }}>
                Powered by {data?.counts?.items || 0} curated items • Real-time insights
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Badge style={{ 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '6px 12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#10b981',
                    marginRight: '6px',
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                  Online
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Chat Content */}
          <div style={{ padding: '24px' }}>
            {/* Chat Messages */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              marginBottom: '20px', 
              height: '280px',
              overflowY: 'auto',
              paddingRight: '8px',
              scrollbarWidth: 'thin'
            }}>
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
                      <div style={{
                        padding: '12px 16px',
                        background: message.type === 'user' ? 'var(--primary)' : 'var(--muted)',
                        border: message.type === 'user' ? '1px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                        color: message.type === 'user' ? 'var(--primary-foreground)' : 'var(--foreground)',
                        cursor: 'default'
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(query)}
                      className="hover-lift"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'var(--muted)',
                        border: '1px solid var(--border)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'var(--primary)'
                        e.target.style.color = 'var(--primary-foreground)'
                        e.target.style.borderColor = 'var(--primary)'
                        e.target.style.transform = 'translateY(-2px) scale(1.05)'
                        e.target.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'var(--muted)'
                        e.target.style.color = 'var(--foreground)'
                        e.target.style.borderColor = 'var(--border)'
                        e.target.style.transform = 'translateY(0) scale(1)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your AI intelligence data..."
                disabled={isLoading}
                className="input"
                style={{ 
                  flex: 1, 
                  background: 'var(--input)', 
                  border: '1px solid var(--input-border)',
                  height: '44px',
                  minHeight: '44px',
                  maxHeight: '44px',
                  resize: 'none',
                  overflow: 'hidden'
                }}
              />
              <button
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="button-primary"
                style={{ 
                  padding: '10px', 
                  height: '44px',
                  width: '44px',
                  flexShrink: 0
                }}
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