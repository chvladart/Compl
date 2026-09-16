export type ItemCategory = string;

export type ClientApprovalStatus =
  | 'pending'          // На рассмотрении
  | 'approved'         // Согласовано заказчиком
  | 'attention'        // Обратить внимание / Вопрос
  | 'change_requested'; // Запрос на замену / аналог

export type ItemStatus =
  | 'in_selection'       // В подборе / Идея
  | 'approved'           // Согласовано
  | 'invoice_issued'     // Счёт выставлен
  | 'paid_in_production' // Оплачено / В производстве
  | 'shipping'           // В доставке
  | 'on_site'            // На объекте
  | 'installed';         // Смонтировано

export interface Room {
  id: string;
  name: string;
  area: number; // м²
}

export interface SpecificationItem {
  id: string;
  projectId?: string;            // ID проекта, к которому относится позиция
  code: string;                  // e.g. "M-01", "CT-01"
  name: string;                  // Наименование
  roomId: string;                // ID помещения
  roomName: string;              // Название помещения
  category: string;              // Категория (динамическая)
  subcategory: string;           // Подкатегория
  brand: string;                 // Бренд / Фабрика / Мастерская
  article: string;               // Артикул / Модель
  dimensions: string;            // Габариты, мм (Ш × Г × В)
  finish: string;                // Отделка / Материал / RAL / Цвет
  quantity: number;              // Количество
  unit: string;                  // Единица измерения (шт, компл., уп., м², пог. м, л)
  basePrice: number;             // Базовая цена за единицу (₸)
  supplierDiscount: number;      // Скидка заказчику от поставщика (%)
  mainPhoto: string;             // Основное фото (URL или base64)
  additionalPhotos: string[];    // Дополнительные фото (детали, чертежи, фактуры)
  status: ItemStatus;            // Статус комплектации
  clientStatus?: ClientApprovalStatus; // Статус со стороны клиента (согласовано / внимание / замена)
  clientComment?: string;        // Замечание или вопрос клиента
  deliveryTime: string;          // Срок поставки / готовности
  supplier: string;              // Поставщик / Салон / Контакт
  link: string;                  // Ссылка на товар или чертеж
  techNotes: string;             // Техническое задание / Примечания строителям
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  area: number;
  totalBudget: number;
  description: string;
  rooms: Room[];
  categories?: string[];
}

export type UserRole = 'team' | 'client' | 'contractor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  roleTitle: string;
  organization?: string;
}
