import { MapPin, Calendar, Clock } from 'lucide-react';
import TicketCard from './TicketCard';

export interface PerformanceCardProps {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  seat: string;
  performers: string;
  description: string;
  imageUrl: string;
  tags: string[];
  accentColor?: string;
}

export default function PerformanceCard({
  title,
  venue,
  date,
  time,
  seat,
  performers,
  description,
  imageUrl,
  tags,
  accentColor,
}: PerformanceCardProps) {
  return (
    <div className="group relative bg-white cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      {/* Ticket Preview */}
      <div className="p-6 border-gray-100 w-fit">
        <TicketCard
          title={title}
          venue={venue}
          seat={seat}
          date={date}
          time={time}
          performers={performers}
          imageUrl={imageUrl}
          accentColor={accentColor}
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 border-t">
        {/* Header with likes */}
        <div className="flex items-start justify-between">
          <h3 className="flex-1 pr-4">{title}</h3>
        </div>

        {/* Details */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-sm">{venue}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-sm">{date}</span>
            <Clock className="w-4 h-4 shrink-0 ml-2" />
            <span className="text-sm">{time}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
