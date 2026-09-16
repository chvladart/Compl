import React, { useEffect, useMemo, useState } from 'react';
import { CardsView } from './components/CardsView';
import { CloudSyncModal } from './components/CloudSyncModal';
import { EmailExportModal } from './components/EmailExportModal';
import { FilterToolbar, GroupByMode, ViewMode } from './components/FilterToolbar';
import { Header } from './components/Header';
import { ItemModal } from './components/ItemModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { ProjectHero } from './components/ProjectHero';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { QrModal } from './components/QrModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { RoomsModal } from './components/RoomsModal';
import { SummaryView } from './components/SummaryView';
import { TableView } from './components/TableView';
import {
  INITIAL_ITEMS,
  INITIAL_PROJECT,
  INITIAL_ROOMS,
  MOCK_USER_CLIENT,
  MOCK_USER_CONTRACTOR,
  MOCK_USER_TEAM,
} from './data/initialData';
import {
  ClientApprovalStatus,
  ItemCategory,
  ItemStatus,
  Project,
  Room,
  SpecificationItem,
  UserProfile,
  UserRole,
} from './types';
import { exportSpecificationToExcel } from './utils/exportExcel';
import { exportSpecificationToPdf } from './utils/exportPdf';
import { calcItemTotal, CATEGORIES } from './utils/formatters';

