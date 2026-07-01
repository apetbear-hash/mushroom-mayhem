const BASE = import.meta.env.BASE_URL;

export function HowToPlayVideo() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0B0705', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        src={`${BASE}how-to-play.mp4`}
        controls
        autoPlay
        style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
      />
    </div>
  );
}
