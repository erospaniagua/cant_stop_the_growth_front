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

// Editors
import VideoEditor from "./VideoEditor";
import PDFEditor from "./PDFEditor";
import QuizEditor from "./QuizEditor";
import CertEditor from "./CertEditor";

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

/* -------------------- NODE TYPES -------------------- */
const nodeTypes = {
  input: (props) => <NodeBox {...props} bg="#4F46E5" />,
  video: (props) => <NodeBox {...props} bg="#2563EB" />,
  pdf: (props) => <NodeBox {...props} bg="#059669" />,
  quiz: (props) => <NodeBox {...props} bg="#D97706" />,
  cert: (props) => (
  <NodeBox
    {...props}
    bg="#7C3AED"
    data={{ ...props.data, label: "🏁 Certification" }}
   />
   ),
   };

/* -------------------- MODULE EDITORS -------------------- */
const moduleEditors = {
  video: VideoEditor,
  pdf: PDFEditor,
  quiz: QuizEditor,
  cert: CertEditor,
};

/* ======================================================== */
export default function CourseFlowBuilder({
  courseId,
  modules = [],
  onChange,
  onUpdateModule,
  readOnly = false,
}) {
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
  const [activeNode, setActiveNode] = useState(null);
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  /* ===========================================================
     🧩 Build from modules (reuse saved positions if any)
  =========================================================== */
  const buildFromModules = useCallback(() => {
    const base = [
      {
        id: "start",
        type: "input",
        data: { label: "Start" },
        position: { x: 0, y: 150 },
        draggable: !readOnly,
      },
    ];

    const oldPositions = new Map(nodesRef.current.map((n) => [n.id, n.position]));

    const newNodes = modules.map((m, i) => {
      const id = m._id?.toString() || `${i + 1}`;
      const savedPos = m.payload?.position; // ✅ use saved layout if available
      const existingPos = oldPositions.get(id);
      return {
        id,
        type: m.type,
        data: { label: m.title },
        position: savedPos || existingPos || { x: (i + 1) * 220, y: 150 },
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
  }, [modules, isDark, readOnly]);

  useEffect(() => {
    if (modules.length) buildFromModules();
  }, [modules, buildFromModules]);

  /* ===========================================================
     🪄 Persist position changes when user drags nodes
  =========================================================== */
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);

        // 🧠 Persist positions back to modules
        if (onChange && changes.some((c) => c.type === "position")) {
          const updatedModules = modules.map((m, i) => {
            const id = m._id?.toString() || `${i + 1}`;
            const node = updated.find((n) => n.id === id);
            return {
              ...m,
              payload: {
                ...m.payload,
                position: node?.position || m.payload?.position,
              },
            };
          });
          onChange(updatedModules);
        }

        return updated;
      });
    },
    [modules, onChange]
  );

  /* ===========================================================
     Add / Remove modules (same as before)
  =========================================================== */
  const addModule = (type, title) => {
    if (readOnly) return;

    const id = crypto.randomUUID();
    const last = nodes[nodes.length - 1];
    const newNode = {
      id,
      type,
      data: { label: title },
      position: { x: last.position.x + 220, y: 150 },
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

    const modulesData = [
      ...modules.map((m, i) => ({
        ...m,
        order: i,
      })),
      {
        type,
        title,
        order: modules.length,
        payload: { position: newNode.position }, // ✅ store new node position
      },
    ];

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

    const newModules = modules.slice(0, -1).map((m, i) => ({
      ...m,
      order: i,
    }));

    onChange?.(newModules);
  };

  /* ===========================================================
     Node click → open editor modal
  =========================================================== */
  const handleNodeClick = (_, node) => {
    if (readOnly || node.id === "start") return;
    const idx = modules.findIndex(
      (m, i) => m._id?.toString() === node.id || `${i + 1}` === node.id
    );
    if (idx === -1) return;
    const module = modules[idx];
    setActiveNode({ idx, module });
  };

  /* -------------------- Blueprint Style -------------------- */
  const bgColor = isDark ? "#1E1E1E" : "#1E3A8A";
  const gridGap = 80;

  /* ===========================================================
     Render
  =========================================================== */
  const EditorComponent =
  activeNode?.module?.type &&
  activeNode.module.type !== "cert" && // 🧩 skip cert modules
  moduleEditors[activeNode.module.type];


  return (
    <div className="relative w-full h-full overflow-hidden" tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        fitView
        nodeTypes={nodeTypes}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        snapToGrid
        snapGrid={[gridGap, gridGap]}
        translateExtent={[[-800, -400], [3000, 1000]]}
        defaultViewport={{ x: -100, y: 0, zoom: 0.8 }}
        style={{ background: bgColor }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${isDark ? "rgba(229,231,235,0.08)" : "rgba(255,255,255,0.08)"} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? "rgba(229,231,235,0.08)" : "rgba(255,255,255,0.08)"} 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            zIndex: 0,
          }}
        ></div>
        <MiniMap nodeColor={() => "#6366F1"} maskColor="rgba(0,0,0,0.2)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {!readOnly && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 bg-neutral-900/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
          <button onClick={() => addModule("video", "Video Lesson")} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
            + Video
          </button>
          <button onClick={() => addModule("pdf", "Lecture (PDF)")} className="px-3 py-2 bg-green-600 text-white rounded text-sm">
            + PDF
          </button>
          <button onClick={() => addModule("quiz", "Test")} className="px-3 py-2 bg-yellow-500 text-black rounded text-sm">
            + Test
          </button>
          <button onClick={() => addModule("cert", "Certification")} className="px-3 py-2 bg-purple-600 text-white rounded text-sm">
            + Cert
          </button>
          <button onClick={handleDeleteLast} className="px-3 py-2 border border-red-500 text-red-500 rounded text-sm">
            − Remove last
          </button>
        </div>
      )}

      {/* 🧩 Active Module Editor */}
      {EditorComponent && activeNode && (
       <div
        className="absolute inset-0 bg-black/60 flex justify-center z-50"
        style={{
        alignItems: "flex-start",   // 🧩 start from top instead of center
        paddingTop: "5vh",          // ✅ adds space from top (visible close button)
        overflowY: "auto",
        }}
       >
       <div className="relative bg-neutral-900 text-white w-[700px] max-h-[90vh] rounded-xl p-6 overflow-y-auto shadow-lg">
       <button
        onClick={() => setActiveNode(null)}
        className="absolute top-3 right-3 text-neutral-400 hover:text-white"
       >
        ✕
       </button>


            <EditorComponent
              module={{ ...activeNode.module, courseId }}
              onChange={(data) => {
                const updated = [...modules];
                const idx = activeNode.idx;
                const mod = activeNode.module;

                const mergedPayload = { ...mod.payload, ...data.payload };
                updated[idx] = {
                  ...mod,
                  title: data.title || mod.title,
                  payload: mergedPayload,
                };

                onChange?.(updated);

                if (onUpdateModule) {
                  const idKey = mod._id || mod.tempId || idx;
                  onUpdateModule(idKey, {
                    title: data.title || mod.title,
                    payload: mergedPayload,
                  });
                }

                setActiveNode({ idx, module: updated[idx] });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
