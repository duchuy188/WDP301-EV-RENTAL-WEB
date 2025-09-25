import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfileStats: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Tổng chuyến đi:</span>
            <span className="font-semibold">15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Điểm đánh giá:</span>
            <span className="font-semibold text-yellow-600">4.8/5 ⭐</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Tổng tiết kiệm:</span>
            <span className="font-semibold text-green-600">2.5kg CO₂</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileStats;