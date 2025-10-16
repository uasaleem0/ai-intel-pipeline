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
    <div className="w-full max-w-4xl mx-auto">
      <Card className="relative overflow-hidden border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 via-background to-primary/5">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
        
        <div className="relative">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">AI Intelligence Assistant</CardTitle>
                  <CardDescription>
                    Trained on {data?.counts?.items || 0} curated items • RAG-powered insights
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Chat Messages */}
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "flex gap-3",
                      message.type === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type === 'assistant' && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn("flex flex-col max-w-[80%]", message.type === 'user' && "items-end")}>
                      <Card className={cn(
                        message.type === 'user' 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted border-border"
                      )}>
                        <CardContent className="p-3">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </CardContent>
                      </Card>
                      
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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your AI intelligence data..."
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

export default AIInterface