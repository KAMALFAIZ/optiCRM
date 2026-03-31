import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Tooltip,
  Typography,
  Badge,
  message as antMessage,
} from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
  ClearOutlined,
  CopyOutlined,
  StopOutlined,
  SearchOutlined,
  MailOutlined,
  LineChartOutlined,
  BulbOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { streamChat, type ChatMessage } from '@/api/ai';
import { useAppSelector } from '@/store';
import { selectThemeMode } from '@/features/settings/themeSlice';

const { Text } = Typography;
const { TextArea } = Input;

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Bonjour ! Je suis votre assistant IA OptiCRM. Je peux vous aider avec de nombreuses taches. Utilisez les actions rapides ci-dessous ou posez-moi votre question !',
};

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <SearchOutlined />,
    label: 'Recherche intelligente',
    prompt: 'Aide-moi a trouver des informations dans mon CRM',
  },
  {
    icon: <MailOutlined />,
    label: 'Rediger un email',
    prompt: 'Aide-moi a rediger un email professionnel pour un prospect',
  },
  {
    icon: <LineChartOutlined />,
    label: 'Analyser mon pipeline',
    prompt: 'Donne-moi une analyse de la sante de mon pipeline commercial et des recommandations',
  },
  {
    icon: <BulbOutlined />,
    label: 'Conseils commerciaux',
    prompt: 'Quelles sont les meilleures pratiques pour ameliorer mon taux de conversion ?',
  },
  {
    icon: <FileTextOutlined />,
    label: 'Resume de reunion',
    prompt: 'Aide-moi a structurer et resumer les notes de ma derniere reunion commerciale',
  },
  {
    icon: <UserSwitchOutlined />,
    label: 'Suggestions de relance',
    prompt: 'Propose-moi des strategies de relance pour mes contacts inactifs depuis plus de 30 jours',
  },
];

interface ExtendedMessage extends ChatMessage {
  timestamp?: string;
}

// --- Typing indicator animation ---
function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderRadius: '16px 16px 16px 4px',
          backgroundColor: isDark ? '#2a2a2a' : '#f0f2f5',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isDark ? '#666' : '#999',
              display: 'inline-block',
              animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// --- Message bubble ---
interface MessageBubbleProps {
  message: ExtendedMessage;
  isDark: boolean;
  isStreaming: boolean;
}

