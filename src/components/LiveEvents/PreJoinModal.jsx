import { useEffect, useState } from "react";
import { parseZoomLink, buildBrowserJoinUrl } from "@/utils/zoom";

export default function PreJoinModal({ event, currentUser, onClose }) {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestMedia();
    return () => cleanup();
  }, []);

  async function requestMedia() {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(media);
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      setError("Camera/microphone not accessible.");
    }
  }

  function cleanup() {
    stream?.getTracks()?.forEach((t) => t.stop());
  }

  function toggleCamera() {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  }

  function toggleMic() {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  }

  function joinZoom() {
    const parsed = parseZoomLink(event.zoomJoinUrl);
    if (!parsed) return alert("Invalid Zoom link.");

    const joinUrl = buildBrowserJoinUrl(
      parsed.meetingId,
      parsed.pwd,
      currentUser?.name || "Guest"
    );

    cleanup();
    window.open(joinUrl, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">

        <h2 className="text-xl font-semibold">Check your devices</h2>

        {/* Video preview */}
        <div className="bg-black rounded-md overflow-hidden h-48 flex items-center justify-center">
          {stream && cameraOn ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(video) => video && (video.srcObject = stream)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-300">Camera off</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={toggleCamera}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            {cameraOn ? "Turn camera off" : "Turn camera on"}
          </button>

          <button
            onClick={toggleMic}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            {micOn ? "Mute mic" : "Unmute mic"}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          onClick={joinZoom}
          className="w-full bg-blue-600 text-white p-2 rounded mt-2"
        >
          Join session
        </button>

        <button
          onClick={() => { cleanup(); onClose(); }}
          className="w-full text-gray-600 text-sm mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
