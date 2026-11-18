// Native WebVTT cues share the video's clock, including pauses and seeks.
// The hidden track supplies timing without drawing subtitles over the film.
export function connectDiscLyrics({ video, trackElement, container, text, accessibleText }) {
  const track = trackElement.track;
  let currentLine = "";

  function render() {
    const line = video.ended || video.error ? "" : Array.from(track.activeCues || [])
      // Browsers may expose both cues at a shared boundary; only the new one belongs here.
      .filter(cue => cue.startTime <= video.currentTime && video.currentTime < cue.endTime)
      .map(cue => cue.text.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
    if (line === currentLine) return;
    currentLine = line;
    text.textContent = line;
    accessibleText.textContent = line;
    container.hidden = !line;
  }

  track.addEventListener("cuechange", render);
  trackElement.addEventListener("load", render);
  for (const event of ["timeupdate", "seeked", "ended", "error", "emptied"]) {
    video.addEventListener(event, render);
  }

  return () => {
    // Called only by the explicit play action, alongside the video URL.
    if (!trackElement.hasAttribute("src")) trackElement.src = trackElement.dataset.src;
    track.mode = "hidden";
    render();
  };
}
