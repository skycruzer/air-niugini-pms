export default function BackgroundElements() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 right-10 opacity-10">
        <span className="text-white text-[200px] transform -rotate-12 block">✈️</span>
      </div>
      <div className="absolute bottom-10 right-20 opacity-8">
        <span className="text-air-niugini-gold text-[250px] block">🌍</span>
      </div>
      <div className="absolute top-1/3 right-1/4 opacity-5">
        <span className="text-white text-[100px] transform rotate-45 block">⚡</span>
      </div>
    </div>
  );
}
