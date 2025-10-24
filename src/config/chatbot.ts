export const CHATBOT = {
  defaultSystemMessage:
    'Chào bạn! Mình là trợ lý ảo của EV Rental. Hãy hỏi mình về dịch vụ, đặt xe, hay hỗ trợ kỹ thuật.',
  appTitle: 'EV Chatbot',
  aiButtonLabel: 'Trợ lý AI',
  historyButtonLabel: 'Lịch sử chat',
  suggestionPrefix: 'Gợi ý: ',
  inputPlaceholder: 'Nhập tin nhắn...',
  sendButton: 'Gửi',
  sendingButton: 'Đang gửi...',
  assistantFallback: 'Xin lỗi, hiện tại tôi không thể phản hồi.',
  toastErrorTitle: 'Lỗi',
  toastErrorMessage: 'Không thể liên hệ với chatbot',
  roleLabels: {
    assistant: 'Chatbot',
    user: 'Bạn',
  },
  suggestedQuestions: [
    'Tôi muốn thuê xe điện ở Quận 1',
    'Giá thuê xe điện là bao nhiêu?',
    'Có những loại xe nào?',
    'Quy trình thuê xe như thế nào?',
  ],
};

export type ChatbotConfig = typeof CHATBOT;
