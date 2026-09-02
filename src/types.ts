export type WarehouseId = '4_HARASH' | '1_TALMID';

export interface LogisticsDictionaryItem {
  sku: string;
  officialName: string;
  category: string;
  unit: string;
  keywords: string;
  defaultWarehouse?: WarehouseId;
  depositType?: 'bigBag' | 'pallet' | 'none';
  weightKg?: number;
}

export type OrderStatus = 'Pending' | 'In Progress' | 'Delivered' | 'בסידור עבודה' | 'הועמס במחסן' | 'בדרך לאתר' | 'סופק בהצלחה' | 'מועד האספקה מתאפס - בבדיקה מחדש';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  depositType?: 'bigBag' | 'pallet' | 'none';
}

export interface Order {
  orderNumber: string;
  orderId?: string; // Table 2: Order_ID alias
  customerNumber: string;
  customerName: string;
  siteAddress: string;
  destination?: string; // Table 2: Destination alias
  city: string;
  warehouse: WarehouseId;
  warehouseName: string;
  itemsFormatted: string;
  itemsDetails?: string; // Table 2: Items_Details structured output
  itemsList?: OrderItem[];
  bigBagsDeposit: number;
  palletsDeposit: number;
  assignedDriver: string;
  driver?: string; // Table 2: Driver alias
  driverId?: string;
  driverPhone?: string;
  status: OrderStatus;
  deliveryNote: string;
  wazeUrl: string;
  totalWeightKg: number;
  isCraneRequired: boolean;
  scheduledTime: string;
  round?: string;
  notes?: string;
  orderDocumentUrl?: string;
  orderDocumentName?: string;
  customerFolderUrl?: string;
  directSheetViewUrl?: string;
  orderContact?: string;
  orderAgent?: string;
  orderDate?: string;
  orderFileBase64?: string;
  deliveredAt?: string;
  signatureReceived?: boolean;
  signatureImage?: string;
  deliveryNotePdfUrl?: string;
  isSynced?: boolean;
}

export interface DeliveryNoteRecord {
  id: string;
  orderId: string;
  customerName: string;
  destination: string;
  driver: string;
  itemsDetails: string;
  deliveryNotePdf: string;
  customerSignature?: string;
  isSigned: boolean;
  syncStatus: boolean;
  createdAt: string;
  signedAt?: string;
}

export interface NormalizedOrderExtraction {
  customerName?: string;
  destination?: string;
  city?: string;
  assignedDriver?: string;
  normalizedItemsString: string;
  rawText: string;
  items: Array<{
    sku: string;
    officialName: string;
    quantity: number;
    unit: string;
    matchedKeyword: string;
  }>;
  bigBags: number;
  pallets: number;
  isCraneRequired: boolean;
}

export interface MorningTask {
  round: string;
  orderId: string;
  customerName: string;
  warehouse: string;
  address: string;
  driver: string;
  items: string;
  deposits: string;
  wazeLink: string;
  status: string;
  whatsappBrief: string;
}

export interface DriverInfo {
  id: string;
  name: string;
  role: string;
  truckModel: string;
  truckPlate: string;
  capacityTon: number;
  hasCrane: boolean;
  phone: string;
  currentWarehouse: WarehouseId;
  status: 'active' | 'loading' | 'delivering' | 'idle';
  currentLocationName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'noa';
  text: string;
  timestamp: string;
  audioBase64?: string;
  isPlayingAudio?: boolean;
}

export interface EmailOrder {
  orderNumber: string;
  customerNumber: string;
  customerName: string;
  siteAddress: string;
  city: string;
  warehouse: WarehouseId;
  warehouseName: string;
  items: OrderItem[];
  itemsFormatted: string;
  bigBagsDeposit: number;
  palletsDeposit: number;
  assignedDriver: string;
  driverId: string;
  driverPhone: string;
  status: string;
  isCraneRequired: boolean;
  totalWeightKg: number;
  scheduledTime: string;
  wazeUrl: string;
  emailMeta: {
    messageId: string;
    senderEmail: string;
    senderName: string;
    recipientEmail: string;
    subject: string;
    sentAt: string;
    systemOrigin: string;
    securityInfo: string;
    importanceNote: string;
    pdfFileName: string;
    pdfFileSize: string;
    pdfDriveUrl: string;
    driveFolderUrl: string;
    driveFolderName: string;
  };
  orderDocumentUrl: string;
  orderDocumentName: string;
}

export interface SystemInfo {
  connectionStatus: string;
  spreadsheetId: string;
  sheetUrl: string;
  unifiedSheetUrl: string;
  gasEndpoint: string;
  oneSignalAppId: string;
  driveCustomerFoldersUrl: string;
  driveDeliveryNotesFolderUrl: string;
}
