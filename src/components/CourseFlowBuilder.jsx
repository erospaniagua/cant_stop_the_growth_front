import { useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Controls,
  MiniMap,
  Handle,
  Position,
  applyNodeChanges,
} from "reactflow";
import { useTheme } from "next-themes";
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
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
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
  pdf: (props) => <NodeBox {...props} bg="#059669" />,
  quiz: (props) => <NodeBox {...props} bg="#D97706" />,
  cert: (props) => <NodeBox {...props} bg="#7C3AED" />,
};

/* ======================================================== */
export default function CourseFlowBuilder({ modules = [], onChange, readOnly = false }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  /* --------------- Rebuild from existing modules --------------- */
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
      style: {
        stroke: isDark ? "rgba(229,231,235,0.4)" : "rgba(255,255,255,0.4)",
        strokeWidth: 0.75,
      },
    }));
    setNodes(all);
    setEdges(newEdges);
  }, [modules, readOnly, isDark]);

  useEffect(() => {
    if (modules.length) buildFromModules();
  }, [modules, buildFromModules]);

  /* --------------- Add / Remove modules --------------- */
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
    const newEdge = {
      id: `${last.id}-${id}`,
      source: last.id,
      target: id,
      animated: true,
      style: {
        stroke: isDark ? "rgba(229,231,235,0.4)" : "rgba(255,255,255,0.4)",
        strokeWidth: 0.75,
      },
    };

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
    const newEdges = edges.filter(
      (e) => e.target !== nodes[nodes.length - 1].id
    );

    setNodes(newNodes);
    setEdges(newEdges);

    // ✅ Preserve all previous node labels properly
    const modulesData = newNodes
      .filter((n) => n.id !== "start")
      .map((n, i) => ({
        type: n.type,
        title: n.data?.label || "(untitled)",
        order: i,
      }));

    onChange?.(modulesData);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  /* -------------------- Blueprint Style -------------------- */
  const bgColor = isDark ? "#1E1E1E" : "#1E3A8A";
  const gridGap = 80;

  return (
    <div className="relative w-full h-full overflow-hidden" tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        fitView
        nodeTypes={nodeTypes}
        panOnDrag
        panActivationKeyCode="Space"
        selectionKeyCode={null}
        zoomOnScroll
        zoomOnPinch
        selectNodesOnDrag={false}
        minZoom={0.5}
        maxZoom={1.5}
        snapToGrid
        snapGrid={[gridGap, gridGap]}
        translateExtent={[[-800, -400], [3000, 1000]]}
        defaultViewport={{ x: -100, y: 0, zoom: 0.8 }}
        style={{
          background: bgColor,
          transition: "background 0.4s ease",
        }}
      >
        {/* ✅ Blueprint grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? "rgba(229,231,235,0.08)" : "rgba(255,255,255,0.08)"} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? "rgba(229,231,235,0.08)" : "rgba(255,255,255,0.08)"} 1px, transparent 1px),
              linear-gradient(${isDark ? "rgba(229,231,235,0.15)" : "rgba(255,255,255,0.15)"} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? "rgba(229,231,235,0.15)" : "rgba(255,255,255,0.15)"} 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px, 80px 80px, 400px 400px, 400px 400px",
            zIndex: 0,
          }}
        ></div>

        <MiniMap nodeColor={() => "#6366F1"} maskColor="rgba(0,0,0,0.2)" />
        <Controls showInteractive={false} />
      </ReactFlow>

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
