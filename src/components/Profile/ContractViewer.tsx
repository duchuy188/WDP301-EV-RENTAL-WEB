import React, { useState, useEffect } from 'react';
import { contractAPI } from '@/api/constractAPI';
import { Loader2 } from 'lucide-react';
import { toast } from '@/utils/toast';

interface ContractViewerProps {
  contractId: string;
}

const ContractViewer: React.FC<ContractViewerProps> = ({ contractId }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractHtml = async () => {
      try {
        setLoading(true);
        const html = await contractAPI.getContractHtml(contractId);
        setHtmlContent(html);
      } catch (error: any) {
        console.error('Error fetching contract HTML:', error);
        toast.error('Lỗi', 'Không thể tải nội dung hợp đồng');
      } finally {
        setLoading(false);
      }
    };

    fetchContractHtml();
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Đang tải hợp đồng...</span>
      </div>
    );
  }

  return (
    <div className="contract-viewer-container bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Render HTML content */}
      <div 
        className="contract-html-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      
      {/* Custom styles for the contract */}
      <style>{`
        .contract-viewer-container {
          max-width: 100%;
          overflow-x: auto;
        }
        
        .contract-html-content {
          padding: 20px;
        }
        
        /* Preserve contract styles */
        .contract-html-content body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
        }
        
        .contract-html-content .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .contract-html-content .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #2c5530;
          margin-bottom: 10px;
        }
        
        .contract-html-content .contract-title {
          font-size: 20px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        
        .contract-html-content .contract-code {
          font-size: 16px;
          color: #666;
        }
        
        .contract-html-content .section {
          margin-bottom: 20px;
        }
        
        .contract-html-content .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2c5530;
          text-transform: uppercase;
        }
        
        .contract-html-content .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .contract-html-content .info-table td {
          padding: 8px;
          border: 1px solid #ddd;
          vertical-align: top;
        }
        
        .contract-html-content .info-table .label {
          font-weight: bold;
          background-color: #f5f5f5;
          width: 30%;
        }
        
        .contract-html-content .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .contract-html-content .signature-box {
          text-align: center;
          flex: 1;
          min-width: 250px;
        }
        
        .contract-html-content .signature-box img {
          max-width: 200px;
          max-height: 100px;
          border: 1px solid #ddd;
          margin: 10px auto;
        }
        
        .contract-html-content .signature-label {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .contract-html-content .terms {
          margin-top: 30px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .contract-html-content .terms h2 {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
          color: #2c5530;
        }
        
        .contract-html-content .terms h3 {
          font-size: 16px;
          font-weight: bold;
          margin-top: 20px;
          margin-bottom: 10px;
          color: #2c5530;
        }
        
        .contract-html-content .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        /* Dark mode adjustments */
        .dark .contract-html-content {
          color: #e5e7eb;
        }
        
        .dark .contract-html-content .header {
          border-bottom-color: #4b5563;
        }
        
        .dark .contract-html-content .info-table td {
          border-color: #4b5563;
        }
        
        .dark .contract-html-content .info-table .label {
          background-color: #374151;
        }
        
        .dark .contract-html-content .footer {
          border-top-color: #4b5563;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .contract-html-content .signature-section {
            flex-direction: column;
          }
          
          .contract-html-content .info-table .label {
            width: 40%;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractViewer;

