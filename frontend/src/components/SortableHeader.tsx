import { Group, Table, Text, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import type { ReactNode } from 'react'

interface Props {
  column: string
  sort?: string
  direction?: 'asc' | 'desc'
  onSort: (column: string) => void
  children: ReactNode
  align?: 'left' | 'right'
}

export function SortableHeader({ column, sort, direction, onSort, children, align = 'left' }: Props) {
  const active = sort === column
  const Icon = active ? (direction === 'desc' ? IconChevronDown : IconChevronUp) : IconSelector
  return (
    <Table.Th
      ta={align}
      aria-sort={active ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <UnstyledButton onClick={() => onSort(column)}>
        <Group gap={4} wrap="nowrap" justify={align === 'right' ? 'flex-end' : 'flex-start'}>
          <Text fw={600} size="sm">
            {children}
          </Text>
          <Icon size={14} stroke={1.5} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}
