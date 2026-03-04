import { Card, CardContent } from '@/components/ui/card';

const StatsCard = ({ title, value, icon: Icon, color = 'primary', isSelected = false, onClick, compact = false }) => {
  const colorClasses = {
    primary: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
    secondary: 'bg-gray-500/10 text-gray-600 border-gray-200/50',
    success: 'bg-green-500/10 text-green-600 border-green-200/50',
    cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-200/50',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
    destructive: 'bg-red-500/10 text-red-600 border-red-200/50',
    info: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
  };

  if (compact) {
    return (
      <Card 
        className={`
          hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer
          ${isSelected ? 'shadow-lg' : 'shadow-sm'}
        `}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex flex-col items-center gap-2">
            <div className={`p-2 rounded-lg border ${colorClasses[color]} transition-all duration-300`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">{value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{title}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`
        hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer
        ${isSelected ? 'shadow-lg' : 'shadow-sm'}
      `}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-4xl font-bold mt-2 bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">{value}</p>
          </div>
          <div className={`p-4 rounded-xl border-2 ${colorClasses[color]} transition-all duration-300 hover:scale-110`}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
