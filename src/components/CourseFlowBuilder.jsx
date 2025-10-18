import { useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";

/* -------------------- NODE COMPONENT -------------------- */
function NodeBox({ data, bg }) {
  return (
    <div
      style={{
        background: bg,
        color: "#fff",
        padding: "10px 20px",
        borderRadius: 8,
        fontWeight: 500,
        textAlign: "center",
        minWidth: 140,
        position: "relative",
        cursor: "grab",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#fff" }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ background: "#fff" }} />
    </div>
  );
}

/* -------------------- NODE TYPES MAP -------------------- */
const nodeTypes = {
  input: (props) => <NodeBox {...props} bg="#4F46E5" />,
  video: (props) => <NodeBox {...props} bg="#2563EB" />,
  pdf:   (props) => <NodeBox {...props} bg="#059669" />,
  quiz:  (props) => <NodeBox {...props} bg="#D97706" />,
  cert:  (props) => <NodeBox {...props} bg="#7C3AED" />,
};

/* ======================================================== */
export default function CourseFlowBuilder({
  modules = [],
  onChange,
  readOnly = false, // ✅ can disable drag and buttons
}) {
  const [nodes, setNodes] = useState([
    {
      id: "start",
      type: "input",
      data: { label: "Start" },
      position: { x: 0, y: 150 },
      draggable: !readOnly,
    },
  ]);
  const [edges, setEdges] = useState([]);
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  /* --------------- Rebuild from existing modules, preserving positions --------------- */
  const buildFromModules = useCallback(() => {
    const existingStart = nodesRef.current.find((n) => n.id === "start");
    const base = [
      {
        id: "start",
        type: "input",
        data: { label: "Start" },
        position: existingStart ? existingStart.position : { x: 0, y: 150 },
        draggable: !readOnly,
      },
    ];
    const newNodes = modules.map((m, i) => {
      const existing = nodesRef.current.find((n) => n.id === `${i + 1}`);
      return {
        id: `${i + 1}`,
        type: m.type,
        data: { label: m.title },
        position: existing ? existing.position : { x: (i + 1) * 200, y: 150 },
        draggable: !readOnly,
      };
    });
    const all = [...base, ...newNodes];
    const newEdges = all.slice(0, -1).map((n, i) => ({
      id: `e${n.id}-${all[i + 1].id}`,
      source: n.id,
      target: all[i + 1].id,
      animated: true,
    }));
    setNodes(all);
    setEdges(newEdges);
  }, [modules, readOnly]);

  useEffect(() => {
    if (modules.length) buildFromModules();
  }, [modules, buildFromModules]);

  /* --------------- Add or remove modules --------------- */
  const addModule = (type, title) => {
    if (readOnly) return;
    const id = crypto.randomUUID();
    const last = nodes[nodes.length - 1];
    const newNode = {
      id,
      type,
      data: { label: title },
      position: { x: last.position.x + 200, y: 150 },
      draggable: true,
    };
    const newEdge = { id: `${last.id}-${id}`, source: last.id, target: id, animated: true };
    const updatedNodes = [...nodes, newNode];
    const updatedEdges = [...edges, newEdge];

    setNodes(updatedNodes);
    setEdges(updatedEdges);

    const modulesData = updatedNodes
      .filter((n) => n.id !== "start")
      .map((n, i) => ({ type: n.type, title: n.data.label, order: i }));
    onChange?.(modulesData);
  };

  const handleDeleteLast = () => {
    if (readOnly || nodes.length <= 1) return;
    const newNodes = nodes.slice(0, -1);
    const newEdges = edges.slice(0, -1);
    setNodes(newNodes);
    setEdges(newEdges);
    onChange?.(newNodes.filter((n) => n.id !== "start"));
  };

  const handleNodeClick = (event, node) => {
    if (readOnly) return;
    console.log("Clicked node:", node);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  return (
    <div
      className="relative w-full h-[700px] border rounded-lg overflow-hidden bg-neutral-50"
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        fitView
        nodeTypes={nodeTypes}
        panOnDrag={true}
        panActivationKeyCode="Space"
        selectionKeyCode={null}
        zoomOnScroll
        zoomOnPinch
        selectNodesOnDrag={false}
        panOnScroll={false}
        minZoom={0.5}
        maxZoom={1.5}
        snapToGrid
        snapGrid={[25, 25]}
        translateExtent={[[-800, -400], [3000, 1000]]} // 🧩 Wider workspace
        defaultViewport={{ x: -100, y: 0, zoom: 0.8 }} // 🧭 starts zoomed out
      >
        <MiniMap />
        <Controls />
        <Background variant="dots" gap={20} size={1.5} color="#ccc" />
      </ReactFlow>

      {/* 🧰 Toolbar (top-left) */}
      {!readOnly && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 bg-neutral-900/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
          <button
            onClick={() => addModule("video", "Video Lesson")}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
          >
            + Video
          </button>
          <button
            onClick={() => addModule("pdf", "Lecture (PDF)")}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm"
          >
            + PDF
          </button>
          <button
            onClick={() => addModule("quiz", "Test")}
            className="px-3 py-2 bg-yellow-500 text-black rounded text-sm"
          >
            + Test
          </button>
          <button
            onClick={() => addModule("cert", "Certification")}
            className="px-3 py-2 bg-purple-600 text-white rounded text-sm"
          >
            + Cert
          </button>
          <button
            onClick={handleDeleteLast}
            className="px-3 py-2 border border-red-500 text-red-500 rounded text-sm"
          >
            − Remove last
          </button>
        </div>
      )}
    </div>
  );
}
