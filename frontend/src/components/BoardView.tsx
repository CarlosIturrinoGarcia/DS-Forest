import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Card {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  estimatedHours?: number;
  dueDate?: string;
  tags?: string;
  order: number;
}

interface Column {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

interface Board {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
}

interface BoardViewProps {
  projectId: string;
  user: any;
}

const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444'
};

export default function BoardView({ projectId, user }: BoardViewProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);

  // Form states
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardPriority, setCardPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [cardEstimatedHours, setCardEstimatedHours] = useState('');

  useEffect(() => {
    loadBoards();
  }, [projectId]);

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      const data = await api.getBoards(projectId);
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;

    try {
      const newBoard = await api.createBoard({
        name: boardName,
        description: boardDescription,
        projectId,
      });
      setBoards([...boards, newBoard]);
      setSelectedBoard(newBoard);
      setBoardName('');
      setBoardDescription('');
      setShowCreateBoard(false);
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('Failed to create board');
    }
  };

  const handleCreateCard = async () => {
    if (!cardTitle.trim() || !selectedColumnId || !selectedBoard) return;

    try {
      const column = selectedBoard.columns.find(c => c.id === selectedColumnId);
      if (!column) return;

      const newCard = await api.createCard(selectedBoard.id, {
        title: cardTitle,
        description: cardDescription,
        columnId: selectedColumnId,
        boardId: selectedBoard.id,
        order: column.cards.length,
        priority: cardPriority,
        estimatedHours: cardEstimatedHours ? parseFloat(cardEstimatedHours) : undefined,
      });

      // Update local state
      const updatedBoard = { ...selectedBoard };
      const columnIndex = updatedBoard.columns.findIndex(c => c.id === selectedColumnId);
      if (columnIndex !== -1) {
        updatedBoard.columns[columnIndex].cards.push(newCard);
      }
      setSelectedBoard(updatedBoard);

      // Reset form
      setCardTitle('');
      setCardDescription('');
      setCardPriority('medium');
      setCardEstimatedHours('');
      setShowCreateCard(false);
      setSelectedColumnId(null);
    } catch (error) {
      console.error('Failed to create card:', error);
      alert('Failed to create card');
    }
  };

  const handleDragStart = (card: Card) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: string) => {
    if (!draggedCard || !selectedBoard) return;

    try {
      const targetColumn = selectedBoard.columns.find(c => c.id === columnId);
      if (!targetColumn) return;

      await api.moveCard(draggedCard.id, columnId, targetColumn.cards.length);

      // Reload board to get updated state
      const updatedBoard = await api.getBoard(selectedBoard.id);
      setSelectedBoard(updatedBoard);
      setDraggedCard(null);
    } catch (error) {
      console.error('Failed to move card:', error);
      alert('Failed to move card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      await api.deleteCard(cardId);
      if (selectedBoard) {
        const updatedBoard = await api.getBoard(selectedBoard.id);
        setSelectedBoard(updatedBoard);
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('Failed to delete card');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <p style={{ color: '#6b7280' }}>Loading boards...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => setSelectedBoard(board)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedBoard?.id === board.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                background: selectedBoard?.id === board.id ? '#eff6ff' : 'white',
                color: selectedBoard?.id === board.id ? '#3b82f6' : '#374151',
                fontWeight: selectedBoard?.id === board.id ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {board.name}
            </button>
          ))}
          <button
            onClick={() => setShowCreateBoard(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px dashed #3b82f6',
              background: 'white',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + New Board
          </button>
        </div>
      </div>

      {/* Board Content */}
      {selectedBoard ? (
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          background: '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            minHeight: '500px'
          }}>
            {selectedBoard.columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <div
                  key={column.id}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                  style={{
                    flex: '0 0 300px',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Column Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: 0
                    }}>
                      {column.title}
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: '400'
                      }}>
                        {column.cards.length}
                      </span>
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedColumnId(column.id);
                        setShowCreateCard(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {column.cards
                      .sort((a, b) => a.order - b.order)
                      .map((card) => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => handleDragStart(card)}
                          style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'grab',
                            border: '1px solid #e5e7eb',
                            position: 'relative'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            marginBottom: '8px'
                          }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              margin: 0,
                              color: '#111827',
                              flex: 1
                            }}>
                              {card.title}
                            </h4>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '0 4px'
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          {card.description && (
                            <p style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              margin: '8px 0'
                            }}>
                              {card.description}
                            </p>
                          )}

                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            marginTop: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: PRIORITY_COLORS[card.priority] + '20',
                              color: PRIORITY_COLORS[card.priority],
                              fontWeight: '500'
                            }}>
                              {card.priority}
                            </span>

                            {card.estimatedHours && (
                              <span style={{
                                fontSize: '10px',
                                color: '#6b7280'
                              }}>
                                {card.estimatedHours}h
                              </span>
                            )}

                            {card.assignedTo && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: '#e0e7ff',
                                color: '#4338ca'
                              }}>
                                {card.assignedTo.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#6b7280'
        }}>
          <p>No boards yet. Create one to get started!</p>
        </div>
      )}

      {/* Create Board Modal */}
      {showCreateBoard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Create New Board</h3>

            <input
              type="text"
              placeholder="Board name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />

            <textarea
              placeholder="Description (optional)"
              value={boardDescription}
              onChange={(e) => setBoardDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateBoard(false);
                  setBoardName('');
                  setBoardDescription('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {showCreateCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Create New Card</h3>

            <input
              type="text"
              placeholder="Card title"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />

            <textarea
              placeholder="Description (optional)"
              value={cardDescription}
              onChange={(e) => setCardDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '60px'
              }}
            />

            <select
              value={cardPriority}
              onChange={(e) => setCardPriority(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>

            <input
              type="number"
              placeholder="Estimated hours"
              value={cardEstimatedHours}
              onChange={(e) => setCardEstimatedHours(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateCard(false);
                  setSelectedColumnId(null);
                  setCardTitle('');
                  setCardDescription('');
                  setCardPriority('medium');
                  setCardEstimatedHours('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCard}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