function MessageBubble({ message, isDark, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [showCopy, setShowCopy] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    antMessage.success('Copie !');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 6,
      }}
    >
      <div
        style={{ maxWidth: '85%', position: 'relative' }}
        onMouseEnter={() => !isUser && setShowCopy(true)}
        onMouseLeave={() => setShowCopy(false)}
      >
        <div
          style={{
            padding: '8px 12px',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            backgroundColor: isUser
              ? '#1677ff'
              : isDark
              ? '#2a2a2a'
              : '#f0f2f5',
            color: isUser ? '#fff' : isDark ? '#e0e0e0' : '#333',
            fontSize: 13,
            lineHeight: '1.6',
            wordBreak: 'break-word',
          }}
        >
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          ) : (
            <div className="ai-markdown-content">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: '4px 0' }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ margin: '4px 0', paddingLeft: 18 }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: 2 }}>{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code
                        style={{
                          backgroundColor: isDark ? '#383838' : '#e6e6e6',
                          padding: '1px 4px',
                          borderRadius: 3,
                          fontSize: 12,
                        }}
                      >
                        {children}
                      </code>
                    ) : (
                      <pre
                        style={{
                          backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
                          padding: 8,
                          borderRadius: 6,
                          overflow: 'auto',
                          fontSize: 12,
                          margin: '6px 0',
                        }}
                      >
                        <code>{children}</code>
                      </pre>
                    );
                  },
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 600 }}>{children}</strong>
                  ),
                  h1: ({ children }) => (
                    <h4 style={{ margin: '8px 0 4px', fontSize: 15, fontWeight: 600 }}>{children}</h4>
                  ),
                  h2: ({ children }) => (
                    <h5 style={{ margin: '6px 0 3px', fontSize: 14, fontWeight: 600 }}>{children}</h5>
                  ),
                  h3: ({ children }) => (
                    <h6 style={{ margin: '4px 0 2px', fontSize: 13, fontWeight: 600 }}>{children}</h6>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <div
            style={{
              fontSize: 10,
              color: isDark ? '#666' : '#aaa',
              marginTop: 2,
              textAlign: isUser ? 'right' : 'left',
              paddingLeft: isUser ? 0 : 4,
              paddingRight: isUser ? 4 : 0,
            }}
          >
            {message.timestamp}
          </div>
        )}

        {/* Copy button (assistant messages only) */}
        {!isUser && showCopy && !isStreaming && message.content && (
          <Tooltip title="Copier">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 4,
                right: -28,
                opacity: 0.6,
                fontSize: 12,
              }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// --- CSS keyframes injection ---
const styleId = 'ai-assistant-styles';
function injectStyles() {
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    @keyframes chatPanelIn {
      from { opacity: 0; transform: scale(0.92) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes chatPanelOut {
      from { opacity: 1; transform: scale(1) translateY(0); }
      to { opacity: 0; transform: scale(0.92) translateY(10px); }
    }
    .ai-chat-panel-enter {
      animation: chatPanelIn 0.2s ease-out forwards;
    }
    .ai-chat-panel-exit {
      animation: chatPanelOut 0.15s ease-in forwards;
    }
    .ai-markdown-content p:first-child { margin-top: 0 !important; }
    .ai-markdown-content p:last-child { margin-bottom: 0 !important; }
    .ai-quick-action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(22, 119, 255, 0.15);
    }
  `;
  document.head.appendChild(style);
}

// --- Main component ---
export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { ...WELCOME_MESSAGE, timestamp: '' },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cancelStreamRef = useRef<(() => void) | null>(null);
  const themeMode = useAppSelector(selectThemeMode);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSend = useCallback(
    (overrideInput?: string) => {
      const trimmed = (overrideInput ?? input).trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ExtendedMessage = {
        role: 'user',
        content: trimmed,
        timestamp: getTimestamp(),
      };
      const newMessages = [...messages, userMessage];

      setMessages(newMessages);
      setInput('');
      setIsStreaming(true);
      setShowQuickActions(false);

      // Add empty assistant message that will be filled by streaming
      const assistantMessage: ExtendedMessage = {
        role: 'assistant',
        content: '',
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Send conversation history (exclude initial welcome message)
      const conversationMessages = newMessages
        .slice(messages[0]?.content === WELCOME_MESSAGE.content ? 1 : 0)
        .map(({ role, content }) => ({ role, content }));

      cancelStreamRef.current = streamChat(
        conversationMessages,
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
            return updated;
          });
        },
        () => {
          setIsStreaming(false);
          cancelStreamRef.current = null;
        },
        (err) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: `**Erreur :** ${err}`,
              timestamp: getTimestamp(),
            };
            return updated;
          });
          setIsStreaming(false);
          cancelStreamRef.current = null;
        }
      );
    },
    [input, isStreaming, messages]
  );

  const handleStopStream = () => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleClear = () => {
    handleStopStream();
    setMessages([{ ...WELCOME_MESSAGE, timestamp: '' }]);
    setShowQuickActions(true);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  const panelBg = isDark ? '#1a1a1a' : '#ffffff';
  const borderColor = isDark ? '#303030' : '#e8e8e8';
  const headerBg = isDark ? '#141414' : '#1677ff';

  return (
    <>
      {/* Floating button */}
      <Tooltip title="Assistant IA" placement="left">
        <Badge dot={isStreaming} color="green" offset={[-4, 4]}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<RobotOutlined style={{ fontSize: 20 }} />}
            onClick={() => (open ? handleClose() : setOpen(true))}
            style={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              width: 52,
              height: 52,
              zIndex: 1000,
              boxShadow: '0 4px 16px rgba(22, 119, 255, 0.4)',
            }}
          />
        </Badge>
      </Tooltip>

      {/* Chat panel */}
      {open && (
        <div
          className={closing ? 'ai-chat-panel-exit' : 'ai-chat-panel-enter'}
          style={{
            position: 'fixed',
            bottom: 96,
            right: 32,
            width: 400,
            height: 580,
            zIndex: 1000,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: panelBg,
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: headerBg,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ color: '#fff', fontSize: 18 }} />
              <Text strong style={{ color: '#fff', fontSize: 14 }}>
                Assistant IA OptiCRM
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Tooltip title="Nouvelle conversation">
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                />
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={handleClose}
                style={{ color: 'rgba(255,255,255,0.8)' }}
              />
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 12px 4px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                message={msg}
                isDark={isDark}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}

            {/* Quick actions */}
            {showQuickActions && messages.length <= 1 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    className="ai-quick-action-btn"
                    onClick={() => handleQuickAction(action)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 10px',
                      borderRadius: 20,
                      border: `1px solid ${isDark ? '#404040' : '#d9d9d9'}`,
                      backgroundColor: isDark ? '#252525' : '#fafafa',
                      color: isDark ? '#d0d0d0' : '#555',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].content === '' && (
                <TypingIndicator isDark={isDark} />
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '8px 12px 12px',
              borderTop: `1px solid ${borderColor}`,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isStreaming}
              style={{
                flex: 1,
                resize: 'none',
                fontSize: 13,
                borderRadius: 8,
              }}
            />
            {isStreaming ? (
              <Tooltip title="Arreter">
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStopStream}
                  style={{ borderRadius: 8, height: 36 }}
                />
              </Tooltip>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSend()}
                disabled={!input.trim()}
                style={{ borderRadius: 8, height: 36 }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
