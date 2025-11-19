import { Node, Edge } from 'reactflow';

export type NodeType = 'start' | 'solution' | 'experiment' | 'decision' | 'end' | 'container';

export type NodeStatus = 'active' | 'completed' | 'abandoned' | 'paused';

export interface NodeData {
  label: string;
  description: string;
  notes: string;
  tags: string[];
  effort: number; // 1-10
  value: number; // 1-10
  status: NodeStatus;
  type: NodeType;
  createdAt: Date;
  updatedAt: Date;
  // Container support
  parentId?: string; // ID of parent container node
  childrenIds?: string[]; // IDs of child nodes (only for container type)
  isExpanded?: boolean; // Whether container is expanded (only for container type)
}

export interface DSNode extends Node {
  data: NodeData;
}

export interface DSEdge extends Edge {
  pathId?: string;
}

export interface Path {
  id: string;
  name: string;
  description: string;
  nodes: string[];
  status: NodeStatus;
  startedAt: Date;
  completedAt?: Date;
  metrics: {
    totalEffort: number;
    totalValue: number;
    timeSpent: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: DSNode[];
  edges: DSEdge[];
  paths: Path[];
}

export interface EffortValueQuadrant {
  name: string;
  description: string;
  color: string;
  minEffort: number;
  maxEffort: number;
  minValue: number;
  maxValue: number;
}
