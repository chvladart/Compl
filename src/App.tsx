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
import { ProjectSwitcherModal } from './components/ProjectSwitcherModal';
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
  ProjectBundle,
  Room,
  SpecificationItem,
  UserProfile,
  UserRole,
} from './types';
import { exportSpecificationToExcel } from './utils/exportExcel';
import { exportSpecificationToPdf } from './utils/exportPdf';
import { calcItemTotal, CATEGORIES } from './utils/formatters';

const INITIAL_BUNDLE: ProjectBundle = {
  project: INITIAL_PROJECT,
  items: INITIAL_ITEMS,
  rooms: INITIAL_ROOMS,
  categories:
    INITIAL_PROJECT.categories && INITIAL_PROJECT.categories.length > 0
      ? INITIAL_PROJECT.categories
      : CATEGORIES,
};

export default function App() {
  // 1. App State — a project bundle owns its own items, rooms & categories,
  // which lets the app hold any number of independent projects at once.
  const [projects, setProjects] = useState<ProjectBundle[]>([INITIAL_BUNDLE]);
  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECT.id);
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USER_TEAM);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const activeBundle = useMemo(
    () => projects.find((b) => b.project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );
  const project = activeBundle.project;
  const items = activeBundle.items;
  const rooms = activeBundle.rooms;
  const categories = activeBundle.categories;

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
  const [isProjectSwitcherOpen, setIsProjectSwitcherOpen] = useState(false);

  // Reset item-list filters whenever the active project changes so filters
  // from one project don't leak into another.
  useEffect(() => {
    setSearchQuery('');
    setSelectedRoom('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setOnlyWithDiscount(false);
  }, [activeProjectId]);

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

  // Fetch initial cloud state (all projects + which one was active)
  useEffect(() => {
    fetch('/api/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          if (data.activeProjectId) {
            setActiveProjectId(data.activeProjectId);
          }
        }
        setLastSyncedTime(new Date());
      })
      .catch((err) => {
        console.warn('Using local state, sync server offline:', err);
      });
  }, []);

  // Sync state with server helper — sends every project so all connected
  // devices can see the full list, not just the one currently open.
  const syncWithServer = async (nextProjects: ProjectBundle[], nextActiveId: string) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: nextProjects,
          activeProjectId: nextActiveId,
        }),
      });
      setLastSyncedTime(new Date());
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  };

  // Manual sync trigger for cloud modal
  const handleManualSync = async () => {
    await syncWithServer(projects, activeProjectId);
  };

  // Applies a patch to the currently active project bundle only, optionally
  // pushing the result to the cloud sync server.
  const updateActiveProject = (
    patch: Partial<ProjectBundle> | ((bundle: ProjectBundle) => Partial<ProjectBundle>),
    sync = false
  ) => {
    setProjects((prev) => {
      const next = prev.map((b) => {
        if (b.project.id !== activeProjectId) return b;
        const patchObj = typeof patch === 'function' ? patch(b) : patch;
        return { ...b, ...patchObj };
      });
      if (sync) syncWithServer(next, activeProjectId);
      return next;
    });
  };

  // Project management handlers
  const handleCreateProject = (newProject: Project) => {
    const bundle: ProjectBundle = {
      project: newProject,
      items: [],
      rooms: newProject.rooms,
      categories:
        newProject.categories && newProject.categories.length > 0
          ? newProject.categories
          : CATEGORIES,
    };
    setProjects((prev) => {
      const next = [...prev, bundle];
      syncWithServer(next, newProject.id);
      return next;
    });
    setActiveProjectId(newProject.id);
  };

  const handleSwitchProject = (id: string) => {
    setActiveProjectId(id);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert('Нельзя удалить последний проект. Сначала создайте другой проект.');
      return;
    }
    if (
      !window.confirm(
        'Удалить этот проект вместе со всей ведомостью комплектации без возможности восстановления?'
      )
    ) {
      return;
    }
    setProjects((prev) => {
      const next = prev.filter((b) => b.project.id !== id);
      const nextActiveId = activeProjectId === id ? next[0].project.id : activeProjectId;
      syncWithServer(next, nextActiveId);
      if (activeProjectId === id) {
        setActiveProjectId(nextActiveId);
      }
      return next;
    });
  };

  // Items CRUD Handlers
  const handleSaveItem = (savedItem: SpecificationItem) => {
    updateActiveProject((b) => {
      const exists = b.items.some((it) => it.id === savedItem.id);
      const nextItems = exists
        ? b.items.map((it) => (it.id === savedItem.id ? savedItem : it))
        : [savedItem, ...b.items];
      return { items: nextItems };
    }, true);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Удалить эту позицию из ведомости комплектации?')) {
      updateActiveProject((b) => ({ items: b.items.filter((it) => it.id !== id) }), true);
    }
  };

  const handleStatusChange = (id: string, newStatus: ItemStatus) => {
    updateActiveProject(
      (b) => ({
        items: b.items.map((it) =>
          it.id === id ? { ...it, status: newStatus, updatedAt: new Date().toISOString() } : it
        ),
      }),
      true
    );
  };

  const handleClientStatusChange = (
    id: string,
    newClientStatus: ClientApprovalStatus,
    comment?: string
  ) => {
    updateActiveProject(
      (b) => ({
        items: b.items.map((it) => {
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
        }),
      }),
      true
    );
  };

  const handleQuantityChange = (id: string, newQty: number) => {
    updateActiveProject(
      (b) => ({
        items: b.items.map((it) =>
          it.id === id ? { ...it, quantity: newQty, updatedAt: new Date().toISOString() } : it
        ),
      }),
      true
    );
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
        onOpenProjects={() => setIsProjectSwitcherOpen(true)}
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
          updateActiveProject((b) => ({ project: { ...newProj, id: b.project.id }, items: newItems }), true);
        }}
      />

      <RoomsModal
        isOpen={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
        rooms={rooms}
        onAddRoom={(newRoom) => {
          updateActiveProject((b) => ({ rooms: [...b.rooms, newRoom] }));
        }}
        onDeleteRoom={(id) => {
          updateActiveProject((b) => ({ rooms: b.rooms.filter((r) => r.id !== id) }));
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
          updateActiveProject(
            () => ({ project: finalProject, rooms: updatedRooms, categories: updatedCategories }),
            true
          );
        }}
      />

      <ProjectSwitcherModal
        isOpen={isProjectSwitcherOpen}
        onClose={() => setIsProjectSwitcherOpen(false)}
        projects={projects.map((b) => b.project)}
        itemCounts={Object.fromEntries(projects.map((b) => [b.project.id, b.items.length]))}
        activeProjectId={activeProjectId}
        isDarkMode={isDarkMode}
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
}
