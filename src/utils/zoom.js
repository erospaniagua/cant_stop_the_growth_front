// utils/zoom.js

// Extract meetingId + pwd from ANY Zoom URL
export function parseZoomLink(raw) {
  try {
    const url = new URL(raw);

    // Extract ID from /j/xxxx or /w/xxxx or /s/xxxx
    const parts = url.pathname.split("/");
    const joinIndex = parts.findIndex(p => ["j", "w", "s"].includes(p));

    if (joinIndex === -1 || !parts[joinIndex + 1]) {
      return null;
    }

    const meetingId = parts[joinIndex + 1];
    const pwd = url.searchParams.get("pwd") || null;

    return { meetingId, pwd };
  } catch {
    return null;
  }
}


// Build Zoom’s browser join URL (this NEVER includes raw URLs)
export function buildBrowserJoinUrl(meetingId, pwd, username = "Guest") {
  const encodedName = encodeURIComponent(username);

  let url = `https://zoom.us/wc/${meetingId}/join?uname=${encodedName}`;

  if (pwd) {
    url += `&pwd=${encodeURIComponent(pwd)}`;
  }

  return url;
}
