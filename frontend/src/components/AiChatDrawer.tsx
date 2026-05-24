'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Array<{
    chunk_id: string
    text: string
    page: number
  }>
  timestamp: Date
}

interface AiChatDrawerProps {
  testProcedureId: string
  agentRunId: string | null
  orgId?: string
  userId?: string
}

export default function AiChatDrawer({ testProcedureId, agentRunId, orgId, userId }: AiChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m CX·Pro AI, and I can answer questions about this test procedure. For example, you can ask "Why is this step necessary?" or "What\'s the source for this requirement?"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Simulate AI response with grounded answer
      // In production, this would call your AI API
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getGroundedResponse(input),
          citations: getMockCitations(input),
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])
        setLoading(false)
      }, 1500)
    } catch (error) {
      console.error('Error sending message:', error)
      setLoading(false)
    }
  }

  const getGroundedResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('why') && lowerQuestion.includes('step')) {
      return 'This step is required to verify proper system operation according to ASHRAE Standard 202-2018, Section 5.2.1. The manufacturer\'s submittal specifies this test procedure to ensure the equipment meets the design specifications for airflow and pressure drop.'
    }
    
    if (lowerQuestion.includes('source') || lowerQuestion.includes('requirement')) {
      return 'This requirement comes from the equipment submittal document, specifically page 42, section "Functional Performance Testing". It aligns with the project specifications in Division 23, Section 230593 - Testing, Adjusting, and Balancing for HVAC.'
    }
    
    if (lowerQuestion.includes('what') && lowerQuestion.includes('mean')) {
      return 'This refers to the verification of the Variable Air Volume (VAV) control sequence. The system must modulate airflow based on space temperature demand while maintaining minimum ventilation rates as specified in the submittal (1,200 CFM minimum).'
    }
    
    return 'Based on the test procedure documentation and equipment submittal, this checklist item ensures compliance with both manufacturer requirements and project specifications. The specific parameters and acceptance criteria are detailed in the source documents.'
  }

  const getMockCitations = (question: string): Message['citations'] => {
    if (question.toLowerCase().includes('why') || question.toLowerCase().includes('source')) {
      return [
        {
          chunk_id: 'chunk-123',
          text: 'ASHRAE Standard 202-2018, Section 5.2.1',
          page: 42
        },
        {
          chunk_id: 'chunk-456',
          text: 'Manufacturer Submittal - Functional Testing',
          page: 18
        }
      ]
    }
    return []
  }

  const handleFeedback = async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    // Save feedback to database
    if (!orgId || !userId) {
      console.error('Missing orgId or userId for feedback')
      return
    }

    try {
      const { error } = await supabase
        .from('feedback_records')
        .insert({
          test_procedure_instance_id: testProcedureId,
          agent_run_id: agentRunId,
          message_id: messageId,
          feedback_type: feedback,
          created_by: userId,
          org_id: orgId,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      if (feedback === 'thumbs_down') {
        // Show feedback textarea
        const reason = prompt('What was wrong with this response?')
        if (reason) {
          await supabase
            .from('feedback_records')
            .update({ feedback_text: reason })
            .eq('message_id', messageId)
        }
      }
    } catch (error) {
      console.error('Error saving feedback:', error)
    }
  }

  return (
    <div className="bp-ai-chat">
      <div className="bp-ai-messages">
        {messages.map(message => (
          <div key={message.id} className={`bp-ai-message bp-ai-message-${message.role}`}>
            {message.role === 'assistant' && (
              <div className="bp-ai-avatar">
                <span className="bp-ai-avatar-icon">⚡</span>
              </div>
            )}
            
            <div className="bp-ai-message-content">
              <div className="bp-ai-message-text">{message.content}</div>
              
              {message.citations && message.citations.length > 0 && (
                <div className="bp-ai-citations">
                  {message.citations.map((citation, idx) => (
                    <button 
                      key={idx}
                      className="bp-ai-citation"
                      onClick={() => {
                        // Open PDF at specific page
                        console.log(`Opening citation: ${citation.text} at page ${citation.page}`)
                      }}
                    >
                      <span className="bp-citation-icon">📄</span>
                      <span>{citation.text}</span>
                      <span className="bp-citation-page">p.{citation.page}</span>
                    </button>
                  ))}
                </div>
              )}

              {message.role === 'assistant' && agentRunId && (
                <div className="bp-ai-feedback">
                  <button
                    className="bp-ai-feedback-btn"
                    onClick={() => handleFeedback(message.id, 'thumbs_up')}
                    title="Helpful"
                  >
                    👍
                  </button>
                  <button
                    className="bp-ai-feedback-btn"
                    onClick={() => handleFeedback(message.id, 'thumbs_down')}
                    title="Not helpful"
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="bp-ai-message bp-ai-message-assistant">
            <div className="bp-ai-avatar">
              <span className="bp-ai-avatar-icon">⚡</span>
            </div>
            <div className="bp-ai-message-content">
              <div className="bp-ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="bp-ai-input-container">
        <input
          type="text"
          className="bp-ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about this test procedure..."
          disabled={loading}
        />
        <button
          className="bp-ai-send"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

// CSS for AI chat
const styles = `
.bp-ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.bp-ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bp-ai-message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.bp-ai-message-user {
  flex-direction: row-reverse;
}

.bp-ai-message-user .bp-ai-message-content {
  background: var(--bp-blue);
  color: white;
  margin-left: 40px;
}

.bp-ai-avatar {
  width: 32px;
  height: 32px;
  background: var(--bp-blue-soft);
  border-radius: 4px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.bp-ai-avatar-icon {
  font-size: 16px;
}

.bp-ai-message-content {
  flex: 1;
  background: var(--bp-paper-2);
  padding: 12px 16px;
  border-radius: 4px;
  max-width: 85%;
}

.bp-ai-message-text {
  font-size: 14px;
  line-height: 1.5;
}

.bp-ai-citations {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bp-ai-citation {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--bp-card);
  border: 1px solid var(--bp-line-soft);
  border-radius: 3px;
  font-size: 12px;
  color: var(--bp-blue);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-family: inherit;
}

.bp-ai-citation:hover {
  background: var(--bp-card-2);
  border-color: var(--bp-blue);
  transform: translateX(2px);
}

.bp-citation-icon {
  font-size: 11px;
}

.bp-citation-page {
  margin-left: auto;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: var(--bp-graphite);
}

.bp-ai-feedback {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.bp-ai-feedback-btn {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--bp-line-softer);
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;
}

.bp-ai-feedback-btn:hover {
  background: var(--bp-card);
  border-color: var(--bp-line-soft);
  transform: scale(1.1);
}

.bp-ai-typing {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.bp-ai-typing span {
  width: 8px;
  height: 8px;
  background: var(--bp-graphite);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.bp-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.bp-ai-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

.bp-ai-input-container {
  padding: 16px 0 0;
  border-top: 1px solid var(--bp-line-soft);
  display: flex;
  gap: 8px;
}

.bp-ai-input {
  flex: 1;
  padding: 10px 12px;
  background: var(--bp-card-2);
  border: 1px solid var(--bp-line-soft);
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  color: var(--bp-ink);
  transition: all 0.15s ease;
}

.bp-ai-input:focus {
  outline: none;
  border-color: var(--bp-blue);
  background: white;
}

.bp-ai-input:disabled {
  opacity: 0.5;
}

.bp-ai-send {
  padding: 10px 16px;
  background: var(--bp-blue);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.15s ease;
  display: grid;
  place-items: center;
}

.bp-ai-send:hover:not(:disabled) {
  background: #0E35D9;
  transform: translateX(2px);
}

.bp-ai-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}