import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Youtube, Github, Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const AddSourceModal = ({ isOpen, onClose, onSuccess }) => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null) // null, 'success', 'error'
  const [message, setMessage] = useState('')

  const detectSourceType = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { type: 'youtube', icon: Youtube, color: '#FF0000' }
    } else if (url.includes('github.com')) {
      return { type: 'github', icon: Github, color: '#24292e' }
    } else {
      return { type: 'web', icon: Globe, color: '#6366f1' }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    setStatus(null)
    setMessage('')

    try {
      const response = await fetch('/ingest-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url.trim(),
          dry_run: false 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(`Successfully added source! Item ID: ${data.item_id || 'Generated'}`)
        onSuccess?.(data)
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setStatus('error')
        setMessage(data.detail || 'Failed to add source')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error. Make sure the API server is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setUrl('')
    setStatus(null)
    setMessage('')
    setIsLoading(false)
    onClose()
  }

  const sourceInfo = detectSourceType(url)
  const SourceIcon = sourceInfo.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4"
          >
            <Card style={{ 
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '8px',
                      background: 'var(--primary)',
                      borderRadius: '8px'
                    }}>
                      <Plus style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div>
                      <CardTitle style={{ margin: 0, fontSize: '18px' }}>Add New Source</CardTitle>
                      <CardDescription style={{ margin: '4px 0 0 0' }}>
                        Paste a YouTube or GitHub URL to analyze
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* URL Input */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: 'var(--foreground)',
                      marginBottom: '8px'
                    }}>
                      Source URL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... or https://github.com/..."
                        disabled={isLoading}
                        style={{ 
                          paddingRight: url ? '40px' : '12px',
                          background: 'var(--input)',
                          border: '1px solid var(--border)'
                        }}
                      />
                      {url && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}>
                          <SourceIcon 
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              color: sourceInfo.color 
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Source Type Info */}
                  {url && (
                    <div style={{
                      padding: '12px',
                      background: 'var(--muted)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SourceIcon style={{ width: '16px', height: '16px', color: sourceInfo.color }} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          {sourceInfo.type === 'youtube' && 'YouTube Video'}
                          {sourceInfo.type === 'github' && 'GitHub Repository'}
                          {sourceInfo.type === 'web' && 'Web Page'}
                        </span>
                      </div>
                      <p style={{ 
                        fontSize: '12px', 
                        color: 'var(--muted-foreground)', 
                        margin: '4px 0 0 0' 
                      }}>
                        {sourceInfo.type === 'youtube' && 'Will transcribe audio and extract key insights'}
                        {sourceInfo.type === 'github' && 'Will analyze README, releases, and repository structure'}
                        {sourceInfo.type === 'web' && 'Will extract and analyze page content'}
                      </p>
                    </div>
                  )}

                  {/* Status Message */}
                  {status && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {status === 'success' ? (
                        <CheckCircle style={{ 
                          width: '16px', 
                          height: '16px', 
                          color: '#10b981' 
                        }} />
                      ) : (
                        <AlertCircle style={{ 
                          width: '16px', 
                          height: '16px', 
                          color: '#ef4444' 
                        }} />
                      )}
                      <span style={{ 
                        fontSize: '14px',
                        color: status === 'success' ? '#10b981' : '#ef4444'
                      }}>
                        {message}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!url.trim() || isLoading}
                      style={{ minWidth: '100px' }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px' }} className="animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                          Add Source
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddSourceModal