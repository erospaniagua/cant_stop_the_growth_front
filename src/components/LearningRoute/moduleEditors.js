// src/components/modules/moduleEditors.js
import VideoEditor from "./VideoEditor.jsx";
import PDFEditor from "./PdfEditor.jsx/index.js";
import QuizEditor from "./QuizEditor.jsx";
import CertEditor from "./CertEditor.jsx"; // future

export const moduleEditors = {
  video: VideoEditor,
  pdf: PDFEditor,
  quiz: QuizEditor,
  cert: CertEditor,
  // add future ones here
};
