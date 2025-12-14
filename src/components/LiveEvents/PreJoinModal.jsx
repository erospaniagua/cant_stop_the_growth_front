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
    } catch {
      setError("Camera or microphone not accessible.");
    }
  }

  function cleanup() {
    stream?.getTracks()?.forEach((t) => t.stop());
  }

  function toggleCamera() {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }

  function toggleMic() {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="
        w-full max-w-md rounded-xl p-6 space-y-5
        bg-white dark:bg-neutral-900
        text-neutral-900 dark:text-neutral-100
        shadow-xl border
        border-neutral-200 dark:border-neutral-800
      ">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Check your devices</h2>
          <button
            onClick={() => { cleanup(); onClose(); }}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Video preview */}
        <div className="
          h-48 rounded-lg overflow-hidden
          bg-neutral-900 flex items-center justify-center
          border border-neutral-700
        ">
          {stream && cameraOn ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => el && (el.srcObject = stream)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-neutral-400 text-sm">
              Camera is off
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={toggleCamera}
            className={`
              flex-1 py-2 rounded-md text-sm font-medium
              transition
              ${cameraOn
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"}
            `}
          >
            {cameraOn ? "Turn camera off" : "Turn camera on"}
          </button>

          <button
            onClick={toggleMic}
            className={`
              flex-1 py-2 rounded-md text-sm font-medium
              transition
              ${micOn
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"}
            `}
          >
            {micOn ? "Mute mic" : "Unmute mic"}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        {/* Join */}
        <button
          onClick={joinZoom}
          className="
            w-full py-2 rounded-md font-semibold
            bg-green-600 text-white
            hover:bg-green-500 transition
          "
        >
          Join session
        </button>

        <p className="text-xs text-center text-neutral-500">
          Your camera and microphone can be changed later.
        </p>
      </div>
    </div>
  );
}
