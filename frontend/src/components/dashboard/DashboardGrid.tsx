'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Widget } from '@/types/dashboard'
import KpiCard from './KpiCard'
import ChartWidget from './ChartWidget'

interface DashboardGridProps {
  widgets: Widget[]
  isEditing: boolean
  onReorder: (newWidgets: Widget[]) => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}

interface SortableItemProps {
  widget: Widget
  isEditing: boolean
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}

function SortableItem({ widget, isEditing, onRename, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing w-8 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-blue-200 transition-colors"
          title="Drag to reorder"
        >
          <svg
            className="w-4 h-3 text-gray-500"
            fill="none"
            viewBox="0 0 16 12"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <line x1="2" y1="2" x2="14" y2="2" strokeLinecap="round" />
            <line x1="2" y1="6" x2="14" y2="6" strokeLinecap="round" />
            <line x1="2" y1="10" x2="14" y2="10" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <div className={isEditing ? 'mt-4' : ''}>
        {widget.type === 'kpi' ? (
          <KpiCard
            widget={widget}
            isEditing={isEditing}
            onRename={onRename}
            onDelete={onDelete}
          />
        ) : (
          <ChartWidget
            widget={widget}
            isEditing={isEditing}
            onRename={onRename}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  )
}

function WidgetItem({ widget, isEditing, onRename, onDelete }: SortableItemProps) {
  return (
    <div>
      {widget.type === 'kpi' ? (
        <KpiCard
          widget={widget}
          isEditing={isEditing}
          onRename={onRename}
          onDelete={onDelete}
        />
      ) : (
        <ChartWidget
          widget={widget}
          isEditing={isEditing}
          onRename={onRename}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

export default function DashboardGrid({
  widgets,
  isEditing,
  onReorder,
  onRename,
  onDelete,
}: DashboardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const sorted = [...widgets].sort((a, b) => a.position - b.position)

  const kpiWidgets = sorted.filter((w) => w.type === 'kpi')
  const chartWidgets = sorted.filter((w) => w.type === 'chart')
  const allSorted = [...kpiWidgets, ...chartWidgets]
  const ids = allSorted.map((w) => w.id)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = allSorted.findIndex((w) => w.id === active.id)
    const newIndex = allSorted.findIndex((w) => w.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(allSorted, oldIndex, newIndex).map((w, i) => ({
      ...w,
      position: i,
    }))
    onReorder(reordered)
  }

  if (!isEditing) {
    return (
      <div className="dashboard-grid space-y-6">
        {kpiWidgets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {kpiWidgets.map((w) => (
              <WidgetItem
                key={w.id}
                widget={w}
                isEditing={false}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
        {chartWidgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chartWidgets.map((w) => (
              <WidgetItem
                key={w.id}
                widget={w}
                isEditing={false}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Editing mode with drag-and-drop — all widgets in unified grid
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="dashboard-grid">
          {kpiWidgets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {kpiWidgets.map((w) => (
                <SortableItem
                  key={w.id}
                  widget={w}
                  isEditing={isEditing}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
          {chartWidgets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chartWidgets.map((w) => (
                <SortableItem
                  key={w.id}
                  widget={w}
                  isEditing={isEditing}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
