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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Alice Chen', email: 'alice@example.com', initials: 'AC', color: '#3b82f6' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', initials: 'BS', color: '#10b981' },
  { id: '3', name: 'Carol Wang', email: 'carol@example.com', initials: 'CW', color: '#f59e0b' },
  { id: '4', name: 'David Lee', email: 'david@example.com', initials: 'DL', color: '#8b5cf6' },
];

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
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM);

  // Edit card states
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showEditCard, setShowEditCard] = useState(false);

  // Form states
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardPriority, setCardPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [cardEstimatedHours, setCardEstimatedHours] = useState('');
  const [cardDueDate, setCardDueDate] = useState('');
  const [cardAssignedTo, setCardAssignedTo] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, [projectId]);

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      const data = await api.getBoards(projectId);

      // Ensure each column has a cards array
      const boardsWithCards = data.map((board: Board) => ({
        ...board,
        columns: (board.columns || []).map((column: any) => ({
          ...column,
          cards: column.cards || []
        }))
      }));

      setBoards(boardsWithCards);
      if (boardsWithCards.length > 0 && !selectedBoard) {
        setSelectedBoard(boardsWithCards[0]);
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

      // Ensure the board has columns with cards arrays
      const boardWithCards = {
        ...newBoard,
        columns: (newBoard.columns || []).map((column: any) => ({
          ...column,
          cards: column.cards || []
        }))
      };

      setBoards([...boards, boardWithCards]);
      setSelectedBoard(boardWithCards);
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
      const column = selectedBoard.columns?.find(c => c.id === selectedColumnId);
      if (!column) return;

      const newCard = await api.createCard(selectedBoard.id, {
        title: cardTitle,
        description: cardDescription,
        columnId: selectedColumnId,
        boardId: selectedBoard.id,
        order: (column.cards || []).length,
        priority: cardPriority,
        estimatedHours: cardEstimatedHours ? parseFloat(cardEstimatedHours) : undefined,
      });

      // Update local state
      const updatedBoard = { ...selectedBoard };
      const columnIndex = updatedBoard.columns?.findIndex(c => c.id === selectedColumnId);
      if (columnIndex !== undefined && columnIndex !== -1) {
        if (!updatedBoard.columns[columnIndex].cards) {
          updatedBoard.columns[columnIndex].cards = [];
        }
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
      const targetColumn = selectedBoard.columns?.find(c => c.id === columnId);
      if (!targetColumn) return;

      await api.moveCard(draggedCard.id, columnId, (targetColumn.cards || []).length);

      // Reload board to get updated state
      const updatedBoard = await api.getBoard(selectedBoard.id);

      // Ensure the updated board has cards arrays
      const boardWithCards = {
        ...updatedBoard,
        columns: (updatedBoard.columns || []).map((column: any) => ({
          ...column,
          cards: column.cards || []
        }))
      };

      setSelectedBoard(boardWithCards);
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

        // Ensure the updated board has cards arrays
        const boardWithCards = {
          ...updatedBoard,
          columns: (updatedBoard.columns || []).map((column: any) => ({
            ...column,
            cards: column.cards || []
          }))
        };

        setSelectedBoard(boardWithCards);
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('Failed to delete card');
    }
  };

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent board selection when clicking delete

    if (!confirm('Are you sure you want to delete this board? This will delete all columns and cards.')) return;

    try {
      await api.deleteBoard(boardId);

      // Remove board from state
      const updatedBoards = boards.filter(b => b.id !== boardId);
      setBoards(updatedBoards);

      // If we deleted the selected board, select the first remaining board
      if (selectedBoard?.id === boardId) {
        if (updatedBoards.length > 0) {
          const firstBoard = {
            ...updatedBoards[0],
            columns: (updatedBoards[0].columns || []).map((column: any) => ({
              ...column,
              cards: column.cards || []
            }))
          };
          setSelectedBoard(firstBoard);
        } else {
          setSelectedBoard(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
      alert('Failed to delete board');
    }
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setCardTitle(card.title);
    setCardDescription(card.description || '');
    setCardPriority(card.priority);
    setCardEstimatedHours(card.estimatedHours?.toString() || '');
    setCardDueDate(card.dueDate || '');
    setCardAssignedTo(card.assignedTo?.id || null);
    setShowEditCard(true);
  };

  const handleUpdateCard = async () => {
    if (!editingCard || !cardTitle.trim()) return;

    try {
      const updatedCard = await api.updateCard(editingCard.id, {
        title: cardTitle,
        description: cardDescription,
        priority: cardPriority,
        estimatedHours: cardEstimatedHours ? parseFloat(cardEstimatedHours) : undefined,
        dueDate: cardDueDate || undefined,
        assignedToId: cardAssignedTo || undefined,
      });

      // Update local state
      if (selectedBoard) {
        const updatedBoard = { ...selectedBoard };
        updatedBoard.columns = updatedBoard.columns.map(col => ({
          ...col,
          cards: (col.cards || []).map(card =>
            card.id === editingCard.id ? { ...card, ...updatedCard } : card
          )
        }));
        setSelectedBoard(updatedBoard);
      }

      // Reset form
      setShowEditCard(false);
      setEditingCard(null);
      setCardTitle('');
      setCardDescription('');
      setCardPriority('medium');
      setCardEstimatedHours('');
      setCardDueDate('');
      setCardAssignedTo(null);
    } catch (error) {
      console.error('Failed to update card:', error);
      alert('Failed to update card');
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
            <div
              key={board.id}
              style={{
                position: 'relative',
                display: 'inline-block'
              }}
            >
              <button
                onClick={() => {
                  // Ensure the board has columns with cards arrays
                  const boardWithCards = {
                    ...board,
                    columns: (board.columns || []).map((column: any) => ({
                      ...column,
                      cards: column.cards || []
                    }))
                  };
                  setSelectedBoard(boardWithCards);
                }}
                style={{
                  padding: '8px 32px 8px 16px',
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
              <button
                onClick={(e) => handleDeleteBoard(board.id, e)}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  width: '24px',
                  height: '24px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
                title="Delete board"
              >
                🗑️
              </button>
            </div>
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
            {(selectedBoard.columns || [])
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
                        {(column.cards || []).length}
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
                    {(column.cards || [])
                      .sort((a, b) => a.order - b.order)
                      .map((card) => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => handleDragStart(card)}
                          onClick={() => handleEditCard(card)}
                          style={{
                            background: 'white',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'pointer',
                            border: '1px solid #e5e7eb',
                            position: 'relative',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
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

                            {card.assignedTo && (() => {
                              const member = teamMembers.find(m => m.id === card.assignedTo?.id);
                              if (!member) return null;
                              return (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginLeft: 'auto'
                                  }}
                                  title={`Assigned to ${member.name}`}
                                >
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: member.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '9px',
                                    border: '2px solid white',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}>
                                    {member.initials}
                                  </div>
                                </div>
                              );
                            })()}
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

      {/* Edit Card Modal */}
      {showEditCard && editingCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
              Edit Card
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Title
              </label>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Assign To
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    onClick={() => setCardAssignedTo(cardAssignedTo === member.id ? null : member.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: cardAssignedTo === member.id ? `2px solid ${member.color}` : '1px solid #e5e7eb',
                      background: cardAssignedTo === member.id ? `${member.color}15` : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: member.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}>
                      {member.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: cardAssignedTo === member.id ? '600' : '400' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {member.email}
                      </div>
                    </div>
                    {cardAssignedTo === member.id && (
                      <div style={{ color: member.color, fontSize: '18px' }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Priority
              </label>
              <select
                value={cardPriority}
                onChange={(e) => setCardPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Estimated Hours
              </label>
              <input
                type="number"
                value={cardEstimatedHours}
                onChange={(e) => setCardEstimatedHours(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
                placeholder="e.g., 8"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                Due Date
              </label>
              <input
                type="date"
                value={cardDueDate}
                onChange={(e) => setCardDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditCard(false);
                  setEditingCard(null);
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
                onClick={handleUpdateCard}
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
