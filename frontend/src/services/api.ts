const API_URL = 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(name: string, description?: string) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async updateProject(id: string, data: { name?: string; description?: string }) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Nodes
  async createNode(data: any) {
    return this.request('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNode(id: string, data: any) {
    return this.request(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNode(id: string) {
    return this.request(`/nodes/${id}`, {
      method: 'DELETE',
    });
  }

  // Edges
  async createEdge(projectId: string, fromId: string, toId: string) {
    return this.request('/edges', {
      method: 'POST',
      body: JSON.stringify({ projectId, fromId, toId }),
    });
  }

  async deleteEdge(id: string) {
    return this.request(`/edges/${id}`, {
      method: 'DELETE',
    });
  }

  // Datasets
  async getDatasets(projectId: string) {
    return this.request(`/datasets/project/${projectId}`);
  }

  async getDataset(id: string) {
    return this.request(`/datasets/${id}`);
  }

  async createDataset(data: any) {
    return this.request('/datasets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDataset(id: string, data: any) {
    return this.request(`/datasets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDataset(id: string) {
    return this.request(`/datasets/${id}`, {
      method: 'DELETE',
    });
  }

  async linkDataset(nodeId: string, datasetId: string, role: string) {
    return this.request('/datasets/link', {
      method: 'POST',
      body: JSON.stringify({ nodeId, datasetId, role }),
    });
  }

  async unlinkDataset(linkId: string) {
    return this.request(`/datasets/link/${linkId}`, {
      method: 'DELETE',
    });
  }

  // Models
  async getModels(nodeId: string) {
    return this.request(`/models/node/${nodeId}`);
  }

  async getModel(id: string) {
    return this.request(`/models/${id}`);
  }

  async createModel(data: any) {
    return this.request('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModel(id: string, data: any) {
    return this.request(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModel(id: string) {
    return this.request(`/models/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(nodeId: string) {
    return this.request(`/comments/node/${nodeId}`);
  }

  async createComment(nodeId: string, content: string, mentions?: string[]) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify({ nodeId, content, mentions }),
    });
  }

  async updateComment(id: string, data: { content?: string; isResolved?: boolean }) {
    return this.request(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string) {
    return this.request(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Time Tracking
  async getTimeEntries(nodeId: string) {
    return this.request(`/tracking/time/node/${nodeId}`);
  }

  async startTimer(nodeId: string, description?: string) {
    return this.request('/tracking/time/start', {
      method: 'POST',
      body: JSON.stringify({ nodeId, description }),
    });
  }

  async stopTimer(id: string) {
    return this.request(`/tracking/time/stop/${id}`, {
      method: 'POST',
    });
  }

  async getActiveTimer() {
    return this.request('/tracking/time/active');
  }

  async deleteTimeEntry(id: string) {
    return this.request(`/tracking/time/${id}`, {
      method: 'DELETE',
    });
  }

  // Cost Tracking
  async getCostEntries(projectId: string) {
    return this.request(`/tracking/cost/project/${projectId}`);
  }

  async getCostEntriesForNode(nodeId: string) {
    return this.request(`/tracking/cost/node/${nodeId}`);
  }

  async createCostEntry(data: any) {
    return this.request('/tracking/cost', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCostEntry(id: string, data: any) {
    return this.request(`/tracking/cost/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCostEntry(id: string) {
    return this.request(`/tracking/cost/${id}`, {
      method: 'DELETE',
    });
  }

  // Boards
  async getBoards(projectId: string) {
    return this.request(`/boards/project/${projectId}`);
  }

  async getBoard(id: string) {
    return this.request(`/boards/${id}`);
  }

  async createBoard(data: { name: string; description?: string; projectId: string; columns?: any[] }) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoard(id: string, data: { name?: string; description?: string }) {
    return this.request(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(id: string) {
    return this.request(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  // Cards
  async createCard(boardId: string, data: any) {
    return this.request(`/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCard(id: string, data: any) {
    return this.request(`/boards/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async moveCard(id: string, columnId: string, order: number) {
    return this.request(`/boards/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ columnId, order }),
    });
  }

  async deleteCard(id: string) {
    return this.request(`/boards/cards/${id}`, {
      method: 'DELETE',
    });
  }

  // Columns
  async createColumn(boardId: string, title: string, order: number) {
    return this.request(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ title, order }),
    });
  }

  async updateColumn(id: string, data: { title?: string; order?: number }) {
    return this.request(`/boards/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteColumn(id: string) {
    return this.request(`/boards/columns/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export type { User, AuthResponse };
