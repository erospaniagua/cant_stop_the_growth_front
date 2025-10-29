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
  moduleBreak: (props) => <NodeBox {...props} bg="#3B82F6" />,
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

/* -------------------- EDITORS -------------------- */
const moduleEditors = {
  video: VideoEditor,
  pdf: PDFEditor,
  quiz: QuizEditor,
  cert: CertEditor,
};

/* ======================================================== */
export default function CourseFlowBuilder({
  courseId,
  modules = [], // [{title, lessons: []}]
  onChange,
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
     🔄 Build from modules (Phase -> Modules -> Lessons)
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
    const allNodes = [];

    modules.forEach((mod, mIndex) => {
      const modId = `mod-${mIndex + 1}`;
      allNodes.push({
        id: modId,
        type: "moduleBreak",
        data: { label: mod.title || `Module ${mIndex + 1}` },
        position: oldPositions.get(modId) || { x: (mIndex + 1) * 250, y: 50 },
        draggable: !readOnly,
      });

      (mod.lessons || []).forEach((l, i) => {
        const id = `${modId}-l${i + 1}`;
        allNodes.push({
          id,
          type: l.type,
          data: { label: l.title },
          position:
            oldPositions.get(id) ||
            l.payload?.position || { x: (mIndex + 1) * 250 + (i + 1) * 200, y: 150 },
          draggable: !readOnly,
        });
      });
    });

    const all = [...base, ...allNodes];
    const newEdges = all.slice(0, -1).map((n, i) => ({
      id: `e${n.id}-${all[i + 1].id}`,
      source: n.id,
      target: all[i + 1].id,
      animated: true,
      style: {
        stroke: isDark
          ? "rgba(229,231,235,0.4)"
          : "rgba(255,255,255,0.4)",
        strokeWidth: 0.75,
      },
    }));

    setNodes(all);
    setEdges(newEdges);
  }, [modules, isDark, readOnly]);

  useEffect(() => {
    buildFromModules();
  }, [modules, buildFromModules]);

  /* ===========================================================
     🪄 Persist position changes
  =========================================================== */
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        if (onChange && changes.some((c) => c.type === "position")) {
          const grouped = groupNodesIntoModules(updated, modules);
          onChange(grouped);
        }
        return updated;
      });
    },
    [onChange, modules]
  );

  /* ===========================================================
     ➕ Add new node (module break or lesson)
  =========================================================== */
  const addNode = (type, title) => {
    if (readOnly) return;
    const last = nodes[nodes.length - 1];
    const id = crypto.randomUUID();

    const newNode = {
      id,
      type,
      data: {
        label:
          type === "moduleBreak"
            ? `Module ${modules.length + 1}`
            : title,
      },
      position: { x: last.position.x + 220, y: 150 },
      draggable: true,
    };

    const newEdge = {
      id: `${last.id}-${id}`,
      source: last.id,
      target: id,
      animated: true,
      style: {
        stroke: isDark
          ? "rgba(229,231,235,0.4)"
          : "rgba(255,255,255,0.4)",
        strokeWidth: 0.75,
      },
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setEdges([...edges, newEdge]);
    onChange?.(groupNodesIntoModules(newNodes, modules));
  };

  const handleDeleteLast = () => {
    if (readOnly || nodes.length <= 1) return;
    const newNodes = nodes.slice(0, -1);
    setNodes(newNodes);
    setEdges(edges.filter((e) => e.target !== nodes[nodes.length - 1].id));
    onChange?.(groupNodesIntoModules(newNodes, modules));
  };

  /* ===========================================================
     🔍 Group nodes -> modules structure (preserve payloads)
  =========================================================== */
  const groupNodesIntoModules = (allNodes, prevModules = []) => {
    const result = [];
    let currentModule = null;

    const findOldLesson = (title) =>
      prevModules
        .flatMap((m) => m.lessons || [])
        .find((l) => l.title === title);

    allNodes.forEach((n) => {
      if (n.type === "moduleBreak") {
        if (currentModule) result.push(currentModule);
        currentModule = { title: n.data.label, lessons: [] };
      } else if (!["input"].includes(n.type)) {
        if (!currentModule) currentModule = { title: "Module 1", lessons: [] };
        const oldLesson = findOldLesson(n.data.label);
        currentModule.lessons.push({
          type: n.type,
          title: n.data.label,
          payload: {
            ...oldLesson?.payload,
            position: n.position,
          },
        });
      }
    });
    if (currentModule) result.push(currentModule);
    return result;
  };

  /* ===========================================================
     🖱️ Node click → open lesson editor
  =========================================================== */
  const handleNodeClick = (_, node) => {
    if (readOnly || node.type === "input" || node.type === "moduleBreak") return;
    const grouped = groupNodesIntoModules(nodes, modules);
    let foundModuleIndex = -1;
    let foundLesson = null;

    grouped.forEach((mod, i) => {
      mod.lessons.forEach((l, li) => {
        const nodeId = `${mod.title}-l${li + 1}`;
        if (l.title === node.data.label && !foundLesson) {
          foundModuleIndex = i;
          foundLesson = { ...l, index: li, id: node.id };
        }
      });
    });

    if (foundLesson)
      setActiveNode({ moduleIndex: foundModuleIndex, lesson: foundLesson });
  };

  /* ===========================================================
     🌈 Styling
  =========================================================== */
  const bgColor = isDark ? "#1E1E1E" : "#1E3A8A";
  const gridGap = 80;

  /* ===========================================================
     Render
  =========================================================== */
  const EditorComponent =
    activeNode?.lesson?.type &&
    activeNode.lesson.type !== "cert" &&
    moduleEditors[activeNode.lesson.type];

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
            backgroundImage: `linear-gradient(${
              isDark
                ? "rgba(229,231,235,0.08)"
                : "rgba(255,255,255,0.08)"
            } 1px, transparent 1px),
            linear-gradient(90deg, ${
              isDark
                ? "rgba(229,231,235,0.08)"
                : "rgba(255,255,255,0.08)"
            } 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            zIndex: 0,
          }}
        ></div>
        <MiniMap nodeColor={() => "#6366F1"} maskColor="rgba(0,0,0,0.2)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {!readOnly && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 bg-neutral-900/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
          <button
            onClick={() => addNode("moduleBreak", "Module")}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm"
          >
            + Module Break
          </button>
          <button
            onClick={() => addNode("video", "Video Lesson")}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
          >
            + Video
          </button>
          <button
            onClick={() => addNode("pdf", "Lecture (PDF)")}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm"
          >
            + PDF
          </button>
          <button
            onClick={() => addNode("quiz", "Test")}
            className="px-3 py-2 bg-yellow-500 text-black rounded text-sm"
          >
            + Test
          </button>
          <button
            onClick={() => addNode("cert", "Certification")}
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

      {EditorComponent && activeNode && (
        <div
          className="absolute inset-0 bg-black/60 flex justify-center z-50"
          style={{
            alignItems: "flex-start",
            paddingTop: "5vh",
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
              module={{ ...activeNode.lesson, courseId }}
              onChange={(data) => {
  const grouped = structuredClone(groupNodesIntoModules(nodes, modules));
  const modIdx = activeNode.moduleIndex;

  // 🧱 Build a clean updated lesson object
  const updatedLesson = {
    ...activeNode.lesson,
    title: data.title ?? activeNode.lesson.title,
    payload: {
      ...activeNode.lesson.payload,
      ...data.payload,
    },
  };

  // ✅ Safely replace (no direct mutation)
  if (grouped[modIdx]?.lessons) {
    grouped[modIdx].lessons = grouped[modIdx].lessons.map((l, idx) =>
      idx === activeNode.lesson.index ? updatedLesson : l
    );
  }

  // 🔄 Update parent + local active node
  onChange?.(structuredClone(grouped)); // force React to detect a new object
  setActiveNode({ moduleIndex: modIdx, lesson: updatedLesson });
}}

            />
          </div>
        </div>
      )}
    </div>
  );
}