export default function App() {
  // 1. App State
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [items, setItems] = useState<SpecificationItem[]>(INITIAL_ITEMS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [categories, setCategories] = useState<string[]>(
    INITIAL_PROJECT.categories && INITIAL_PROJECT.categories.length > 0
      ? INITIAL_PROJECT.categories
      : CATEGORIES
  );
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USER_TEAM);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Cloud sync state
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // 2. View & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupBy, setGroupBy] = useState<GroupByMode>('room');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [onlyWithDiscount, setOnlyWithDiscount] = useState(false);

  // 3. Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecificationItem | null>(null);
  const [defaultRoomIdForItem, setDefaultRoomIdForItem] = useState<string | undefined>();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState('');
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [lightboxAllPhotos, setLightboxAllPhotos] = useState<string[]>([]);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalItem, setQrModalItem] = useState<SpecificationItem | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Read URL query params on mount for role invitation (e.g. ?role=client or ?role=contractor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'client') {
      setCurrentUser(MOCK_USER_CLIENT);
    } else if (roleParam === 'contractor') {
      setCurrentUser(MOCK_USER_CONTRACTOR);
    }
  }, []);

  // Fetch initial cloud state
  useEffect(() => {
    fetch('/api/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
        if (data && data.project) {
          setProject(data.project);
        }
        setLastSyncedTime(new Date());
      })
      .catch((err) => {
        console.warn('Using local state, sync server offline:', err);
      });
  }, []);

  // Sync state with server helper
  const syncWithServer = async (updatedProject: Project, updatedItems: SpecificationItem[]) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: updatedProject,
          items: updatedItems,
        }),
      });
      setLastSyncedTime(new Date());
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  };

  // Manual sync trigger for cloud modal
  const handleManualSync = async () => {
    await syncWithServer(project, items);
  };

  // Items CRUD Handlers
  const handleSaveItem = (savedItem: SpecificationItem) => {
    let nextItems: SpecificationItem[];
    const exists = items.some((it) => it.id === savedItem.id);
    if (exists) {
      nextItems = items.map((it) => (it.id === savedItem.id ? savedItem : it));
    } else {
      nextItems = [savedItem, ...items];
    }
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Удалить эту позицию из ведомости комплектации?')) {
      const nextItems = items.filter((it) => it.id !== id);
      setItems(nextItems);
      syncWithServer(project, nextItems);
    }
  };

  const handleStatusChange = (id: string, newStatus: ItemStatus) => {
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, status: newStatus, updatedAt: new Date().toISOString() } : it
    );
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  const handleClientStatusChange = (
    id: string,
    newClientStatus: ClientApprovalStatus,
    comment?: string
  ) => {
    const nextItems = items.map((it) => {
      if (it.id !== id) return it;
      const updated: SpecificationItem = {
        ...it,
        clientStatus: newClientStatus,
        clientComment: comment !== undefined ? comment : it.clientComment,
        updatedAt: new Date().toISOString(),
      };
      if (newClientStatus === 'approved') {
        updated.status = 'approved';
      }
      return updated;
    });
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, quantity: newQty, updatedAt: new Date().toISOString() } : it
    );
    setItems(nextItems);
    syncWithServer(project, nextItems);
  };

  // Role Switcher Handler
  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'team') setCurrentUser(MOCK_USER_TEAM);
    else if (newRole === 'client') setCurrentUser(MOCK_USER_CLIENT);
    else if (newRole === 'contractor') setCurrentUser(MOCK_USER_CONTRACTOR);
  };

  // Direct Exports
  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportMessage('Генерация альбома спецификации в высоком качестве (PDF)...');
    try {
      const blob = await exportSpecificationToPdf(project, items);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Спецификация_${project.name}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('Ошибка при экспорте PDF');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportMessage('Формирование таблицы Excel с крупными фото и QR-кодами...');
    try {
      const blob = await exportSpecificationToExcel(project, items);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ведомость_${project.name}.xlsx`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('Ошибка при экспорте Excel');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  // Open modals helpers
  const handleOpenAddItem = (roomId?: string) => {
    setEditingItem(null);
    setDefaultRoomIdForItem(roomId);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: SpecificationItem) => {
    setEditingItem(item);
    setDefaultRoomIdForItem(item.roomId);
    setIsItemModalOpen(true);
  };

  const handleOpenLightbox = (mainPhoto: string, title: string, allPhotos?: string[]) => {
    setLightboxPhoto(mainPhoto);
    setLightboxTitle(title);
    setLightboxAllPhotos(allPhotos || [mainPhoto]);
    setIsLightboxOpen(true);
  };

  const handleOpenQrModal = (item: SpecificationItem) => {
    setQrModalItem(item);
    setIsQrModalOpen(true);
  };

  // Filtered Items Calculation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.article.toLowerCase().includes(q) ||
          item.dimensions.toLowerCase().includes(q) ||
          item.finish.toLowerCase().includes(q) ||
          item.techNotes.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Room filter
      if (selectedRoom !== 'all' && item.roomId !== selectedRoom) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // 5. Only with supplier discount
      if (onlyWithDiscount && item.supplierDiscount <= 0) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedRoom, selectedCategory, selectedStatus, onlyWithDiscount]);

  // Grouping Calculation for Table View
  const groupedTableData = useMemo(() => {
    if (groupBy === 'room') {
      return rooms
        .map((room) => {
          const roomItems = filteredItems.filter((it) => it.roomId === room.id);
          const totalAmount = roomItems.reduce(
            (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
            0
          );
          return {
            title: room.name,
            subtitle: room.area ? `Площадь: ${room.area} м²` : undefined,
            roomId: room.id,
            items: roomItems,
            totalAmount,
          };
        })
        .filter((g) => g.items.length > 0);
    }

    if (groupBy === 'category') {
      const catMap: Record<string, SpecificationItem[]> = {};
      filteredItems.forEach((it) => {
        if (!catMap[it.category]) catMap[it.category] = [];
        catMap[it.category].push(it);
      });
      return Object.entries(catMap).map(([cat, itms]) => ({
        title: cat,
        items: itms,
        totalAmount: itms.reduce(
          (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
          0
        ),
      }));
    }

    if (groupBy === 'status') {
      const statusMap: Record<string, SpecificationItem[]> = {};
      filteredItems.forEach((it) => {
        if (!statusMap[it.status]) statusMap[it.status] = [];
        statusMap[it.status].push(it);
      });
      return Object.entries(statusMap).map(([st, itms]) => ({
        title: `Статус: ${st}`,
        items: itms,
        totalAmount: itms.reduce(
          (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
          0
        ),
      }));
    }

    // None
    return [
      {
        title: 'Все позиции спецификации',
        items: filteredItems,
        totalAmount: filteredItems.reduce(
          (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
          0
        ),
      },
    ];
  }, [filteredItems, groupBy, rooms]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-amber-500 selection:text-black ${
        isDarkMode ? 'bg-[#0a0e17] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Header */}
      <Header
        project={project}
        user={currentUser}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        onOpenEmailExport={() => setIsEmailModalOpen(true)}
        onOpenRooms={() => setIsSettingsModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Export Loading Toast */}
      {isExporting && (
        <div className="fixed top-20 right-6 z-50 bg-[#162032] border border-amber-500/50 text-amber-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">{exportMessage}</span>
        </div>
      )}

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Project Hero Card */}
        <ProjectHero
          project={project}
          items={items}
          userRole={currentUser.role}
          isDarkMode={isDarkMode}
          onOpenAddItem={() => handleOpenAddItem()}
        />

        {/* Filter and View Switcher Toolbar */}
        <FilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRoom={selectedRoom}
          onRoomChange={setSelectedRoom}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onlyWithDiscount={onlyWithDiscount}
          onToggleOnlyWithDiscount={() => setOnlyWithDiscount((prev) => !prev)}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          rooms={rooms}
          categories={categories}
          isDarkMode={isDarkMode}
        />

        {/* Dynamic View Display */}
        {viewMode === 'table' && (
          <TableView
            groups={groupedTableData}
            userRole={currentUser.role}
            isDarkMode={isDarkMode}
            onEditItem={handleOpenEditItem}
            onDeleteItem={handleDeleteItem}
            onStatusChange={handleStatusChange}
            onClientStatusChange={handleClientStatusChange}
            onQuantityChange={handleQuantityChange}
            onOpenQr={handleOpenQrModal}
            onOpenPhoto={handleOpenLightbox}
            onAddItemToGroup={(roomId) => handleOpenAddItem(roomId)}
          />
        )}

        {viewMode === 'cards' && (
          <CardsView
            items={filteredItems}
            userRole={currentUser.role}
            isDarkMode={isDarkMode}
            onEditItem={handleOpenEditItem}
            onDeleteItem={handleDeleteItem}
            onStatusChange={handleStatusChange}
            onClientStatusChange={handleClientStatusChange}
            onQuantityChange={handleQuantityChange}
            onOpenQr={handleOpenQrModal}
            onOpenPhoto={handleOpenLightbox}
          />
        )}

        {viewMode === 'summary' && (
          <SummaryView
            project={project}
            items={items}
            rooms={rooms}
            userRole={currentUser.role}
            onSelectRoom={(roomId) => {
              setSelectedRoom(roomId);
              setViewMode('table');
            }}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setViewMode('table');
            }}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-[#162032] py-4 px-6 text-center text-xs text-slate-500 bg-[#0d121c]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            COMPLSPEC STUDIO &bull; Профессиональный сервис комплектации интерьеров
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Габариты Ш × Г × В в мм</span>
            <span>&bull;</span>
            <span>Скидки от поставщиков</span>
            <span>&bull;</span>
            <span>High-Res Экспорт & QR-коды</span>
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        rooms={rooms}
        categories={categories}
        isDarkMode={isDarkMode}
        defaultRoomId={defaultRoomIdForItem}
      />

      <PhotoLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        currentPhoto={lightboxPhoto}
        title={lightboxTitle}
        allPhotos={lightboxAllPhotos}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        item={qrModalItem}
        projectName={project.name}
      />

      <EmailExportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        project={project}
        items={items}
      />

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        user={currentUser}
        onUpdateRole={handleRoleChange}
        onUpdateUser={setCurrentUser}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        project={project}
        items={items}
        lastSyncedTime={lastSyncedTime}
        onManualSync={handleManualSync}
        onImportProjectData={({ project: newProj, items: newItems }) => {
          setProject(newProj);
          setItems(newItems);
          syncWithServer(newProj, newItems);
        }}
      />

      <RoomsModal
        isOpen={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
        rooms={rooms}
        onAddRoom={(newRoom) => {
          const updated = [...rooms, newRoom];
          setRooms(updated);
        }}
        onDeleteRoom={(id) => {
          setRooms(rooms.filter((r) => r.id !== id));
        }}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={project}
        rooms={rooms}
        categories={categories}
        isDarkMode={isDarkMode}
        onSaveProject={(updatedProject, updatedRooms, updatedCategories) => {
          const finalProject = { ...updatedProject, categories: updatedCategories };
          setProject(finalProject);
          setRooms(updatedRooms);
          setCategories(updatedCategories);
          syncWithServer(finalProject, items);
        }}
      />
    </div>
  );
}
