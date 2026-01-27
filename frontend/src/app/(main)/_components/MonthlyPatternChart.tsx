'use client';

import { EmotionStatSummary } from '@/lib/types/profile';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyPatternChartProps {
  emotions: EmotionStatSummary;
}

export default function MonthlyPatternChart({
  emotions,
}: MonthlyPatternChartProps) {
  const [isInitialRender, setIsInitialRender] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const emotionData = emotions.emotion.map((emotion) => {
    return {
      subject: emotion.emotion,
      A: emotion.count,
    };
  });

  if (emotionData.length < 1) return null;

  return (
    <>
      <div className="h-44 w-full mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            responsive
            data={emotionData}
          >
            <PolarGrid stroke="var(--polar-grid-stroke)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fontSize: 10,
                fill: theme === 'dark' ? '#E6E7EB' : '#333333',
                fontWeight: 500,
              }}
            />
            <Radar
              name="Emotion"
              dataKey="A"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.15}
              dot={false}
              activeDot={false}
              isAnimationActive={isInitialRender}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
