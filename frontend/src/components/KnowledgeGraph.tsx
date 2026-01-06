import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
  Controls,
  Position,
  Handle,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

// --------------------
// Types
// --------------------
export type KnowledgeNode = {
  id: string;
  type: string;
  content: string;
};

export type KnowledgeEdge = {
  source: string;
  target: string;
  type: string;
};

export type KnowledgeGraphProps = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
};

// --------------------
// Dagre Layout Helper
// --------------------
const nodeWidth = 200;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --------------------
// Custom Node
// --------------------
const CustomKnowledgeNode = ({ data }: any) => {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #777',
        background: '#1a1a1a',
        color: '#fff',
        minWidth: '180px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}
    >
      {/* Incoming */}
      <Handle type="target" position={Position.Top} />

      {/* Type */}
      <div
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          color: '#00ff88',
          marginBottom: '6px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        {data.label}
      </div>

      {/* Content */}
      <div style={{ fontSize: '12px', color: '#ddd' }}>
        {data.content}
      </div>

      {/* Outgoing */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// --------------------
// Main Component
// --------------------
const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodes: inputNodes,
  edges: inputEdges,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({
      customKnowledgeNode: CustomKnowledgeNode,
    }),
    []
  );

  const onLayout = useCallback(() => {
    const rfNodes: Node[] = inputNodes.map((kn) => ({
      id: kn.id,
      type: 'customKnowledgeNode',
      data: {
        label: kn.type,
        content: kn.content,
      },
      position: { x: 0, y: 0 },
    }));

    const rfEdges: Edge[] = inputEdges.map((ke, i) => ({
      id: `e-${i}`,
      source: ke.source,
      target: ke.target,
      label: ke.type,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: { stroke: '#888' },
      labelStyle: {
        fill: '#aaa',
        fontWeight: 600,
        fontSize: 10,
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } =
      getLayoutedElements(rfNodes, rfEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [inputNodes, inputEdges, setNodes, setEdges]);

  useEffect(() => {
    onLayout();
  }, [onLayout]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#050505' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Background color="#222" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default KnowledgeGraph;
    