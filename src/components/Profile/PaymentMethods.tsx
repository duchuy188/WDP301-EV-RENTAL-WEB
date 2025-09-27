import React from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PaymentMethods: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phương thức thanh toán</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Visa ****1234</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Mặc định</p>
              </div>
            </div>
            <Badge variant="secondary">Chính</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-pink-600" />
              <div>
                <p className="font-medium">Ví MoMo</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">090****567</p>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            Thêm phương thức
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethods;