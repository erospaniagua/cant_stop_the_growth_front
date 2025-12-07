export function parseZoomLink(url) {
  try {
    const u = new URL(url);

    // Extract meeting ID from last part of path
    const pathParts = u.pathname.split("/");
    const meetingId = pathParts[pathParts.length - 1];

    // Extract password
    const pwd = u.searchParams.get("pwd") || "";

    return { meetingId, pwd };
  } catch (err) {
    console.error("Invalid Zoom URL:", url);
    return { meetingId: null, pwd: null };
  }
}

export function buildBrowserJoinUrl(meetingId, pwd, userName) {
  if (!meetingId) return null;
  const encodedName = encodeURIComponent(userName || "Guest");
  const encodedPwd = pwd ? `&pwd=${pwd}` : "";

  return `https://zoom.us/wc/${meetingId}/join?uname=${encodedName}${encodedPwd}`;
}
