import { Plane, Globe, Zap } from 'lucide-react';

export default function BackgroundElements() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 right-10 opacity-10">
        <Plane className="text-white w-[200px] h-[200px] transform -rotate-12" />
      </div>
      <div className="absolute bottom-10 right-20 opacity-8">
        <Globe className="text-indigo-400 w-[250px] h-[250px]" />
      </div>
      <div className="absolute top-1/3 right-1/4 opacity-5">
        <Zap className="text-white w-[100px] h-[100px] transform rotate-45" />
      </div>
    </div>
  );
}
